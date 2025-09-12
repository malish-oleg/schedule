// src/components/Header.jsx

import React from 'react';
import { FaBars, FaCalendarAlt } from 'react-icons/fa';
import ThemeSwitcher from './ThemeSwitcher';
import './Header.css';

// onToggleSidebar и onToggleRightPanel - функции для открытия/закрытия панелей
function Header({ onToggleSidebar, onToggleRightPanel, groupName }) {
    return (
        <header className="mobile-header">
            <button onClick={onToggleSidebar} className="header-button header-sidebar-button" aria-label="Открыть меню">
                <FaBars />
            </button>
            <div className="header-title">
                {groupName || 'Расписание'}
            </div>
            <button onClick={onToggleRightPanel} className="header-button" aria-label="Открыть календарь">
                <FaCalendarAlt />
            </button>
        </header>
    );
}

export default Header;