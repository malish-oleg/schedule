// src/components/Sidebar.jsx

import React from 'react';
import ThemeSwitcher from './ThemeSwitcher'; // Наш переключатель тем
import { FaBook, FaCalendarAlt, FaCog } from 'react-icons/fa'; // Иконки для меню
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ title, name, initials }) {
    return (
        <aside className="sidebar">
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
                <a href="#" className="nav-item active">
                    <FaCalendarAlt />
                    <span>Расписание</span>
                </a>
                <a href="#" className="nav-item">
                    <FaBook />
                    <span>Предметы</span>
                </a>
                <a href="#" className="nav-item">
                    <FaCog />
                    <span>Настройки</span>
                </a>
            </nav>

            <div className="sidebar-footer">
                <ThemeSwitcher />
            </div>
        </aside>
    );
}

export default Sidebar;