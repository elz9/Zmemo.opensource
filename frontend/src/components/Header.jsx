import React from 'react';
import { Mail, Search, BarChart3, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import logo from '../assets/icon.png';

const Header = ({ stats, onShowStats }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex h-full items-center justify-between px-6">
                {/* Left side - Logo and Brand */}
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center">
                        <img src={logo} alt="Zmemo Logo" className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-black">Zmemo</h1>
                        <p className="text-xs text-gray-600">Local Search Engine</p>
                    </div>
                </div>

                {/* Center - Search */}
                

                {/* Right side - Stats and Settings */}
               
            </div>
        </header>
    );
};

export default Header;
