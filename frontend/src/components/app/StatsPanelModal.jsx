import React from 'react';
import StatsPanel from '../StatsPanel';

const StatsPanelModal = ({ show, onClose }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
            <StatsPanel onClose={onClose} />
        </div>
    );
};

export default StatsPanelModal;
