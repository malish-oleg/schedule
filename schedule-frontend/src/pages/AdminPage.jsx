// src/pages/AdminPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './AdminPage.css'; // Стили для админки

function AdminPage() {
    const { secretKey } = useParams();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [allEntities, setAllEntities] = useState([]); // Для имен групп/преподавателей

    const fetchStats = async (entities) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats/${secretKey}`);
            setStats(res.data);
            setError(null); // Сбрасываем ошибку при успешном запросе
        } catch (err) {
            if (err.response && err.response.status === 403) {
                setError('Доступ запрещен. Неверный ключ.');
            } else {
                setError('Не удалось обновить статистику.');
            }
            console.error(err);
        } finally {
            // Убираем загрузчик только при первой загрузке
            if (loading) {
                setLoading(false);
            }
        }
    };

    // Эффект для САМОЙ ПЕРВОЙ загрузки данных
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Сначала один раз загружаем имена
                const groupsPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/all-groups`);
                const teachersPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/all-teachers`);
                const [groupsRes, teachersRes] = await Promise.all([groupsPromise, teachersPromise]);
                
                const entities = [...groupsRes.data, ...teachersRes.data];
                setAllEntities(entities);

                // Затем делаем первый запрос статистики
                await fetchStats(entities);

            } catch (initialError) {
                setError('Не удалось загрузить первоначальные данные.');
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [secretKey]); // Зависит только от ключа

    // ===== НОВЫЙ ЭФФЕКТ: для периодического обновления =====
    useEffect(() => {
        // Не запускаем интервал, если была ошибка или идет первая загрузка
        if (error || loading) {
            return;
        }

        // Устанавливаем интервал, который будет вызывать fetchStats каждые 5 секунд
        const intervalId = setInterval(() => {
            fetchStats(allEntities);
        }, 5000); // 5000 миллисекунд = 5 секунд

        // ОЧЕНЬ ВАЖНО: Очищаем интервал, когда компонент размонтируется
        // Это предотвращает утечки памяти и лишние запросы
        return () => clearInterval(intervalId);

    }, [error, loading, allEntities]); // Перезапускаем, если изменились эти зависимости

    const getEntityNameById = (id) => {
        const entity = allEntities.find(e => e.id === id);
        return entity ? entity.name : `ID: ${id}`;
    };

    if (loading) return <div className="admin-container"><h1>Загрузка...</h1></div>;
    if (error) return <div className="admin-container"><h1>Ошибка: {error}</h1></div>;

    return (
        <div className="admin-container">
            <h1>Панель администратора</h1>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <h2>Всего запросов</h2>
                    <p>{stats.totalRequests}</p>
                </div>
                <div className="stat-card">
                    <h2>Уникальных пользователей</h2>
                    <p>{stats.uniqueUsers}</p>
                </div>
            </div>

            <div className="top-list">
                <h2>Топ-10 по популярности</h2>
                <ol>
                    {stats.top10.map(item => (
                        <li key={item.id}>
                            <span className="name">{getEntityNameById(item.id)}</span>
                            <span className="count">{item.count} запросов</span>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

export default AdminPage;