import React from 'react';

interface BoycottPopupProps {
    description: string;
    onProceed: () => void;
    onClose: () => void;
    canGoBack: boolean;
}

const BoycottPopup: React.FC<BoycottPopupProps> = ({description, onProceed, onClose, canGoBack}) => {
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md z-[2147483646]"/>
            <div
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 z-[2147483647]">
                <h2 className="text-xl font-bold text-red-500 mb-4">Boycott Alert</h2>
                <p className="text-base mb-6">{description}</p>
                <div className="flex space-x-4">
                    <button
                        onClick={onProceed}
                        className="flex-1 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                    >
                        Proceed Anyway
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                    >
                        {canGoBack ? 'Go Back' : 'Close Website'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default BoycottPopup;