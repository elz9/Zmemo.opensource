import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import Header from './components/Header';
import HowItWorks from './components/HowItWorks';
import SplashScreen from './components/SplashScreen';
import ViewTabContent from './components/app/ViewTabContent';
import StatsPanelModal from './components/app/StatsPanelModal';
import { runAutoUpdater } from './lib/autoUpdater';

function App() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        sender: '',
        domain: '',
        date_from: '',
        date_to: '',
        has_attachments: false,
        is_decision: false
    });

    const [currentQuery, setCurrentQuery] = useState('');
    const [showSplash, setShowSplash] = useState(true);
    const [openThread, setOpenThread] = useState(null);
    const [threadContent, setThreadContent] = useState(null);
    const [threadLoading, setThreadLoading] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [activeTab, setActiveTab] = useState('view'); // 'view' or 'how-it-works'
    const [rightSidebarWidth, setRightSidebarWidth] = useState(380);

    useEffect(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
    }, []);

    useEffect(() => {
        runAutoUpdater();
    }, []);

    useEffect(() => {
        // Start backend on app launch
        invoke('start_backend')
            .then(() => {
                console.log('Backend started successfully');
                setError(null);
            })
            .catch(err => {
                console.error('Backend startup error:', err);
                // Don't set error immediately - the backend might already be running
                // Let the fetchSyncStatus call determine if there's actually a problem
            });

        // Poll sync status every 5 seconds
        const interval = setInterval(fetchSyncStatus, 5000);
        fetchSyncStatus();

        return () => clearInterval(interval);
    }, []);

    const fetchSyncStatus = async () => {
        try {
            const response = await invoke('get_sync_status');
            const status = JSON.parse(response);
            setSyncStatus(status);
            setStats({
                total_emails: status.total_emails || 0,
                decision_emails: status.decision_emails || 0,
                last_sync: status.last_sync
            });
            // Clear any previous backend connection errors
            setError(null);
        } catch (error) {
            console.warn('Backend polling error:', error);
            // Only set error if we haven't successfully connected yet
            if (!syncStatus) {
                setError('Connection issue detected. Please check your Gmail authentication.');
            }
        }
    };

    const handleSearch = useCallback(async (query) => {
        setCurrentQuery(query);
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await invoke('search_emails', {
                query: {
                    query: query,
                    filters: filters,
                    limit: 50
                }
            });
            const data = JSON.parse(response);
            setResults(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
            setError('Search failed. Please try again or check your connection.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const handleStartSync = async () => {
        try {
            await invoke('start_sync');
            fetchSyncStatus();
        } catch (error) {
            console.error('Sync failed:', error);
            setError('Failed to start synchronization.');
        }
    };

    const handleConnectGmail = async () => {
        setError(null);
        try {
            await invoke('connect_gmail');
            await handleStartSync();
        } catch (error) {
            console.error('Connection error:', error);
            setError('Failed to connect Gmail. Please ensure you have configured your credentials correctly.');
        }
    };

    const handleDisconnect = async () => {
        try {
            await invoke('disconnect_gmail');
            fetchSyncStatus(); // Refresh status to show disconnected
        } catch (error) {
            console.error('Disconnect failed:', error);
            setError('Failed to disconnect Gmail.');
        }
    };

    const handleOpenInGmail = (gmailId) => {
        const url = `https://mail.google.com/mail/u/0/#all/${gmailId}`;
        window.open(url, '_blank');
    };

    const handleOpenThread = async (threadId) => {
        // If clicking the same thread, close it
        if (openThread === threadId) {
            handleCloseThread();
            return;
        }

        setThreadLoading(true);
        setError(null);
        
        try {
            const response = await invoke('get_thread', { threadId });
            const data = JSON.parse(response);
            
            setThreadContent({
                threadId,
                emails: data.emails || []
            });
            setOpenThread(threadId);
        } catch (error) {
            console.error('Failed to fetch thread:', error);
            setError('Failed to load thread content.');
            setThreadContent(null);
            setOpenThread(null);
        } finally {
            setThreadLoading(false);
        }
    };

    const handleCloseThread = () => {
        setThreadContent(null);
        setOpenThread(null);
    };

    return (
        <div className="min-h-screen bg-white text-black">
            {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

            {/* Fixed Header */}
            <Header
                stats={stats}
                onShowStats={() => setShowStats(true)}
            />

            {/* Fixed Sidebar positioned below header */}
            <Sidebar
                status={syncStatus}
                stats={stats}
                onSync={handleStartSync}
                onConnect={handleConnectGmail}
                onDisconnect={handleDisconnect}
                filters={filters}
                onFiltersChange={setFilters}
                onShowStats={() => setShowStats(true)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Main Content Area with adjusted top margin */}
            <main className="ml-64 mt-16 min-h-screen flex-1" style={{ marginRight: `${rightSidebarWidth}px` }}>
                <div className="w-full px-6 py-8 lg:px-10">
                    {/* Show HowItWorks when that tab is active */}
                    {activeTab === 'how-it-works' ? (
                        <HowItWorks />
                    ) : (
                        <ViewTabContent
                            error={error}
                            stats={stats}
                            onSearch={handleSearch}
                            loading={loading}
                            results={results}
                            currentQuery={currentQuery}
                            onOpenInGmail={handleOpenInGmail}
                            onOpenThread={handleOpenThread}
                            openThread={openThread}
                        />
                    )}
                </div>
            </main>

            <RightSidebar
                stats={stats}
                currentQuery={currentQuery}
                resultsCount={results.length}
                onClearThread={handleCloseThread}
                width={rightSidebarWidth}
                onResize={setRightSidebarWidth}
                threadLoading={threadLoading}
                threadContent={threadContent}
                onOpenInGmail={handleOpenInGmail}
            />

            <StatsPanelModal show={showStats} onClose={() => setShowStats(false)} />
        </div>
    );
}

export default App;
