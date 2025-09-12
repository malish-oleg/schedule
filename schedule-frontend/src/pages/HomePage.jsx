// src/pages/HomePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

function HomePage() {
    // Единый стейт для всех "сущностей" (групп и преподавателей)
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEntities, setFilteredEntities] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    
    const navigate = useNavigate();
    const searchWrapperRef = useRef(null);

    // Загружаем все данные при первом рендере
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Запрашиваем группы и преподавателей параллельно
                const groupsPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/all-groups`);
                const teachersPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/all-teachers`);
                
                const [groupsRes, teachersRes] = await Promise.all([groupsPromise, teachersPromise]);

                // Добавляем тип к каждому объекту, чтобы их можно было различать
                const groups = groupsRes.data.map(g => ({ ...g, type: 'group' }));
                const teachers = teachersRes.data.map(t => ({ ...t, type: 'teacher' }));

                setEntities([...groups, ...teachers]);
            } catch (err) {
                setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
                console.error("Failed to load all data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    // Логика фильтрации
    useEffect(() => {
        if (searchTerm) {
            const filtered = entities.filter(entity => 
                entity.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 10); // Показываем до 10 результатов
            setFilteredEntities(filtered);
            setIsDropdownVisible(filtered.length > 0);
        } else {
            setFilteredEntities([]);
            setIsDropdownVisible(false);
        }
    }, [searchTerm, entities]);

    // Обработчик клика вне поля
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setIsDropdownVisible(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchWrapperRef]);

    const handleSelectEntity = (entity) => {
        setSelectedEntity(entity);
        setSearchTerm(entity.name);
        setIsDropdownVisible(false);
    };

    const handleShowSchedule = () => {
        if (selectedEntity) {
            if (selectedEntity.type === 'group') {
                navigate(`/schedule/group/${selectedEntity.facultyId}/${selectedEntity.id}`);
            } else if (selectedEntity.type === 'teacher') {
                navigate(`/schedule/teacher/${selectedEntity.chairId}/${selectedEntity.id}`);
            }
        }
    };

    return (
        <div className="home-page-container">
            <div className="search-card">
                <h1>Учебное расписание</h1>
                <p>Введите номер группы или фамилию преподавателя</p>
                
                <div className="search-wrapper" ref={searchWrapperRef}>
                    <input 
                        type="text"
                        placeholder={loading ? "Загрузка данных..." : "Поиск..."}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setSelectedEntity(null);
                        }}
                        onFocus={() => setIsDropdownVisible(searchTerm && filteredEntities.length > 0)}
                        disabled={loading}
                        className="search-input"
                    />
                    {isDropdownVisible && (
                        <ul className="suggestions-dropdown">
                            {filteredEntities.map(entity => (
                                <li key={`${entity.type}-${entity.id}`} onClick={() => handleSelectEntity(entity)}>
                                    <strong>{entity.name}</strong>
                                    {/* Показываем доп. инфо в зависимости от типа */}
                                    <span>{entity.type === 'group' ? entity.facultyName : entity.chairName}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button 
                    onClick={handleShowSchedule} 
                    disabled={!selectedEntity}
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