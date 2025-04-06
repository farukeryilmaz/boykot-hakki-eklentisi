import React, {useState, useEffect} from 'react';

const App: React.FC = () => {
    const [isActive, setIsActive] = useState<boolean>(false);
    const [selectedLists, setSelectedLists] = useState<string[]>([]);
    const [timeoutDuration, setTimeoutDuration] = useState<string>('1h');
    const [pendingTimeout, setPendingTimeout] = useState<string>('1h');
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [isReset, setIsReset] = useState<boolean>(false);
    const [boycottLists, setBoycottLists] = useState<{ id: string; name: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'lists' | 'settings' | 'about'>('lists');
    const [listSaved, setListSaved] = useState<boolean>(false);
    const [currentDomain, setCurrentDomain] = useState<string>('');

    const defaultLists = [
        {id: 'testList1', name: 'Test Boycott List - 1'},
        {id: 'testList2', name: 'Test Boycott List - 2'},
    ];

    const timeoutOptions = [
        {id: '1h', name: '1 Hour', ms: 60 * 60 * 1000},
        {id: '1d', name: '1 Day', ms: 24 * 60 * 60 * 1000},
        {id: '1w', name: '1 Week', ms: 7 * 24 * 60 * 60 * 1000},
    ];

    useEffect(() => {
        chrome.storage.sync.get(['isActive', 'selectedBoycottLists', 'timeoutDuration', 'cachedBoycottLists'], (data) => {
            const storageData = data || {};
            const savedActive = 'isActive' in storageData && typeof storageData.isActive === 'boolean' ? storageData.isActive : false;
            const savedLists = Array.isArray(storageData.selectedBoycottLists) ? storageData.selectedBoycottLists : [];
            const savedTimeout = storageData.timeoutDuration || '1h';
            const cachedLists = storageData.cachedBoycottLists || {};

            setIsActive(savedActive);
            setSelectedLists(savedLists);
            setTimeoutDuration(savedTimeout);
            setPendingTimeout(savedTimeout);

            const listOptions = Object.keys(cachedLists).length > 0
                ? Object.keys(cachedLists).map((key) => ({
                    id: key,
                    name: cachedLists[key].name || key.charAt(0).toUpperCase() + key.slice(1),
                }))
                : defaultLists;
            setBoycottLists(listOptions);
        });

        // Fetch current domain
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]?.url) {
                const url = new URL(tabs[0].url);
                setCurrentDomain(url.hostname);
            } else {
                setCurrentDomain('Unknown');
            }
        });
    }, []);

    const handleToggleActive = () => {
        const newActiveState = !isActive;
        setIsActive(newActiveState);
        chrome.storage.sync.set({isActive: newActiveState}, () => {
            console.log(`Extension ${newActiveState ? 'activated' : 'deactivated'}`);
            setListSaved(true);
            setTimeout(() => setListSaved(false), 10000);
        });
    };

    const handleListToggle = (listId: string) => {
        const newLists = selectedLists.includes(listId)
            ? selectedLists.filter((id) => id !== listId)
            : [...selectedLists, listId];
        setSelectedLists(newLists);
        chrome.storage.sync.set({selectedBoycottLists: newLists}, () => {
            console.log(`Updated boycott lists: ${newLists}`);
            setListSaved(true);
            setTimeout(() => setListSaved(false), 10000);
        });
    };

    const handleTimeoutSelect = (timeoutId: string) => {
        setPendingTimeout(timeoutId);
        setIsSaved(false);
    };

    const handleSave = () => {
        setTimeoutDuration(pendingTimeout);
        chrome.storage.sync.set({timeoutDuration: pendingTimeout}, () => {
            console.log(`Saved timeout: ${pendingTimeout}`);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        });
    };

    const handleResetTimeouts = () => {
        chrome.storage.sync.set({skippedDomains: {}}, () => {
            console.log('Timeouts reset');
            setIsReset(true);
            setTimeout(() => setIsReset(false), 2000);
        });
    };

    const handleReloadPage = () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    };

    return (
        <div className="w-75 bg-gray-900 text-white shadow-lg font-sans">
            {/* Current Domain Header */}
            <div className="bg-gray-800 p-1 border-b border-gray-700">
                <span className="text-sm font-medium truncate block" title={currentDomain}>
                    {currentDomain}
                </span>
            </div>

            {/* Main Content */}
            <div className="p-4">
                {/* Tab Navigation */}
                <div className="flex justify-between mb-4 border-b border-gray-700">
                    <button
                        className={`flex-1 py-2 text-sm ${activeTab === 'lists' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={() => setActiveTab('lists')}
                    >
                        Lists
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Settings
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm ${activeTab === 'about' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={() => setActiveTab('about')}
                    >
                        About
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'lists' && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-lg font-semibold">Boykot Hakkı</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={handleToggleActive}
                                    className="sr-only peer"
                                />
                                <span
                                    className="mr-3 text-sm font-medium text-gray-900 dark:text-gray-300">{isActive ? 'Aktif' : 'Kapalı'}</span>
                                <div
                                    className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600 dark:peer-checked:bg-green-600"
                                ></div>
                            </label>
                        </div>

                        <div className="mb-4">
                            <h2 className="text-md font-medium text-gray-300 mb-2">Boycott Lists</h2>
                            <ul className="space-y-2">
                                {boycottLists.map((list) => (
                                    <li key={list.id}>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedLists.includes(list.id)}
                                                onChange={() => handleListToggle(list.id)}
                                                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm">{list.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {isActive && selectedLists.length === 0 && (
                            <p className="text-yellow-400 text-sm mb-4">Warning: Extension is active but no boycott
                                lists are selected.</p>
                        )}

                        {listSaved && (
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-green-500 text-sm">Saved!</span>
                                <button
                                    onClick={handleReloadPage}
                                    className="flex items-center text-sm text-blue-400 hover:text-blue-300"
                                    title="Reload current page to apply changes"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9H0m0 6h4.582A8.001 8.001 0 0120 13v5"></path>
                                    </svg>
                                    Reload Page
                                </button>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'settings' && (
                    <>
                        <div className="mb-4">
                            <h2 className="text-md font-medium text-gray-300 mb-2">Skip Timeout</h2>
                            <select
                                value={pendingTimeout}
                                onChange={(e) => handleTimeoutSelect(e.target.value)}
                                className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {timeoutOptions.map((option) => (
                                    <option key={option.id} value={option.id} className="bg-gray-800">
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handleResetTimeouts}
                                className="w-full py-2 bg-gray-700 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                            >
                                Reset Timeouts
                            </button>
                            {isReset && <span className="ml-2 text-green-500 text-sm">Reset!</span>}
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleSave}
                                className="w-full py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                            >
                                Save All
                            </button>
                            {isSaved && <span className="ml-2 text-green-500 text-sm">Saved!</span>}
                        </div>
                    </>
                )}

                {activeTab === 'about' && (
                    <div>
                        <h2 className="text-md font-medium text-gray-300 mb-2">About Boykot Hakkı</h2>
                        <p className="text-sm">
                            Boykot Hakkı is a browser extension that warns you when visiting websites from selected boycott
                            lists.
                            Customize your experience by choosing lists and setting skip timeouts.
                        </p>
                        <p className="text-sm mt-2">Version: 0.1.0</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;