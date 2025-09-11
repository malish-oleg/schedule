// src/components/Overlay.jsx
import React from 'react';
import './Overlay.css';

function Overlay({ isActive, onClick }) {
    return (
        <div className={`overlay ${isActive ? 'active' : ''}`} onClick={onClick}></div>
    );
}

export default Overlay;