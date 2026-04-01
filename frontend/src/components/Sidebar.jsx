import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Link2, User, LogOut, ChevronUp, Inbox, Zap, Search, HelpCircle } from 'lucide-react';
import SyncStatus from './SyncStatus';
import { cn } from '../lib/utils';
import logo from '../assets/icon.png';

const Sidebar = ({ status, stats, onSync, onConnect, onDisconnect, filters, onFiltersChange, onShowStats, activeTab, onTabChange }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <aside className="fixed left-0 top-16 z-20 flex h-screen w-64 flex-col border-r border-gray-300 bg-white backdrop-blur">
            <div className="px-3 py-3">
                <div className="space-y-1 rounded-xl border border-gray-300 bg-white/80 p-1.5 shadow-sm">
                    <button
                        onClick={() => onTabChange('view')}
                        className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                            activeTab === 'view'
                                ? "bg-black text-white"
                                : "text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        <Search className="h-3.5 w-3.5" />
                        Search View
                    </button>
                    <button
                        onClick={() => onTabChange('how-it-works')}
                        className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                            activeTab === 'how-it-works'
                                ? "bg-black text-white"
                                : "text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        <HelpCircle className="h-3.5 w-3.5" />
                        How It Works
                    </button>
                </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
                <section className="space-y-2">
                    <h2 className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                        Connection
                    </h2>
                    <div className="rounded-xl border border-gray-300 bg-white p-3 shadow-sm">
                        <SyncStatus
                            status={status}
                            stats={stats}
                            onSync={onSync}
                            onConnect={onConnect}
                            compact
                        />
                    </div>
                </section>

                <section className="space-y-2">
                    <h2 className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                        Overview
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                        <StatCard
                            icon={<Inbox className="h-3.5 w-3.5" />}
                            label="Indexed"
                            value={stats?.total_emails?.toLocaleString() || 0}
                        />
                        <StatCard
                            icon={<Zap className="h-3.5 w-3.5" />}
                            label="Decisions"
                            value={stats?.decision_emails?.toLocaleString() || 0}
                        />
                    </div>

                    <button
                        onClick={onShowStats}
                        className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors",
                            "border-gray-300 bg-white text-black hover:bg-gray-100"
                        )}
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        View Statistics
                    </button>

                    {!status?.is_connected && status?.total_emails > 0 && (
                        <button
                            onClick={onConnect}
                            className={cn(
                                "flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors",
                                "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100",
                                "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            )}
                        >
                            <Link2 className="h-3.5 w-3.5" />
                            Reconnect
                        </button>
                    )}
                </section>
            </div>

            {/* Footer - Always at Bottom */}
            <div className="relative border-t border-gray-300 p-2" ref={profileRef}>
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-xl p-2 transition-colors",
                        isProfileOpen ? "bg-gray-100" : "hover:bg-gray-100"
                    )}
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                        <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-xs font-medium text-black" title={status?.email_address}>
                            {status?.email_address || 'Not Connected'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                            {status?.is_connected ? 'Connected' : 'Offline'}
                        </p>
                    </div>
                    <ChevronUp className={cn("h-4 w-4 text-zinc-400 transition-transform duration-200", isProfileOpen && "rotate-180")} />
                </button>
                {isProfileOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-gray-300 bg-white p-3 shadow-lg animate-slide-up z-50">
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">Account</p>
                                <p className="mt-1 truncate text-xs font-medium text-black" title={status?.email_address}>
                                    {status?.email_address || 'Not Connected'}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    {status?.is_connected ? 'Connected' : 'Offline'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">Status</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        status?.is_connected
                                            ? status?.status === 'running'
                                                ? "bg-amber-500 animate-pulse"
                                                : "bg-emerald-500"
                                            : "bg-zinc-400"
                                    )} />
                                    <span className="text-xs text-gray-600">
                                        {status?.status === 'running' ? 'Syncing...' :
                                            status?.is_connected ? 'Connected' : 'Disconnected'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        onDisconnect();
                                        setIsProfileOpen(false);
                                    }}
                                    disabled={!status?.is_connected}
                                    className={cn(
                                        "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                                        "text-red-600 hover:bg-red-50",
                                        "disabled:cursor-not-allowed disabled:opacity-50"
                                    )}
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-xl p-2 transition-colors",
                        isProfileOpen ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    )}
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <User className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            {status?.email_address ? status.email_address.split('@')[0] : 'Guest'}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
                            {status?.is_connected ? 'Connected' : 'Offline'}
                        </p>
                    </div>
                    <ChevronUp className={cn("h-4 w-4 text-zinc-400 transition-transform duration-200", isProfileOpen && "rotate-180")} />
                </button>
            </div>
        </aside>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="rounded-xl border border-zinc-200/80 bg-white/90 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="mb-1 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            {icon}
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">{label}</span>
        </div>
        <div className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {value}
        </div>
    </div>
);

export default Sidebar;
