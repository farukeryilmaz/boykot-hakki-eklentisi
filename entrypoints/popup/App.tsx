import React, {useState, useEffect} from 'react';
import testBoycottList1 from '@/assets/boycott_lists/test-boycott-list-1.json';
import testBoycottList2 from '@/assets/boycott_lists/test-boycott-list-2.json';

const defaultBoycottLists: Record<string, {
    name: string;
    items: { domain: string; claim: string; description: string; resources: string; detail_link: string }[]
}> = {
    testList1: testBoycottList1,
    testList2: testBoycottList2,
};

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
    const [isBoycotted, setIsBoycotted] = useState<boolean>(false);
    const [isDisabled, setIsDisabled] = useState<boolean>(false);
    const [cachedBoycottLists, setCachedBoycottLists] = useState<any>(defaultBoycottLists);
    const [disabledDomains, setDisabledDomains] = useState<string[]>([]);

    const defaultLists = [
        {id: 'testList1', name: 'Test Boycott List - 1'},
        {id: 'testList2', name: 'Test Boycott List - 2'},
    ];

    const timeoutOptions = [
        {id: '1h', name: '1 Hour', ms: 60 * 60 * 1000},
        {id: '1d', name: '1 Day', ms: 24 * 60 * 60 * 1000},
        {id: '1w', name: '1 Week', ms: 7 * 24 * 60 * 60 * 1000},
    ];

    const checkBoycottStatus = (domain: string, active: boolean, lists: string[], boycottData: any) => {
        const isInBoycottList = lists.some((listId) => {
            const list = boycottData[listId] || defaultBoycottLists[listId] || {items: []};
            return list.items?.some((item: { domain: string }) =>
                domain === item.domain || domain.endsWith(`.${item.domain}`)
            );
        });
        console.log(`Checking boycott status for ${domain}: isActive=${active}, isInBoycottList=${isInBoycottList}, lists=${lists}, cachedLists=${JSON.stringify(boycottData)}`);
        setIsBoycotted(active && isInBoycottList);
    };

    useEffect(() => {
        chrome.storage.sync.get(['isActive', 'selectedBoycottLists', 'timeoutDuration', 'cachedBoycottLists', 'disabledBoycottDomains'], (data) => {
            const storageData = data || {};
            const savedActive = 'isActive' in storageData && typeof storageData.isActive === 'boolean' ? storageData.isActive : false;
            const savedLists = Array.isArray(storageData.selectedBoycottLists) ? storageData.selectedBoycottLists : [];
            const savedTimeout = storageData.timeoutDuration || '1h';
            const cachedLists = storageData.cachedBoycottLists || defaultBoycottLists;
            const disabledDomainsData = storageData.disabledBoycottDomains || {};

            setIsActive(savedActive);
            setSelectedLists(savedLists);
            setTimeoutDuration(savedTimeout);
            setPendingTimeout(savedTimeout);
            setCachedBoycottLists(cachedLists);
            setDisabledDomains(Object.keys(disabledDomainsData));

            const listOptions = Object.keys(cachedLists).length > 0
                ? Object.keys(cachedLists).map((key) => ({
                    id: key,
                    name: cachedLists[key].name || key.charAt(0).toUpperCase() + key.slice(1),
                }))
                : defaultLists;
            setBoycottLists(listOptions);

            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]?.url) {
                    const url = new URL(tabs[0].url);
                    const domain = url.hostname;
                    setCurrentDomain(domain);
                    setIsDisabled(!!disabledDomainsData[domain]);
                    checkBoycottStatus(domain, savedActive, savedLists, cachedLists);
                } else {
                    setCurrentDomain('Unknown');
                    setIsBoycotted(false);
                    setIsDisabled(false);
                }
            });
        });
    }, []);

    const handleToggleActive = () => {
        const newActiveState = !isActive;
        setIsActive(newActiveState);
        chrome.storage.sync.set({isActive: newActiveState}, () => {
            console.log(`Extension ${newActiveState ? 'activated' : 'deactivated'}`);
            setListSaved(true);
            setTimeout(() => setListSaved(false), 10000);
            checkBoycottStatus(currentDomain, newActiveState, selectedLists, cachedBoycottLists);
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
            checkBoycottStatus(currentDomain, isActive, newLists, cachedBoycottLists);
        });
    };

    const handleToggleBoycott = () => {
        chrome.storage.sync.get(['disabledBoycottDomains', 'skippedDomains'], (data) => {
            const disabledDomains = data.disabledBoycottDomains || {};
            const skippedDomains = data.skippedDomains || {};

            if (isDisabled) {
                delete disabledDomains[currentDomain];
            } else {
                disabledDomains[currentDomain] = true;
            }

            if (skippedDomains[currentDomain]) {
                delete skippedDomains[currentDomain];
            }

            chrome.storage.sync.set({
                disabledBoycottDomains: disabledDomains,
                skippedDomains: skippedDomains
            }, () => {
                console.log(`${isDisabled ? 'Enabled' : 'Disabled'} boycott for ${currentDomain}`);
                if (skippedDomains[currentDomain]) {
                    console.log(`Removed ${currentDomain} from temporary skipped list`);
                }
                setIsDisabled(!isDisabled);
                setDisabledDomains(Object.keys(disabledDomains));
                setListSaved(true);
                setTimeout(() => setListSaved(false), 10000);
            });
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
            <div className="bg-gray-800 p-1 border-b border-gray-700 flex justify-between items-center">
                <span className="text-sm font-medium truncate block w-3/4" title={currentDomain}>
                    {currentDomain}
                </span>
                {isBoycotted && (
                    <button
                        onClick={handleToggleBoycott}
                        className={`flex items-center text-xs px-2 py-1 rounded ${isDisabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                        title={isDisabled ? 'Enable boycott for this site' : 'Disable boycott for this site'}
                    >
                        {isDisabled ? (
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M5 13l4 4L19 7"></path>
                            </svg>
                        ) : (
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        )}
                        {isDisabled ? 'Enable' : 'Disable'}
                    </button>
                )}
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

                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handleSave}
                                className="w-full py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                            >
                                Save All
                            </button>
                            {isSaved && <span className="ml-2 text-green-500 text-sm">Saved!</span>}
                        </div>

                        {disabledDomains.length > 0 && (
                            <div className="mt-4">
                                <h2 className="text-md font-medium text-gray-300 mb-2">Disabled Boycott Websites</h2>
                                <ul className="text-sm text-gray-300 max-h-40 overflow-y-auto pl-1">
                                    {disabledDomains.map((domain, index) => (
                                        <li key={index} className="truncate" title={domain}>
                                            {domain}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'about' && (
                    <div>
                        <h2 className="text-md font-medium text-gray-300 mb-2">About Boykot Hakkı</h2>
                        <p className="text-sm">
                            Boykot Hakkı is a browser extension that warns you when visiting websites from selected
                            boycott lists.
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