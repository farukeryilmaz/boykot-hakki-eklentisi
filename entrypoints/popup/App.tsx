import React, {useState, useEffect} from 'react';

const App: React.FC = () => {
    const [isActive, setIsActive] = useState<boolean>(true);
    const [selectedList, setSelectedList] = useState<string>('testList1');
    const [pendingList, setPendingList] = useState<string>('testList1');
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [timeoutDuration, setTimeoutDuration] = useState<string>('1h');
    const [pendingTimeout, setPendingTimeout] = useState<string>('1h');
    const [isReset, setIsReset] = useState<boolean>(false);
    const [boycottLists, setBoycottLists] = useState<{ id: string; name: string }[]>([]);

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
        chrome.storage.sync.get(['isActive', 'selectedBoycottList', 'timeoutDuration', 'cachedBoycottLists'], (data) => {
            const savedActive = data.isActive !== undefined ? data.isActive : true;
            const savedList = data.selectedBoycottList || 'testList1';
            const savedTimeout = data.timeoutDuration || '1h';
            const cachedLists = data.cachedBoycottLists || {};

            setIsActive(savedActive);
            setSelectedList(savedList);
            setPendingList(savedList);
            setTimeoutDuration(savedTimeout);
            setPendingTimeout(savedTimeout);

            const listOptions = Object.keys(cachedLists).length > 0
                ? Object.keys(cachedLists).map((key) => ({
                    id: key,
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                }))
                : defaultLists;
            setBoycottLists(listOptions);
        });
    }, []);

    const handleToggleActive = () => {
        const newActiveState = !isActive;
        setIsActive(newActiveState);
        chrome.storage.sync.set({isActive: newActiveState}, () => {
            console.log(`Extension ${newActiveState ? 'activated' : 'deactivated'}`);
        });
    };

    const handleListSelect = (listId: string) => {
        setPendingList(listId);
        setIsSaved(false);
    };

    const handleTimeoutSelect = (timeoutId: string) => {
        setPendingTimeout(timeoutId);
        setIsSaved(false);
    };

    const handleSave = () => {
        setSelectedList(pendingList);
        setTimeoutDuration(pendingTimeout);
        chrome.storage.sync.set(
            {selectedBoycottList: pendingList, timeoutDuration: pendingTimeout},
            () => {
                console.log(`Saved boycott list: ${pendingList}, timeout: ${pendingTimeout}`);
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 2000);
            }
        );
    };

    const handleResetTimeouts = () => {
        chrome.storage.sync.set({skippedDomains: {}}, () => {
            console.log('Timeouts reset');
            setIsReset(true);
            setTimeout(() => setIsReset(false), 2000);
        });
    };

    return (
        <div className="p-4 w-70 bg-gray-900 text-white shadow-lg font-sans">
            {/* Active/Inactive Switch */}
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

            {/* Boycott List */}
            <div className="mb-4">
                <h2 className="text-md font-medium text-gray-300 mb-2">Boycott List</h2>
                <ul className="space-y-2">
                    {boycottLists.map((list) => (
                        <li key={list.id}>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="boycottList"
                                    value={list.id}
                                    checked={pendingList === list.id}
                                    onChange={() => handleListSelect(list.id)}
                                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">{list.name}</span>
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Skip Timeout Combobox */}
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

            {/* Reset Timeouts Button */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handleResetTimeouts}
                    className="w-full py-2 bg-gray-700 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                >
                    Reset Timeouts
                </button>
                {isReset && <span className="ml-2 text-green-500 text-sm">Reset!</span>}
            </div>

            {/* Save All Button */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handleSave}
                    className="w-full py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                    Save All
                </button>
                {isSaved && <span className="ml-2 text-green-500 text-sm">Saved!</span>}
            </div>
        </div>
    );
};

export default App;