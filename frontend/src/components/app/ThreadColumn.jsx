import React from 'react';
import { Mail, Paperclip } from 'lucide-react';

const ThreadColumn = ({ threadLoading, threadContent, onCloseThread }) => {
    return (
        <aside className="hidden xl:block">
            {threadLoading ? (
                <div className="sticky top-8 rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                    <div className="flex items-center justify-center py-10">
                        <div className="mr-3 h-6 w-6 animate-spin rounded-full border border-zinc-200 border-t-zinc-500 dark:border-zinc-700" />
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading thread...</span>
                    </div>
                </div>
            ) : threadContent ? (
                <div className="sticky top-8 rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                    <div className="mb-5 flex items-start justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800">
                        <div>
                            <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                                Thread Details
                            </h3>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {threadContent.emails.length} message{threadContent.emails.length === 1 ? '' : 's'}
                            </p>
                        </div>
                        <button
                            onClick={onCloseThread}
                            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto pr-1">
                        {threadContent.emails.map((email) => (
                            <article
                                key={email.id}
                                className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                <div className="mb-3 flex items-start gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <Mail className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <h4 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                {email.subject || '(no subject)'}
                                            </h4>
                                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                {new Date(email.timestamp * 1000).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                                            From: {email.sender}
                                        </div>
                                        {email.recipients && (
                                            <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                                                To: {Array.isArray(email.recipients) ? email.recipients.join(', ') : email.recipients}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="prose prose-sm max-w-none text-sm leading-relaxed text-zinc-700 dark:prose-invert dark:text-zinc-300"
                                    dangerouslySetInnerHTML={{ __html: email.body_clean || '' }}
                                />
                                {email.attachment_names && email.attachment_names.length > 0 && (
                                    <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                                        <Paperclip className="h-3 w-3 text-zinc-400" />
                                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                            {email.attachment_names.length} attachment(s)
                                        </span>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="sticky top-8 rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                    <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Thread Preview
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Select an email from the list to view the full conversation here.
                    </p>
                </div>
            )}
        </aside>
    );
};

export default ThreadColumn;
