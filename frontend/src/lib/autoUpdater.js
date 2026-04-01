import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { relaunch } from '@tauri-apps/api/process';

const isTauriRuntime = () =>
    typeof window !== 'undefined' && typeof window.__TAURI_IPC__ === 'function';

export async function runAutoUpdater() {
    if (!isTauriRuntime() || import.meta.env.DEV) {
        return;
    }

    try {
        const { shouldUpdate, manifest } = await checkUpdate();
        if (!shouldUpdate) {
            return;
        }

        const version = manifest?.version || 'a newer version';
        const shouldInstall = window.confirm(
            `Update available (${version}). Install now? The app will restart after installation.`
        );

        if (!shouldInstall) {
            return;
        }

        await installUpdate();
        await relaunch();
    } catch (error) {
        console.warn('Auto-update check failed:', error);
    }
}
