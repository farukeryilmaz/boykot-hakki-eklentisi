import React, {useState} from 'react';

interface BoycottPopupProps {
    entries: { source: string; claim: string; description: string; resources: string; detail_link: string }[];
    matchingListNames: string[];
    onProceed: () => void;
    onClose: () => void;
    canGoBack: boolean;
}

const BoycottPopup: React.FC<BoycottPopupProps> = ({entries, matchingListNames, onProceed, onClose, canGoBack}) => {
    const [openAccordions, setOpenAccordions] = useState<boolean[]>(new Array(entries.length).fill(false));

    const toggleAccordion = (index: number) => {
        setOpenAccordions((prev) =>
            prev.map((isOpen, i) => (i === index ? !isOpen : isOpen))
        );
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md z-[2147483646]"/>
            <div
                className="font-sans fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 z-[2147483647]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-red-500">Boykot Bilgilendirme</h2>
                    <div className="text-sm text-gray-300">
                        {matchingListNames.map((name) => (
                            <span key={name} className="block">{name}</span>
                        ))}
                    </div>
                </div>
                <div className="mb-6 space-y-2">
                    {entries.map((entry, index) => (
                        <div
                            key={index}
                            className="border border-solid !border-gray-700 rounded-md hover:!border-gray-700 hover:bg-gray-700 transition-colors duration-200"
                        >
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full flex items-center justify-between py-2 px-3 text-base font-semibold text-gray-200 hover:text-white focus:outline-none"
                            >
                                <div className="flex items-center">
                                    <span
                                        className="w-5 h-5 flex items-center justify-center bg-gray-600 rounded-full mr-2 text-sm">?</span>
                                    <span className="text-sm text-gray-300">Boykot İddiası <span
                                        className="text-xs text-gray-300">({entry.source})</span></span>
                                </div>
                                <svg
                                    className={`w-5 h-5 transition-transform ${openAccordions[index] ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                            {openAccordions[index] && (
                                <div className="text-sm text-gray-300 pb-2 px-3">
                                    {entry.claim && <p><span className="font-semibold">İddia: </span>{entry.claim}</p>}
                                    {entry.description &&
                                        <p><span className="font-semibold">Açıklama: </span>{entry.description}</p>}
                                    {entry.resources && <p className="text-gray-400 italic"><span
                                        className="font-semibold">Kaynaklar: </span>{entry.resources}</p>}
                                    {entry.detail_link && (
                                        <p>
                                            <a
                                                href={entry.detail_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:underline"
                                            >
                                                Detaylı Bilgi İçin Tıklayınız
                                            </a>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={onProceed}
                        className="flex-1 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                    >
                        Geçici Giriş Yap
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                    >
                        {canGoBack ? 'Geri Dön' : 'Sayfayı Kapat'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default BoycottPopup;