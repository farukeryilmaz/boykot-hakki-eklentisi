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
    const [isHardReset, setIsHardReset] = useState<boolean>(false);

    const defaultLists = [
        {id: 'testList1', name: 'Test Boycott List - 1'},
        {id: 'testList2', name: 'Test Boycott List - 2'},
    ];

    const timeoutOptions = [
        {id: '1h', name: '1 Saat', ms: 60 * 60 * 1000},
        {id: '1d', name: '1 Gün', ms: 24 * 60 * 60 * 1000},
        {id: '1w', name: '1 Hafta', ms: 7 * 24 * 60 * 60 * 1000},
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

    const handleHardReset = () => {
        chrome.storage.sync.set({
            skippedDomains: {},
            timeoutDuration: '1h',
            disabledBoycottDomains: {},
            selectedBoycottLists: [],
            isActive: false
        }, () => {
            console.log('Hard reset completed: all settings reverted to defaults');
            setIsActive(false);
            setSelectedLists([]);
            setTimeoutDuration('1h');
            setPendingTimeout('1h');
            setDisabledDomains([]);
            setIsBoycotted(false);
            setIsDisabled(false);
            setIsHardReset(true);
            setTimeout(() => setIsHardReset(false), 2000);
        });
    };

    return (
        <div className="w-80 bg-gray-900 text-white shadow-lg font-sans flex flex-col">
            {/* Current Domain Header */}
            <div className="bg-gray-800 p-1 border-b border-gray-700 flex justify-between items-center">
                <span className={`text-sm font-medium truncate block ${isBoycotted && (`w-3/4`)}`}
                      title={currentDomain}>
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
                        {isDisabled ? 'Aktif Et' : 'İptal Et'}
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="p-4 flex-1">
                {/* Tab Navigation */}
                <div className="flex justify-between mb-4 border-b border-gray-700">
                    <button
                        className={`flex-1 py-2 text-sm ${activeTab === 'lists' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={() => setActiveTab('lists')}
                    >
                        Listeler
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Ayarlar
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm ${activeTab === 'about' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                        onClick={() => setActiveTab('about')}
                    >
                        Hakkında
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
                            <h2 className="text-md font-medium text-gray-300 mb-2">Boykot Listeleri:</h2>
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
                            <p className="text-yellow-400 text-sm mb-4"><b>Uyarı:</b> Eklenti aktif ama hiçbir boykot
                                listesi aktif değil.</p>
                        )}

                        {listSaved && (
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-green-500 text-sm">Kaydedildi!</span>
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
                                    Sayfayı Yenile
                                </button>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'settings' && (
                    <>
                        <div className="mb-4">
                            <h2 className="text-md font-medium text-gray-300 mb-2">Geçici girişin zaman aşım
                                süresi:</h2>
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
                                onClick={handleSave}
                                className="w-full py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                            >
                                Kaydet
                            </button>
                            {isSaved && <span className="ml-2 text-green-500 text-sm">Kaydedildi!</span>}
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handleResetTimeouts}
                                className="w-full py-2 bg-gray-700 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                            >
                                Geçici Girişleri Sıfırla
                            </button>
                            {isReset && <span className="ml-2 text-green-500 text-sm">Sıfırlandı!</span>}
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handleHardReset}
                                className="w-full py-2 bg-red-800 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                            >
                                Eklentiyi Sıfırla
                            </button>
                            {isHardReset && <span className="ml-2 text-green-500 text-sm">Sıfırlandı!</span>}
                        </div>

                        {disabledDomains.length > 0 && (
                            <div className="mt-4">
                                <h2 className="text-md font-medium text-gray-300 mb-2">İptal Edilen Boykotlar:</h2>
                                <ul className="text-sm text-gray-300 max-h-40 overflow-y-auto pl-4">
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
                        <p className="text-sm">
                            Boykot Hakkı eklentisi, kullanıcının etkinleştirdiği boykot listelerine göre bilgilendirme
                            sunar. Eklenti, tamamen kullanıcı tarayıcısında çalışır; herhangi bir kişisel veriyi
                            toplamaz, işlemez veya üçüncü taraflarla paylaşmaz. Kaynak kodu, Özgür Yazılım lisansı ile
                            açık olarak GitHub'da yayımlanmıştır. Hatalı bilgiler kullanıcı bildirimi ile
                            düzeltilebilir.
                        </p>
                        <h2 className="text-lg font-medium text-gray-300 mb-2 mt-4">Yasal Bilgilendirme</h2>
                        <p className="text-sm mt-2">Tüketiciler, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
                            Anayasa’nın 26. maddesi uyarınca, satın alıp almama hakkına ve düşünce açıklama ve yayma
                            özgürlüğüne sahiptir. Bu kapsamda, bireysel veya toplu tüketici boykotu hukuken mümkündür.
                            Eklenti, bu hak doğrultusunda kullanıcıya bilgi verir; herhangi bir kuruluş veya ürün
                            hakkında yönlendirme veya zorlama içermez.</p>
                        <p className="text-sm mt-2">Eklenti yalnızca tüketici boykotunu destekler; şirketler arası
                            ticari boykotu içermez. Kamu kurumlarına yönelik listeler, yalnızca kullanıcı talebiyle
                            görünür ve içeriğinde şiddet, tehdit veya hakaret bulundurmaz; 5237 sayılı Türk Ceza
                            Kanunu’nun 125 ve 301. maddeleri kapsamında suç teşkil eden içeriklere izin verilmez.</p>
                        <p className="text-sm mt-2">
                            Bu eklenti, ifade özgürlüğü ve tüketicinin bilgiye dayalı tercih hakkını destekleyen yasal
                            bir araçtır. Kullanıcı dilerse kendi aktif ettiği tüm boykot listelerini ve eklentiyi devre
                            dışı bırakabilir.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer Strip */}
            <div
                className="bg-gray-800 border-t border-gray-700 p-1 text-xs text-gray-400 flex justify-between items-center">
                <a
                    href="https://github.com/farukeryilmaz/boykot-hakki-eklentisi/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-2 py-1 font-semibold bg-gray-700 rounded-md hover:bg-gray-600 transition-colors duration-200"
                >
                    <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/>
                    </svg>
                    <span>Hata Bildir</span>
                </a>
                <a
                    href="https://github.com/farukeryilmaz/boykot-hakki-eklentisi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-2 py-1 font-semibold bg-gray-700 rounded-md hover:bg-gray-600 transition-colors duration-200"
                >
                    <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.26.793-.577v-2.234c-3.338.724-4.043-1.607-4.043-1.607-.546-1.387-1.333-1.757-1.333-1.757-1.087-.744.083-.729.083-.729 1.205.085 1.838 1.236 1.838 1.236 1.07 1.834 2.807 1.305 3.492.997.107-.776.418-1.305.762-1.605-2.665-.308-5.467-1.334-5.467-5.93 0-1.31.467-2.381 1.235-3.221-.123-.308-.535-1.529.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02-.006 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.647.241 2.868.118 3.176.77.84 1.234 1.911 1.234 3.221 0 4.61-2.807 5.62-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>Kaynak Kod</span>
                </a>
            </div>
        </div>
    );
};

export default App;