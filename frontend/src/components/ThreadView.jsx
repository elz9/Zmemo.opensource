/**
 * ThreadView — elegant email thread viewer modal
 */

import React, { useEffect, useState, useCallback } from "react";
import { X, Loader2, ExternalLink, Paperclip, Zap } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// Generate gradient based on string
function getGradientBg(str) {
    const colors = [
        'from-zinc-500 to-zinc-700',
        'from-slate-500 to-slate-700',
        'from-gray-500 to-gray-700',
        'from-neutral-500 to-neutral-700',
        'from-stone-500 to-stone-700',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

const Badge = ({ children, className, variant = 'default' }) => {
    const variants = {
        default: "bg-secondary text-secondary-foreground border-border",
        decision: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        attachment: "bg-muted text-muted-foreground border-border",
    };

    return (
        <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
};

const Spinner = () => (
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
);

function formatDate(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp * 1000).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function parseSenderName(sender) {
    const match = sender?.match(/^([^<]+)</);
    return match ? match[1].trim() : sender ?? "Unknown";
}

function parseSenderEmail(sender) {
    const match = sender?.match(/<([^>]+)>/);
    return match ? match[1] : sender ?? "";
}

function EmailCard({ email, index, total, onOpenInGmail }) {
    const [expanded, setExpanded] = useState(index === total - 1);
    const senderName = parseSenderName(email.sender);
    const attachments = Array.isArray(email.attachment_names)
        ? email.attachment_names
        : JSON.parse(email.attachment_names || "[]");
    const gradient = getGradientBg(senderName);

    return (
        <div
            className={cn(
                "rounded-2xl bg-card shadow-sm hover:shadow-md transition-all duration-300",
                expanded ? "shadow-lg" : ""
            )}
        >
            <button
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
            >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm",
                            gradient
                        )}>
                            {senderName.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">
                                {senderName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {parseSenderEmail(email.sender)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(email.timestamp)}
                    </span>
                    <div className="flex gap-1.5">
                        {email.is_decision && (
                            <Badge variant="decision" className="gap-1">
                                <Zap className="h-3 w-3" />
                                Decision
                            </Badge>
                        )}
                        {attachments.length > 0 && (
                            <Badge variant="attachment" className="gap-1">
                                <Paperclip className="h-3 w-3" />
                                {attachments.length}
                            </Badge>
                        )}
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-4 animate-fade-in">
                    {email.recipients && email.recipients.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                            <span className="font-medium">To:</span>{" "}
                            {(Array.isArray(email.recipients)
                                ? email.recipients
                                : JSON.parse(email.recipients || "[]")
                            ).join(", ")}
                        </p>
                    )}

                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto rounded-xl bg-muted/30 p-4">
                        {email.body_clean || <span className="text-muted-foreground italic">(no body)</span>}
                    </div>

                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Attachments</p>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((name, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium"
                                    >
                                        <Paperclip className="h-3 w-3" />
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            onClick={() => onOpenInGmail(email.gmail_id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open in Gmail
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ThreadView({ threadId, onClose, onOpenInGmail, className }) {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadThread = useCallback(async () => {
        if (!threadId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await invoke("get_thread", { threadId });
            const data = JSON.parse(response);
            setEmails(data.emails ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [threadId]);

    useEffect(() => {
        loadThread();
    }, [loadThread]);

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose?.(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4",
                "bg-black/60 backdrop-blur-md animate-fade-in"
            )}
            role="dialog"
            aria-label="Email thread"
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                className={cn(
                    "flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl bg-background shadow-2xl",
                    "animate-scale-in",
                    className
                )}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-background rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <span className="text-base font-semibold text-foreground">Thread</span>
                        {!loading && (
                            <Badge>
                                {emails.length} email{emails.length !== 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
                        aria-label="Close thread"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <Spinner />
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                            <p className="text-sm text-destructive">Failed to load thread: {error}</p>
                            <button onClick={loadThread} className="text-sm underline underline-offset-2 hover:no-underline mt-2">Retry</button>
                        </div>
                    )}

                    {!loading && !error && emails.length === 0 && (
                        <p className="py-16 text-center text-sm text-muted-foreground">
                            No emails found in this thread.
                        </p>
                    )}

                    {!loading && !error && emails.map((email, i) => (
                        <EmailCard
                            key={email.gmail_id ?? i}
                            email={email}
                            index={i}
                            total={emails.length}
                            onOpenInGmail={onOpenInGmail}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
