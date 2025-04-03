import React from 'react';

interface BoycottPopupProps {
    description: string;
    onProceed: () => void;
    onClose: () => void;
}

const BoycottPopup: React.FC<BoycottPopupProps> = ({description, onProceed, onClose}) => {
    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            zIndex: 1000,
            borderRadius: '5px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
            <h2>Boycott Alert</h2>
            <p>{description}</p>
            <div style={{marginTop: '10px'}}>
                <button onClick={onProceed} style={{marginRight: '10px', padding: '5px 10px'}}>Proceed Anyway</button>
                <button onClick={onClose} style={{padding: '5px 10px'}}>Close Website</button>
            </div>
        </div>
    );
};

export default BoycottPopup;