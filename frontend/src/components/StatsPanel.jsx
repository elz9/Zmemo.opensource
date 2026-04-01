/**
 * StatsPanel — elegant index health dashboard
 */

import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, X, Clock, Database, Mail, Inbox, Zap } from 'lucide-react';
import { invoke } from "@tauri-apps/api/tauri";

const cn = (...c) => c.filter(Boolean).join(" ");

const Card = ({ children, className }) => (
    <div className={cn("rounded-xl bg-card shadow-sm", className)}>{children}</div>
);

function formatDate(ts) {
    if (!ts || ts === 0) return "Never";
    return new Date(ts * 1000).toLocaleString(undefined, {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function pct(n) {
    return `${(n * 100).toFixed(1)}%`;
}

function MetricCard({ icon: Icon, title, value, sub, color = 'zinc' }) {
    const colorClasses = {
        zinc: "from-zinc-50 to-zinc-100 dark:from-zinc-900/50 dark:to-zinc-800/50 text-zinc-600 dark:text-zinc-300",
        blue: "from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-600 dark:text-blue-300",
        green: "from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50 text-green-600 dark:text-green-300",
        purple: "from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 text-purple-600 dark:text-purple-300",
    };

    return (
        <div className={cn(
            "rounded-2xl bg-gradient-to-br p-5",
            colorClasses[color]
        )}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{Icon}</span>
            </div>
            <div className="space-y-1">
                <p className="text-3xl font-bold text-foreground">{value}</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
        </div>
    );
}

function StatusCard({ title, status, subtitle, children }) {
    const statusConfig = {
        active: { label: 'Active', class: 'bg-emerald-500' },
        manual: { label: 'Manual', class: 'bg-zinc-400' },
        ready: { label: 'Ready', class: 'bg-emerald-500' },
        building: { label: 'Building', class: 'bg-amber-500' },
    };
    const config = statusConfig[status] || statusConfig.manual;

    return (
        <div className="rounded-2xl bg-card shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", config.class, status === 'building' && "animate-pulse")} />
                    <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                </div>
            </div>
            {children && <div>{children}</div>}
        </div>
    );
}

function AutoSyncControl({ currentInterval, onSave, saving }) {
    const [value, setValue] = useState(currentInterval ?? 30);
    const options = [
        { label: "Disabled", value: 0 },
        { label: "Every 15 min", value: 15 },
        { label: "Every 30 min", value: 30 },
        { label: "Every 1 hour", value: 60 },
        { label: "Every 3 hours", value: 180 },
    ];

    useEffect(() => {
        setValue(currentInterval ?? 30);
    }, [currentInterval]);

    return (
        <div className="flex items-center gap-3">
            <select
                className="flex h-11 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/10"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            <button
                onClick={() => onSave(value)}
                disabled={saving || value === currentInterval}
                className={cn(
                    "inline-flex h-11 items-center rounded-xl px-5 text-sm font-medium transition-all duration-200",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                )}
            >
                {saving ? "Saving..." : "Save"}
            </button>
        </div>
    );
}

function CacheBar({ hitRate, hits, misses }) {
    const w = Math.round(hitRate * 100);
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{hits} hits</span>
                <span className="font-medium">{pct(hitRate)} hit rate</span>
                <span>{misses} misses</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-zinc-400 to-zinc-600 dark:from-zinc-300 dark:to-zinc-500 transition-all duration-500"
                    style={{ width: `${w}%` }}
                />
            </div>
        </div>
    );
}

export default function StatsPanel({ onClose }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const response = await invoke("get_stats");
            const parsed = JSON.parse(response);
            setStats({
                ...parsed,
                auto_sync_interval: Number.isFinite(Number(parsed.auto_sync_interval))
                    ? Number(parsed.auto_sync_interval)
                    : 30,
            });
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const id = setInterval(fetchStats, 10_000);
        return () => clearInterval(id);
    }, [fetchStats]);

    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose?.(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    const handleSaveInterval = async (minutes) => {
        setSaving(true);
        try {
            const response = await invoke("set_auto_sync_interval", { minutes });
            const parsed = JSON.parse(response);
            const persistedInterval = Number.isFinite(Number(parsed.interval_minutes))
                ? Number(parsed.interval_minutes)
                : 30;
            setStats((prev) => (prev ? { ...prev, auto_sync_interval: persistedInterval } : prev));
            await fetchStats();
        } catch (err) {
            console.error("Failed to save interval:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-background shadow-2xl animate-scale-in overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Index Health</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Local observability dashboard</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchStats}
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
                            title="Refresh"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto p-6 space-y-5">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin mb-3" />
                            <p className="text-sm text-muted-foreground">Loading stats...</p>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                            <p className="text-sm text-destructive">Connection Error: {error}</p>
                        </div>
                    )}

                    {stats && (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <MetricCard
                                    icon={<Mail className="h-5 w-5" />}
                                    title="Emails"
                                    value={(stats.total_emails ?? 0).toLocaleString()}
                                    sub={`${(stats.total_threads ?? 0).toLocaleString()} threads`}
                                    color="zinc"
                                />
                                <MetricCard
                                    icon={<Database className="h-5 w-5" />}
                                    title="Storage"
                                    value={`${stats.db_size_mb ?? 0} MB`}
                                    sub=""
                                    color="green"
                                />
                                <MetricCard
                                    icon={<Inbox className="h-5 w-5" />}
                                    title="Unread"
                                    value={(stats.unread_emails ?? 0).toLocaleString()}
                                    color="blue"
                                />
                            </div>

                            {stats.cache && (
                                <StatusCard
                                    title="Search Cache"
                                    status="active"
                                    subtitle={`${stats.cache.entries}/${stats.cache.max_size} entries`}
                                >
                                    <div className="space-y-3">
                                        <CacheBar
                                            hitRate={stats.cache.hit_rate ?? 0}
                                            hits={stats.cache.hits ?? 0}
                                            misses={stats.cache.misses ?? 0}
                                        />
                                        <p className="text-xs text-muted-foreground">TTL {stats.cache.ttl_seconds}s · Cache invalidated on every sync</p>
                                    </div>
                                </StatusCard>
                            )}

                            <StatusCard
                                title="Semantic Search"
                                status={stats.embedder_fitted ? "ready" : "building"}
                                subtitle="TF-IDF Vector Engine"
                            >
                                <p className="text-sm text-muted-foreground">
                                    {stats.embedder_fitted
                                        ? "Vector re-ranking active. Results blended: 60% keyword + 40% semantic."
                                        : "Fitting TF-IDF model in background. Keyword-only search until ready."}
                                </p>
                            </StatusCard>

                            <div className="rounded-2xl bg-card shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">Auto-Sync Schedule</h3>
                                            <p className="text-sm text-muted-foreground">Configure automatic email synchronization</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Gmail Memory will sync new emails automatically. Set to "Disabled" to sync manually only.
                                </p>
                                <AutoSyncControl
                                    currentInterval={stats.auto_sync_interval ?? 30}
                                    onSave={handleSaveInterval}
                                    saving={saving}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
