// src/components/Sidebar.jsx

import React from 'react';
import ThemeSwitcher from './ThemeSwitcher'; // Наш переключатель тем
import { FaBook, FaCalendarAlt, FaCog, FaTimes, FaHeart } from 'react-icons/fa'; // Иконки для меню
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ title, name, initials, on_Close, activeView, setActiveView }) {
    return (
        <aside className="sidebar">
            <button className="panel-close-button" onClick={on_Close}>
                <FaTimes />
            </button>

            <div className="panel-content">

                <Link to="/" className="profile-link">
                    <div className="profile-section">
                        <div className="profile-avatar">{initials}</div>
                        <div className="profile-info">
                            <h4>{title}</h4>
                            <h3>{name || 'Загрузка...'}</h3>
                        </div>
                    </div>
                </Link>

                <nav className="sidebar-nav">
                    {/* Кнопка "Расписание" */}
                    <button 
                        className={`nav-item ${activeView === 'schedule' ? 'active' : ''}`}
                        onClick={() => setActiveView('schedule')}
                    >
                        <FaCalendarAlt />
                        <span>Расписание</span>
                    </button>
                    {/* ===== НОВАЯ КНОПКА "СВЯЗЬ" ===== */}
                    <button 
                        className={`nav-item ${activeView === 'contact' ? 'active' : ''}`}
                        onClick={() => setActiveView('contact')}
                    >
                        <FaHeart />
                        <span>Связь</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <ThemeSwitcher />
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;