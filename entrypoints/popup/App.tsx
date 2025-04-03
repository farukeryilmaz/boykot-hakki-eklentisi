import React, {useState, useEffect} from 'react';
import './App.css';

const App: React.FC = () => {
    const [selectedList, setSelectedList] = useState<string>('testList1');
    const [pendingList, setPendingList] = useState<string>('testList1');
    const [isSaved, setIsSaved] = useState<boolean>(false); // New state for feedback

    const boycottLists = [
        {id: 'testList1', name: 'Test Boycott List - 1'},
        {id: 'testList2', name: 'Test Boycott List - 2'},
    ];

    useEffect(() => {
        chrome.storage.sync.get('selectedBoycottList', (data) => {
            const savedList = data.selectedBoycottList || 'testList1';
            setSelectedList(savedList);
            setPendingList(savedList);
        });
    }, []);

    const handleSelect = (listId: string) => {
        setPendingList(listId);
        setIsSaved(false);
    };

    const handleSave = () => {
        setSelectedList(pendingList);
        chrome.storage.sync.set({selectedBoycottList: pendingList}, () => {
            console.log(`Saved boycott list: ${pendingList}`);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        });
    };

    return (
        <div className="app-container">
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
                                onChange={() => handleSelect(list.id)}
                            />
                            {list.name}
                        </label>
                    </li>
                ))}
            </ul>
            <div className="save-container">
                <button onClick={handleSave}>Save</button>
                {isSaved && <p className="saved-feedback">Saved!</p>}
            </div>
        </div>
    );
};

export default App;