import React from 'react';
import { Search } from 'lucide-react';
import SearchResults from '../SearchResults';

const ResultsColumn = ({
    loading,
    results,
    currentQuery,
    onOpenInGmail,
    onOpenThread,
    activeThread
}) => {
    return (
        <div className="min-w-0">
            <div className="relative min-h-[420px] px-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="mb-3 h-6 w-6 animate-spin rounded-full border border-gray-300 border-t-black" />
                        <p className="text-xs text-gray-600">Scanning mailbox...</p>
                    </div>
                ) : results.length > 0 ? (
                    <SearchResults
                        results={results}
                        onOpenInGmail={onOpenInGmail}
                        onOpenThread={onOpenThread}
                        activeThread={activeThread}
                    />
                ) : currentQuery ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="max-w-xs">
                            <h3 className="mb-1 text-sm font-semibold text-black">No results found</h3>
                            <p className="text-xs text-gray-600">
                                Try different keywords
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="max-w-xs">
                            <h3 className="mb-1 text-sm font-semibold text-black">Start searching</h3>
                            <p className="text-xs text-gray-600">
                                Enter a query above to search your emails
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultsColumn;
