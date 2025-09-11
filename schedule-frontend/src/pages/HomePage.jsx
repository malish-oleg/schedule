// src/pages/HomePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css'; // Новые стили для этой страницы

function HomePage() {
    const [allGroups, setAllGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    
    const navigate = useNavigate();
    const searchWrapperRef = useRef(null); // Ref для отслеживания кликов вне поля

    // Загружаем все группы при первом рендере
    useEffect(() => {
        const fetchAllGroups = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/all-groups`);
                setAllGroups(res.data);
            } catch (err) {
                setError('Не удалось загрузить список групп. Попробуйте обновить страницу.');
                console.error("Failed to load all groups", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllGroups();
    }, []);

    // Логика фильтрации
    useEffect(() => {
        if (searchTerm) {
            const filtered = allGroups.filter(group => 
                group.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 7); // Показываем не более 7 результатов
            setFilteredGroups(filtered);
            setIsDropdownVisible(filtered.length > 0);
        } else {
            setFilteredGroups([]);
            setIsDropdownVisible(false);
        }
    }, [searchTerm, allGroups]);

    // Обработчик клика вне поля поиска
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setIsDropdownVisible(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchWrapperRef]);

    const handleSelectGroup = (group) => {
        setSelectedGroup(group);
        setSearchTerm(group.name); // Показываем полное имя в поле ввода
        setIsDropdownVisible(false);
    };

    const handleShowSchedule = () => {
        if (selectedGroup) {
            navigate(`/schedule/${selectedGroup.facultyId}/${selectedGroup.id}`);
        }
    };

    return (
        <div className="home-page-container">
            <div className="search-card">
                <h1>Учебное расписание</h1>
                <p>Введите номер вашей группы, чтобы найти расписание</p>
                
                <div className="search-wrapper" ref={searchWrapperRef}>
                    <input 
                        type="text"
                        placeholder={loading ? "Загрузка списка групп..." : "Например, 25-42"}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setSelectedGroup(null); // Сбрасываем выбор при изменении текста
                        }}
                        onFocus={() => setIsDropdownVisible(searchTerm && filteredGroups.length > 0)}
                        disabled={loading}
                        className="search-input"
                    />
                    {isDropdownVisible && (
                        <ul className="suggestions-dropdown">
                            {filteredGroups.map(group => (
                                <li key={group.id} onClick={() => handleSelectGroup(group)}>
                                    <strong>{group.name}</strong>
                                    <span>{group.facultyName}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button 
                    onClick={handleShowSchedule} 
                    disabled={!selectedGroup}
                    className="view-button"
                >
                    Посмотреть
                </button>
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
}

export default HomePage;