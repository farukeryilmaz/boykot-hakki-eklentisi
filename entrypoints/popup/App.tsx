import React, {useState, useEffect} from 'react';
import './App.css';

const App: React.FC = () => {
    const [isActive, setIsActive] = useState<boolean>(true);
    const [selectedList, setSelectedList] = useState<string>('testList1');
    const [pendingList, setPendingList] = useState<string>('testList1');
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [timeoutDuration, setTimeoutDuration] = useState<string>('1h');
    const [pendingTimeout, setPendingTimeout] = useState<string>('1h');
    const [isReset, setIsReset] = useState<boolean>(false);

    const boycottLists = [
        {id: 'testList1', name: 'Test Boycott List - 1'},
        {id: 'testList2', name: 'Test Boycott List - 2'},
    ];

    const timeoutOptions = [
        {id: '1h', name: '1 Hour', ms: 60 * 60 * 1000},
        {id: '1d', name: '1 Day', ms: 24 * 60 * 60 * 1000},
        {id: '1w', name: '1 Week', ms: 7 * 24 * 60 * 60 * 1000},
    ];

    useEffect(() => {
        chrome.storage.sync.get(['isActive', 'selectedBoycottList', 'timeoutDuration'], (data) => {
            const savedActive = data.isActive !== undefined ? data.isActive : true;
            const savedList = data.selectedBoycottList || 'testList1';
            const savedTimeout = data.timeoutDuration || '1h';
            setIsActive(savedActive);
            setSelectedList(savedList);
            setPendingList(savedList);
            setTimeoutDuration(savedTimeout);
            setPendingTimeout(savedTimeout);
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
        <div className="app-container">
            <div className="toggle-container">
                <label className="switch-label">
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={handleToggleActive}
                    />
                    <span>{isActive ? 'Active' : 'Inactive'}</span>
                </label>
            </div>
            <h1>Boycott List</h1>
            <ul>
                {boycottLists.map((list) => (
                    <li key={list.id}>
                        <label>
                            <input
                                type="radio"
                                name="boycottList"
                                value={list.id}
                                checked={pendingList === list.id}
                                onChange={() => handleListSelect(list.id)}
                            />
                            {list.name}
                        </label>
                    </li>
                ))}
            </ul>
            <h2>Skip Timeout</h2>
            <ul>
                {timeoutOptions.map((option) => (
                    <li key={option.id}>
                        <label>
                            <input
                                type="radio"
                                name="timeoutDuration"
                                value={option.id}
                                checked={pendingTimeout === option.id}
                                onChange={() => handleTimeoutSelect(option.id)}
                            />
                            {option.name}
                        </label>
                    </li>
                ))}
            </ul>
            <div className="save-container">
                <button onClick={handleSave}>Save</button>
                {isSaved && <p className="saved-feedback">Saved!</p>}
            </div>
            <div className="reset-container">
                <button className="reset-button" onClick={handleResetTimeouts}>
                    Reset Timeouts
                </button>
                {isReset && <p className="reset-feedback">Reset!</p>}
            </div>
        </div>
    );
};

export default App;