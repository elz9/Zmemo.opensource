import React from 'react';
import ErrorBanner from './ErrorBanner';
import SearchArea from './SearchArea';
import ResultsColumn from './ResultsColumn';

const ViewTabContent = ({
    error,
    stats,
    onSearch,
    loading,
    results,
    currentQuery,
    onOpenInGmail,
    onOpenThread,
    openThread
}) => {
    return (
        <div className="space-y-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-blue-50/5 to-purple-50/10 opacity-30 pointer-events-none"></div>
            

            {error && <ErrorBanner error={error} />}

            <div className="relative">
                <SearchArea
                    onSearch={onSearch}
                    loading={loading}
                    totalEmails={stats?.total_emails?.toLocaleString() || 0}
                />
            </div>
            
            <div className="grid gap-6 relative">
                <ResultsColumn
                    loading={loading}
                    results={results}
                    currentQuery={currentQuery}
                    onOpenInGmail={onOpenInGmail}
                    onOpenThread={onOpenThread}
                    activeThread={openThread}
                />
            </div>
        </div>
    );
};

export default ViewTabContent;
