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
            <div className="boycott-backdrop"/>
            <div className="boycott-popup">
                <h2>Boycott Alert</h2>
                <p>{description}</p>
                <div className="button-container">
                    <button className="proceed" onClick={onProceed}>
                        Proceed Anyway
                    </button>
                    <button className="close" onClick={onClose}>
                        {canGoBack ? 'Go Back' : 'Close Website'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default BoycottPopup;