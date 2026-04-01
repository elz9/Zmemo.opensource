import React from 'react';
import { RefreshCw, CheckCircle2, Clock, Link2 } from 'lucide-react';
import { cn } from '../lib/utils';

const SyncStatus = ({ status, stats, onSync, onConnect, compact }) => {
    const isConnected = status?.is_connected || false;
    const isSyncing = status?.status === 'running';

    if (!isConnected) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="font-medium text-black">Ready to connect</span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-600">
                    Connect your Gmail account to begin local indexing.
                </p>

                <button
                    onClick={onConnect}
                    className={cn(
                        "h-9 w-full rounded-lg",
                        "bg-black",
                        "text-white",
                        "text-xs font-medium tracking-wide",
                        "hover:bg-gray-800",
                        "transition-colors duration-200",
                        "flex items-center justify-center gap-1.5"
                    )}
                >
                    <Link2 className="h-3.5 w-3.5" />
                    Connect Gmail
                </button>

                {!status && (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Connecting...</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isSyncing ? (
                        <RefreshCw className="h-3 w-3 animate-spin text-gray-600" />
                    ) : (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    )}
                    <span className="text-xs font-medium text-black">
                        {isSyncing ? 'Syncing' : 'Connected'}
                    </span>
                </div>

                <button
                    onClick={onSync}
                    disabled={isSyncing}
                    className={cn(
                        "h-8 w-8 rounded-lg",
                        "flex items-center justify-center",
                        "text-gray-600",
                        "hover:bg-gray-100",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-colors duration-200"
                    )}
                    title="Sync now"
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                </button>
            </div>

            <p className="text-[11px] text-gray-600">
                {isSyncing 
                    ? `${status?.total_processed || 0} processed`
                    : stats?.last_sync 
                        ? `Last sync: ${new Date(stats.last_sync * 1000).toLocaleTimeString()}`
                        : 'No sync yet'
                }
            </p>

            {isSyncing && (
                <div className="space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full bg-black animate-pulse w-[60%]" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SyncStatus;
