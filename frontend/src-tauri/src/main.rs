// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command as ProcessCommand, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::api::process::{Command as SidecarCommand, CommandChild, CommandEvent};
use tauri::{AppHandle, Manager, RunEvent, State};
use tokio::time::sleep;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const BACKEND_URL: &str = "http://127.0.0.1:8765";

struct AppState {
    backend_started: Mutex<bool>,
    backend_child: Mutex<Option<CommandChild>>,
}

#[derive(Serialize, Deserialize)]
struct SearchQuery {
    query: String,
    filters: Option<serde_json::Value>,
    limit: Option<usize>,
}

async fn backend_get(path: &str) -> Result<String, String> {
    let url = format!("{}{}", BACKEND_URL, path);
    let resp = reqwest::Client::new()
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    resp.text().await.map_err(|e| e.to_string())
}

async fn backend_post(path: &str, body: Option<serde_json::Value>) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("{}{}", BACKEND_URL, path);
    let req = match body {
        Some(b) => client.post(&url).json(&b),
        None => client.post(&url),
    };
    req.send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())
}

async fn backend_delete(path: &str) -> Result<String, String> {
    let url = format!("{}{}", BACKEND_URL, path);
    reqwest::Client::new()
        .delete(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())
}

fn stop_backend(state: &AppState) {
    if let Ok(mut child_slot) = state.backend_child.lock() {
        if let Some(child) = child_slot.take() {
            let pid = child.pid();
            let _ = child.kill();
            #[cfg(windows)]
            {
                // PyInstaller one-file sidecars can spawn a child process; kill the full tree.
                let mut kill = ProcessCommand::new("taskkill");
                kill.args(["/PID", &pid.to_string(), "/T", "/F"])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .creation_flags(0x08000000);
                let _ = kill.status();

                // Fallback for detached one-file child process.
                let mut kill_image = ProcessCommand::new("taskkill");
                kill_image
                    .args(["/IM", "backend.exe", "/T", "/F"])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .creation_flags(0x08000000);
                let _ = kill_image.status();
            }
        }
    }
    if let Ok(mut started) = state.backend_started.lock() {
        *started = false;
    }
}

fn resolve_runtime_paths(app: &AppHandle) -> Result<(PathBuf, PathBuf), String> {
    let app_data_dir = app
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Failed to resolve app data directory".to_string())?;
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {e}"))?;

    let credentials_dst = app_data_dir.join("credentials.json");
    if !credentials_dst.exists() {
        let bundled_credentials = app
            .path_resolver()
            .resolve_resource("resources/credentials.json")
            .or_else(|| app.path_resolver().resolve_resource("credentials.json"));

        if let Some(src) = bundled_credentials {
            fs::copy(&src, &credentials_dst)
                .map_err(|e| format!("Failed to copy bundled credentials: {e}"))?;
        }
    }

    if !credentials_dst.exists() {
        #[cfg(debug_assertions)]
        {
            let local_credentials = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("..")
                .join("..")
                .join("credentials.json");
            if local_credentials.exists() {
                fs::copy(&local_credentials, &credentials_dst)
                    .map_err(|e| format!("Failed to copy local credentials: {e}"))?;
            }
        }
    }

    if !credentials_dst.exists() {
        return Err(
            "OAuth credentials are missing. Rebuild installer with bundled credentials.json."
                .to_string(),
        );
    }

    Ok((app_data_dir, credentials_dst))
}

async fn wait_for_backend_ready(timeout: Duration) -> Result<(), String> {
    let start = Instant::now();
    while start.elapsed() < timeout {
        if backend_get("/stats").await.is_ok() {
            return Ok(());
        }
        sleep(Duration::from_millis(250)).await;
    }
    Err("Backend did not become ready in time".to_string())
}

#[cfg(debug_assertions)]
fn spawn_dev_backend(app_data_dir: &Path, credentials_path: &Path) -> Result<(), String> {
    let backend_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("backend");
    let venv_python = backend_dir.join("venv").join("Scripts").join("python.exe");

    let mut cmd = if venv_python.exists() {
        ProcessCommand::new(venv_python)
    } else {
        ProcessCommand::new("python")
    };

    cmd.args(["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8765"])
        .current_dir(&backend_dir)
        .env("GM_APP_DATA", app_data_dir)
        .env("GM_CREDENTIALS_PATH", credentials_path)
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(windows)]
    {
        // CREATE_NO_WINDOW
        cmd.creation_flags(0x08000000);
    }

    cmd.spawn()
        .map_err(|e| format!("Failed to start dev backend: {e}"))?;
    Ok(())
}

