import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorBanner = ({ error }) => {
    return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm animate-slide-down">
            <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <div>
                    <p className="text-sm font-medium text-red-700">Something went wrong</p>
                    <p className="mt-1 text-xs text-red-700">{error}</p>
                </div>
            </div>
        </div>
    );
};

export default ErrorBanner;
