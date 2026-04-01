import React from 'react';
import SearchBar from '../SearchBar';

const SearchArea = ({ onSearch, loading, totalEmails }) => {
    return (
        <div className="px-1">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl blur-xl"></div>
                <div className="relative">
                    <SearchBar onSearch={onSearch} loading={loading} />
                </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-gray-500">
                    Searching {totalEmails} indexed emails
                </p>
                {loading && (
                    <div className="flex items-center gap-1 text-[11px] text-blue-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <span>Searching...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchArea;