#[cfg(not(debug_assertions))]
fn spawn_release_sidecar(
    app: &AppHandle,
    state: &State<'_, AppState>,
    app_data_dir: &Path,
    credentials_path: &Path,
) -> Result<(), String> {
    let mut sidecar_env = HashMap::new();
    sidecar_env.insert(
        "GM_APP_DATA".to_string(),
        app_data_dir.to_string_lossy().to_string(),
    );
    sidecar_env.insert(
        "GM_CREDENTIALS_PATH".to_string(),
        credentials_path.to_string_lossy().to_string(),
    );

    let (mut rx, child): (tauri::async_runtime::Receiver<CommandEvent>, CommandChild) =
        SidecarCommand::new_sidecar("backend")
        .map_err(|e| format!("Failed to prepare backend sidecar: {e}"))?
        .envs(sidecar_env)
        .spawn()
        .map_err(|e| format!("Failed to spawn backend sidecar: {e}"))?;

    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Error(err) => eprintln!("[backend] sidecar error: {err}"),
                CommandEvent::Terminated(payload) => {
                    eprintln!("[backend] terminated: {payload:?}");
                    break;
                }
                CommandEvent::Stderr(line) => eprintln!("[backend] {line}"),
                _ => {}
            }
        }

        {
            let state = app_handle.state::<AppState>();
            if let Ok(mut started) = state.backend_started.lock() {
                *started = false;
            };
        }
    });

    let mut child_slot = state.backend_child.lock().unwrap();
    *child_slot = Some(child);
    Ok(())
}

#[tauri::command]
async fn start_backend(app: AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    if backend_get("/stats").await.is_ok() {
        let mut started = state.backend_started.lock().unwrap();
        *started = true;
        return Ok("Backend already running".to_string());
    }

    {
        let mut child_slot = state.backend_child.lock().unwrap();
        if let Some(child) = child_slot.take() {
            let _ = child.kill();
        }
    }

    let (app_data_dir, credentials_path) = resolve_runtime_paths(&app)?;

    #[cfg(debug_assertions)]
    {
        spawn_dev_backend(&app_data_dir, &credentials_path)?;
    }
    #[cfg(not(debug_assertions))]
    {
        spawn_release_sidecar(&app, &state, &app_data_dir, &credentials_path)?;
    }

    wait_for_backend_ready(Duration::from_secs(20)).await?;

    let mut started = state.backend_started.lock().unwrap();
    *started = true;
    Ok("Backend started".to_string())
}

#[tauri::command]
async fn search_emails(query: SearchQuery) -> Result<String, String> {
    backend_post("/search", Some(serde_json::to_value(query).unwrap())).await
}

#[tauri::command]
async fn start_sync() -> Result<String, String> {
    backend_post("/sync/start", None).await
}

#[tauri::command]
async fn get_sync_status() -> Result<String, String> {
    backend_get("/sync/status").await
}

#[tauri::command]
async fn connect_gmail() -> Result<String, String> {
    backend_post("/auth/connect", None).await
}

#[tauri::command]
async fn disconnect_gmail() -> Result<String, String> {
    backend_post("/auth/disconnect", None).await
}

#[tauri::command]
async fn delete_local_data() -> Result<String, String> {
    backend_delete("/data/delete").await
}

#[tauri::command]
async fn get_stats() -> Result<String, String> {
    backend_get("/stats").await
}

#[tauri::command]
async fn set_auto_sync_interval(minutes: u32) -> Result<String, String> {
    backend_post(
        "/sync/schedule",
        Some(serde_json::json!({ "interval_minutes": minutes })),
    )
    .await
}

#[tauri::command]
async fn get_thread(thread_id: String) -> Result<String, String> {
    backend_get(&format!("/thread/{}", thread_id)).await
}

fn main() {
    let app = tauri::Builder::default()
        .manage(AppState {
            backend_started: Mutex::new(false),
            backend_child: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            start_backend,
            search_emails,
            start_sync,
            get_sync_status,
            connect_gmail,
            disconnect_gmail,
            delete_local_data,
            get_stats,
            set_auto_sync_interval,
            get_thread,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if matches!(event, RunEvent::ExitRequested { .. } | RunEvent::Exit) {
            let state = app_handle.state::<AppState>();
            stop_backend(&state);
        }
    });
}
