import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const SearchBar = ({ onSearch, loading }) => {
    const [query, setQuery] = useState('');
    const debounceTimer = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            onSearch(query);
        }, 200);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [query, onSearch]);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setQuery('');
            inputRef.current?.focus();
        }
    };

    return (
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <Search className={cn(
                    "h-5 w-5 transition-all duration-200",
                    query ? "text-black" : "text-gray-600"
                )} />
            </div>

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search emails..."
                    className={cn(
                        "relative h-12 w-full pl-12 pr-12 rounded-2xl",
                        "bg-white border-2 border-gray-200 shadow-sm",
                        "text-black placeholder-gray-400",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        "focus:shadow-lg transition-all duration-200",
                        "text-sm"
                    )}
                    autoFocus
                />
                
                {loading ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                    </div>
                ) : query && (
                    <button
                        className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105"
                        onClick={() => setQuery('')}
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
