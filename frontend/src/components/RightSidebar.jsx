import React, { useEffect, useRef, useState } from 'react';
import { Layers3, Search, Mail, CheckCircle2, Loader2, Paperclip } from 'lucide-react';
import { cn } from '../lib/utils';

const MIN_WIDTH = 300;
const MAX_WIDTH = 680;

const RightSidebar = ({
    stats,
    currentQuery,
    resultsCount,
    onClearThread,
    width,
    onResize,
    threadLoading,
    threadContent,
    onOpenInGmail
}) => {
    const [isSessionOpen, setIsSessionOpen] = useState(false);
    const sessionRef = useRef(null);
    const isResizingRef = useRef(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sessionRef.current && !sessionRef.current.contains(event.target)) {
                setIsSessionOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleMouseMove = (event) => {
            if (!isResizingRef.current || !onResize) {
                return;
            }

            const nextWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - event.clientX));
            onResize(nextWidth);
        };

        const handleMouseUp = () => {
            if (!isResizingRef.current) {
                return;
            }
            isResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onResize]);

    const startResizing = () => {
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    return (
        <aside
            className="fixed right-0 top-16 z-20 flex h-screen flex-col border-l border-gray-300 bg-white"
            style={{ width: `${width}px` }}
        >
            <div
                role="separator"
                aria-orientation="vertical"
                onMouseDown={startResizing}
                className="absolute left-0 top-0 h-full w-1 -translate-x-1/2 cursor-col-resize"
            />

            <div className="relative border-b border-gray-300 px-4 py-4" ref={sessionRef}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-300 bg-white shadow-sm">
                            <Layers3 className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold tracking-tight text-black">
                                Workspace
                            </h2>
                            <p className="text-[11px] text-gray-600">
                                Thread viewer
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsSessionOpen((v) => !v)}
                        className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                            "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        )}
                    >
                        Session
                    </button>
                </div>

                {isSessionOpen && (
                    <div className="absolute right-4 top-full z-30 mt-2 w-64 space-y-3 rounded-xl border border-gray-300 bg-white p-3 shadow-lg animate-slide-down">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                            Current Session
                        </p>
                        <InfoRow
                            icon={<Search className="h-3.5 w-3.5" />}
                            label="Query"
                            value={currentQuery ? `"${currentQuery}"` : 'No active query'}
                        />
                        <InfoRow
                            icon={<Mail className="h-3.5 w-3.5" />}
                            label="Results"
                            value={`${resultsCount} email${resultsCount === 1 ? '' : 's'}`}
                        />
                        <InfoRow
                            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            label="Indexed"
                            value={`${stats?.total_emails?.toLocaleString() || 0}`}
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                    Thread Details
                </h3>
                <button
                    onClick={onClearThread}
                    disabled={!threadContent}
                    className="text-xs font-medium text-gray-600 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Clear
                </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {threadLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="mb-3 h-5 w-5 animate-spin text-gray-600" />
                        <p className="text-xs text-gray-600">Loading thread...</p>
                    </div>
                ) : threadContent ? (
                    threadContent.emails.map((email) => (
                        <article key={email.id} className="rounded-lg border border-gray-300 p-3">
                            <div className="mb-2 flex items-start justify-between gap-2">
                                <h4 className="truncate text-xs font-semibold text-black">
                                    {email.subject || '(no subject)'}
                                </h4>
                                <span className="text-[10px] text-gray-600">
                                    {new Date(email.timestamp * 1000).toLocaleString()}
                                </span>
                            </div>

                            <p className="mb-2 text-[11px] text-gray-600">From: {email.sender}</p>
                            {email.recipients && (
                                <p className="mb-2 text-[11px] text-gray-600">
                                    To: {Array.isArray(email.recipients) ? email.recipients.join(', ') : email.recipients}
                                </p>
                            )}

                            <div
                                className="prose prose-sm max-w-none text-xs leading-relaxed text-gray-700"
                                dangerouslySetInnerHTML={{ __html: email.body_clean || '' }}
                            />

                            <div className="mt-3 flex items-center justify-between">
                                {email.attachment_names && email.attachment_names.length > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-600">
                                        <Paperclip className="h-3 w-3" />
                                        {email.attachment_names.length} attachment(s)
                                    </span>
                                ) : (
                                    <span />
                                )}
                                {email.gmail_id && (
                                    <button
                                        onClick={() => onOpenInGmail(email.gmail_id)}
                                        className="text-[10px] font-medium text-gray-600 hover:text-black"
                                    >
                                        Open in Gmail
                                    </button>
                                )}
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Mail className="mb-3 h-6 w-6 text-gray-400" />
                        <p className="text-xs text-gray-600">
                            Click View Thread on any result to load the conversation here.
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-2.5">
        <div className="mt-0.5 text-gray-600">{icon}</div>
        <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600">{label}</p>
            <p className="truncate text-xs text-gray-700">{value}</p>
        </div>
    </div>
);

export default RightSidebar;
