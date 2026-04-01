import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { ExternalLink, Paperclip, Zap, Mail, Calendar, User } from 'lucide-react';
import { cn } from '../lib/utils';

const SearchResults = ({ results, onOpenInGmail, onOpenThread, activeThread }) => {
    const getSenderName = (sender) => sender?.split('<')[0].trim() || sender || 'Unknown Sender';

    const ResultRow = ({ index, style }) => {
        const result = results[index];

        return (
            <div style={style} className="px-2 py-2">
                <article
                    className={cn(
                        "rounded-lg border border-zinc-200/80 p-3 transition-colors duration-150",
                        activeThread === result.thread_id
                            ? "border-zinc-300 bg-zinc-100/80"
                            : ""
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                >
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                result.is_decision
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-zinc-100 text-zinc-500"
                            )}>
                                {result.is_decision ? (
                                    <Zap className="h-3.5 w-3.5" />
                                ) : (
                                    <Mail className="h-3.5 w-3.5" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                    <h3 className="truncate text-sm font-semibold text-zinc-900">
                                        {result.subject || '(no subject)'}
                                    </h3>
                                    {result.is_decision && (
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                                            Decision
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-3 w-3" />
                                        <span className="max-w-44 truncate">{getSenderName(result.sender)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" />
                                        <span>{result.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {result.has_attachments && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                                <Paperclip className="h-3 w-3" />
                                {result.attachment_names?.length || 0}
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600">
                            <span
                                dangerouslySetInnerHTML={{ __html: result.snippet }}
                                className="highlighted-text"
                            />
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <button
                            onClick={() => onOpenThread(result.thread_id)}
                            className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900",
                                activeThread === result.thread_id ? "text-zinc-900" : ""
                            )}
                        >
                            <Mail className="h-3 w-3" />
                            View Thread
                        </button>

                        <button
                            onClick={() => onOpenInGmail(result.gmail_id)}
                            className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-medium",
                                "text-zinc-500 hover:text-zinc-900"
                            )}
                        >
                            <ExternalLink className="h-3 w-3" />
                            Open in Gmail
                        </button>
                    </div>
                </article>
            </div>
        );
    };

    if (!results || results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                    <Mail className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-zinc-900">
                    No emails found
                </h3>
                <p className="max-w-md text-sm text-zinc-500">
                    Try adjusting your search terms or filters to find what you're looking for.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="px-2 py-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        Search Results
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                        <span>{results.length}</span>
                        <span>emails found</span>
                    </div>
                </div>
            </div>

            <div className="px-1 py-1">
                <List
                    height={window.innerHeight - 250}
                    itemCount={results.length}
                    itemSize={158}
                    width="100%"
                    className="overflow-x-auto"
                >
                    {ResultRow}
                </List>
            </div>
        </div>
    );
};

export default SearchResults;
