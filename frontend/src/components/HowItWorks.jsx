import React from 'react';

const HowItWorks = () => {
    return (
        <div className="max-w-4xl mx-auto py-8 px-6 animate-fade-in">
            <header className="mb-12">
                <h1 className="text-4xl font-bold text-black mb-4">
                    How Zmemo Works
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                    A comprehensive guide to understanding Zmemo, the local-first email search application
                    that puts you in control of your email data.
                </p>
            </header>

            <article className="space-y-12">
                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        What is Zmemo?
                    </h2>
                    <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed">
                            Zmemo is a local-first email search application that indexes your Gmail
                            and provides incredibly fast search across your entire email history. Unlike Gmail's search,
                            which sends your queries to Google's servers, Zmemo keeps everything on your device -
                            your emails never leave your computer.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        Getting Started
                    </h2>
                    <div className="space-y-4">
                        <div className="border-l-4 border-gray-300 pl-6">
                            <h3 className="text-lg font-medium text-black mb-2">
                                Step 1: Connect Your Gmail Account
                            </h3>
                            <p className="text-gray-700">
                                Click "Connect Gmail" in the sidebar and authorize with your Google account.
                                We only request read-only access, ensuring your emails remain secure.
                            </p>
                        </div>
                        <div className="border-l-4 border-gray-300 pl-6">
                            <h3 className="text-lg font-medium text-black mb-2">
                                Step 2: Initial Synchronization
                            </h3>
                            <p className="text-gray-700">
                                Your emails will be downloaded and indexed in the background. This one-time process
                                ensures all your historical emails are available for instant searching.
                            </p>
                        </div>
                        <div className="border-l-4 border-gray-300 pl-6">
                            <h3 className="text-lg font-medium text-black mb-2">
                                Step 3: Start Searching
                            </h3>
                            <p className="text-gray-700">
                                Use the search bar to find any email instantly. With our advanced indexing,
                                searches complete in milliseconds rather than seconds.
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        Understanding the Interface
                    </h2>
                    <div className="grid gap-6">
                        
                        <div>
                            <h3 className="text-lg font-medium text-black mb-2">
                                Left Sidebar - Navigation & Control
                            </h3>
                            <p className="text-gray-700">
                                The main control panel featuring tab navigation between Search View and How It Works, 
                                Gmail connection management with real-time sync status, overview statistics showing 
                                indexed emails and detected decisions, and account profile management with disconnect options.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-black mb-2">
                                Main Search Area
                            </h3>
                            <p className="text-gray-700">
                                The main search interface where you can search and browse your emails.
                                This is where you'll spend most of your time, with powerful filtering options
                                and instant results.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-black mb-2">
                                Right Sidebar - Thread Viewer
                            </h3>
                            <p className="text-gray-700">
                                A resizable workspace panel (300-680px) for viewing complete email threads, 
                                displaying current session information including query and results count, 
                                and providing detailed thread content with attachment indicators and Gmail links.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-black mb-2">
                                Email Analytics
                            </h3>
                            <p className="text-gray-700">
                                View insights about your email collection, including total indexed emails and
                                automatically identified decisions, approvals, and commitments.
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        Synchronization Performance
                    </h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                        The first sync takes time because we need to download and process every single email
                        from your Gmail account. This is a one-time process - after the initial sync,
                        only new emails need to be downloaded.
                    </p>
                    
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        The Technology Behind Fast Search
                    </h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                        Zmemo features a high-performance, Rust-powered indexing engine leveraging SQLite with FTS5 (Full-Text Search).
                        By using a specialized low-level architecture managed by a Rust core, it transforms your email corpus into a local,
                        lightning-fast search index that makes finding keywords nearly instant.
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span className="text-gray-700">
                                Local SQLite database eliminates network latency
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span className="text-gray-700">
                                FTS5 full-text indexing optimized for search performance
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span className="text-gray-700">
                                Pre-computed results eliminate runtime processing
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span className="text-gray-700">
                                Query caching makes repeated searches instant
                            </span>
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        Technical Architecture
                    </h2>
                    <p className="text-gray-700 mb-6">
                        Zmemo is built with modern, proven technologies that ensure reliability,
                        performance, and security.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-1">Frontend</h3>
                            <p className="text-gray-600 text-sm">React + Vite + Tailwind CSS</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-1">Core Engine</h3>
                            <p className="text-gray-600 text-sm">Rust-powered (Tauri)</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-1">Backend</h3>
                            <p className="text-gray-600 text-sm">Python + FastAPI</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-1">Database</h3>
                            <p className="text-gray-600 text-sm">SQLite + FTS5</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        Privacy and Security
                    </h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                        Your privacy is our top priority. Zmemo is designed from the ground up
                        to keep your data secure and private.
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span className="text-gray-700">
                                All data stays on your device - never transmitted to external servers
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span className="text-gray-700">
                                Read-only Gmail access - we can never send or modify emails
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span className="text-gray-700">
                                Local search processing - no external API calls during searches
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span className="text-gray-700">
                                Complete data removal with one-click disconnect
                            </span>
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        Local Data Storage
                    </h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                        Zmemo stores all your data locally on your device. Here's exactly where you can find your files:
                    </p>
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-2">Windows</h3>
                            <code className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                C:\Users\USERNAME\.gmail-memory
                            </code>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-2">macOS</h3>
                            <code className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                ~/Library/Application Support/gmail-memory/
                            </code>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-2">Linux</h3>
                            <code className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                ~/.gmail-memory/
                            </code>
                        </div>
                    </div>
                    <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                        <h4 className="font-medium text-black mb-3">Files Stored:</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-500 mt-1">•</span>
                                <span className="text-gray-700">
                                    <code className="bg-gray-200 px-1 rounded">emails.db</code> - SQLite database containing all your indexed emails
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-500 mt-1">•</span>
                                <span className="text-gray-700">
                                    <code className="bg-gray-200 px-1 rounded">token.pickle</code> - Gmail OAuth authentication token
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-500 mt-1">•</span>
                                <span className="text-gray-700">
                                    <code className="bg-gray-200 px-1 rounded">credentials.json</code> - Google API credentials (you place this here during setup)
                                </span>
                            </li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        Data Deletion and Disconnection
                    </h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                        When you want to completely remove Zmemo from your system, follow these steps:
                    </p>
                    <div className="space-y-4">
                        <div className="border-l-4 border-red-300 pl-6">
                            <h3 className="text-lg font-medium text-black mb-2">
                                Step 1: Disconnect Your Gmail Account
                            </h3>
                            <p className="text-gray-700">
                                Click "Disconnect Gmail" in the sidebar to revoke app access to your Gmail account.
                            </p>
                        </div>
                        <div className="border-l-4 border-red-300 pl-6">
                            <h3 className="text-lg font-medium text-black mb-2">
                                Step 2: Delete Local Files and Folders
                            </h3>
                            <p className="text-gray-700">
                                Navigate to the Zmemo folder on your system and delete it completely:
                            </p>
                            <div className="mt-3 space-y-2">
                                <div className="bg-gray-50 rounded p-3">
                                    <code className="text-sm text-gray-600">
                                        C:\Users\USERNAME\.gmail-memory
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                            <span className="text-amber-500">⚠</span>
                            Important Note About Data Persistence
                        </h4>
                        <p className="text-amber-800 leading-relaxed mb-3">
                            If you disconnect your Gmail but still see indexed data/emails appearing in search results,
                            it's because your <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">emails.db</code> file
                            and other data files remain in the local folder.
                        </p>
                        <p className="text-amber-800 leading-relaxed">
                            <strong>To completely remove all data:</strong> You must delete the entire Zmemo data folder.
                            Once you remove these files, you will no longer be able to search your emails through this app
                            and will need to connect your Gmail account again to start fresh.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        Understanding Search Behavior
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                            <h3 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                                <span className="text-amber-500">💡</span>
                                Search Results Blinking? This is Intentional!
                            </h3>
                            <p className="text-amber-800 leading-relaxed mb-3">
                                If you notice search results occasionally blinking or refreshing every few seconds,
                                <strong>this is not a bug</strong> - it's a feature that ensures you always have the most up-to-date information.
                            </p>
                            <div className="space-y-3">
                                <h4 className="font-medium text-amber-900">Why This Happens:</h4>
                                <ul className="space-y-2 text-sm text-amber-800">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-1">•</span>
                                        <span>
                                            <strong>Background Sync:</strong> Zmemo automatically syncs new emails every 30 minutes
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-1">•</span>
                                        <span>
                                            <strong>Cache Refresh:</strong> Search cache is cleared to include new emails
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-1">•</span>
                                        <span>
                                            <strong>Decision Detection:</strong> System re-analyzes emails for important decisions
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-500 mt-1">•</span>
                                        <span>
                                            <strong>Real-time Updates:</strong> Ensures search results include the latest emails
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-4 p-3 bg-amber-100 rounded">
                                <p className="text-sm text-amber-900 font-medium">
                                    The blinking indicates Zmemo is working correctly - keeping your search results fresh and accurate!
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-black mb-4">
                        Advanced Usage Tips
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-2">
                                Use Advanced Filters
                            </h3>
                            <p className="text-gray-700">
                                Try "from:stripe.com" to find all emails from a specific sender,
                                or "has:attachments" to locate emails with files.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-2">
                                Find Important Decisions
                            </h3>
                            <p className="text-gray-700">
                                Toggle "Decisions Only" to automatically filter for emails containing
                                important approvals, agreements, and commitments.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-2">
                                Benefit from Incremental Sync
                            </h3>
                            <p className="text-gray-700">
                                After the first sync, only new emails are downloaded, making subsequent
                                updates significantly faster.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-black mb-2">
                                Access Original Emails
                            </h3>
                            <p className="text-gray-700">
                                Click "Open in Gmail" to view the original email in your browser
                                when you need full Gmail functionality.
                            </p>
                        </div>
                    </div>
                </section>
            </article>
        </div>
    );
};

export default HowItWorks;
