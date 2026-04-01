import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import logo from '../assets/icon.png';

const SplashScreen = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Start fade out after 2.5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500);

        // Notify parent that animation is done after fade out transition
        const cleanupTimer = setTimeout(() => {
            onComplete();
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearTimeout(cleanupTimer);
        };
    }, [onComplete]);

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 transition-opacity duration-1000 ease-in-out",
                isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            {/* Subtle geometric background pattern */}
            <div className="absolute inset-0 overflow-hidden opacity-5">
                <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-20 left-32 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 text-center space-y-6">
                {/* Clean logo display */}
                <div className="flex justify-center mb-8">
                    <img 
                        src={logo} 
                        alt="Zmemo" 
                        className="w-16 h-16 object-contain"
                    />
                </div>
                

                {/* Elegant title */}
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-light text-gray-800 tracking-wide animate-[fadeIn_1s_ease-out]">
                        Zmemo
                    </h1>
                    <p className="text-lg text-gray-600 font-medium animate-[fadeIn_1.2s_ease-out]">
                        Local Email Search
                    </p>
                </div>

                {/* Simple loading dots */}
                <div className="flex justify-center space-x-2">
                    {[0, 1, 2].map((i) => (
                        <div 
                            key={i}
                            className="w-2 h-2 bg-gray-400 rounded-full animate-[fadeIn_1s_ease-out]"
                            style={{ animationDelay: `${i * 0.2}s` }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
