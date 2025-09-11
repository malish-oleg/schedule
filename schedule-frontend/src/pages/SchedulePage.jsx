// src/pages/SchedulePage.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CalendarPicker from '../components/CalendarPicker';
import DailyView from '../components/DailyView';
import Modal from '../components/Modal';
import { calculateTopPosition } from '../components/CurrentTimeIndicator';
import ViewSwitcher from '../components/ViewSwitcher';
import WeeklyView from '../components/WeeklyView';
import TableView from '../components/TableView';
import Header from '../components/Header'; // <-- Импортируем хедер
import Overlay from '../components/Overlay';
import ActionButtons from '../components/ActionButtons';

// Утилита для получения номера недели из даты (ISO 8601 стандарт)
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

function SchedulePage() {
    const { facultyId, groupId, year, month, day } = useParams();
    const selectedDate = useMemo(() => new Date(year, month - 1, day), [year, month, day]);

    const timelineWrapperRef = useRef(null); 

    const [weekSchedule, setWeekSchedule] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('daily'); // Для будущего переключения на недельный вид

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

    useEffect(() => {
        const weekToFetch = getWeekNumber(selectedDate);
        
        const fetchWeekData = async () => {
            setLoading(true);
            try {
                // Параллельно запрашиваем имя группы и расписание
                const groupPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/groups/${facultyId}`);
                const schedulePromise = axios.post(`${import.meta.env.VITE_API_URL}/api/schedule`, {
                    faculty_id: facultyId,
                    group_id: groupId,
                    year_week_number: weekToFetch.toString(),
                });

                const [groupRes, scheduleRes] = await Promise.all([groupPromise, schedulePromise]);

                // Обрабатываем имя группы
                const currentGroup = groupRes.data.find(g => g.id === groupId);
                if (currentGroup) setGroupName(currentGroup.name);

                // Обрабатываем расписание
                setWeekSchedule(scheduleRes.data.schedule);

            } catch (err) {
                console.error("Failed to fetch schedule data", err);
                setWeekSchedule([]); // В случае ошибки ставим пустой массив
            } finally {
                setLoading(false);
            }
        };
        
        // Оптимизация: перезапрашиваем данные только если сменилась неделя
        const currentWeekNumberInState = weekSchedule ? getWeekNumber(new Date(weekSchedule[0]?.date.split('.').reverse().join('-'))) : null;
        if (weekSchedule === null || currentWeekNumberInState !== weekToFetch) {
            fetchWeekData();
        } else {
             // Если неделя та же, просто выключаем загрузчик (нужно для навигации внутри недели)
            setLoading(false);
        }

    }, [facultyId, groupId, selectedDate]);
    
    // Фильтруем и подготавливаем расписание на выбранный день
    const dailySchedule = useMemo(() => {
        if (!weekSchedule) return [];

        const selectedDateString = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
        
        // 1. Группируем все пары на этот день по времени
        const groupedByTime = weekSchedule
            .filter(lesson => lesson.date === selectedDateString)
            .reduce((acc, lesson) => {
                (acc[lesson.time] = acc[lesson.time] || []).push(lesson);
                return acc;
            }, {});
        
        // 2. Преобразуем группы в "супер-объекты" для отображения
        return Object.values(groupedByTime).map(lessonsInSlot => {
            // Если в это время только одна пара, возвращаем ее как есть
            if (lessonsInSlot.length === 1) {
                return lessonsInSlot[0];
            }
            
            // Если в это время несколько пар (дисциплины по выбору)
            return {
                isChoice: true,
                name: 'Дисциплины по выбору',
                time: lessonsInSlot[0].time, // Время у всех одинаковое
                type: `${lessonsInSlot.length} ${lessonsInSlot.length > 4 ? 'вариантов' : 'варианта'}`,
                subgroups: lessonsInSlot.flatMap(l => l.subgroups), // Собираем всех преподавателей
                // Сохраняем исходный массив пар для модального окна
                choiceLessons: lessonsInSlot
            };
        });
    }, [weekSchedule, year, month, day]);

    const weeklyScheduleData = useMemo(() => {
        if (!weekSchedule) return {};

        // 1. Группируем ВСЕ пары недели по дням
        const groupedByDay = weekSchedule.reduce((acc, lesson) => {
            (acc[lesson.day] = acc[lesson.day] || []).push(lesson);
            return acc;
        }, {});

        // 2. Внутри КАЖДОГО дня группируем по времени и объединяем "выборы"
        const finalWeeklySchedule = {};
        for (const day in groupedByDay) {
            const lessonsForDay = groupedByDay[day];
            const groupedByTime = lessonsForDay.reduce((acc, lesson) => {
                (acc[lesson.time] = acc[lesson.time] || []).push(lesson);
                return acc;
            }, {});

            finalWeeklySchedule[day] = Object.values(groupedByTime).map(lessonsInSlot => {
                if (lessonsInSlot.length === 1) {
                    return lessonsInSlot[0];
                }
                return {
                    isChoice: true,
                    name: 'Дисциплины по выбору',
                    time: lessonsInSlot[0].time,
                    type: `${lessonsInSlot.length} ${lessonsInSlot.length > 4 ? 'вариантов' : 'варианта'}`,
                    subgroups: lessonsInSlot.flatMap(l => l.subgroups),
                    choiceLessons: lessonsInSlot
                };
            }).sort((a, b) => a.time.localeCompare(b.time)); // Сортируем пары внутри дня
        }

        return finalWeeklySchedule;
    }, [weekSchedule]);

    useEffect(() => {
        // Не делаем ничего, пока данные грузятся ИЛИ если расписание на день пустое
        if (loading || dailySchedule.length === 0) return;

        const today = new Date();
        const isTodayView = selectedDate.getDate() === today.getDate() &&
                            selectedDate.getMonth() === today.getMonth() &&
                            selectedDate.getFullYear() === today.getFullYear();

        // Скроллим, только если это сегодняшний день
        if (isTodayView && timelineWrapperRef.current) {
            const topPosition = calculateTopPosition();
            if (topPosition !== null) {
                // setTimeout здесь больше не нужен, так как DOM уже обновлен
                timelineWrapperRef.current.scrollTo({
                    top: topPosition - (timelineWrapperRef.current.clientHeight / 3),
                    behavior: 'smooth'
                });
            }
        }
    // Запускаем этот эффект, когда меняется `dailySchedule` (т.е. данные для дня готовы)
    }, [dailySchedule, loading, selectedDate]);
    
    const openModal = (lesson) => {
        setSelectedLesson(lesson);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedLesson(null);
    };

    return (
        <>
            
            <Header 
                onToggleSidebar={() => setIsSidebarOpen(true)}
                onToggleRightPanel={() => setIsRightPanelOpen(true)}
                groupName={groupName}
            />
            <div 
                className={`
                    app-container 
                    ${isSidebarOpen ? 'sidebar-open' : ''} 
                    ${isRightPanelOpen ? 'right-panel-open' : ''}
                `}
            >
                <Sidebar groupName={groupName} />
                <Overlay isActive={isSidebarOpen || isRightPanelOpen} onClick={() => { setIsSidebarOpen(false); setIsRightPanelOpen(false); }} />
                
                <main className="main-content">
                    <div className="schedule-view">
                        {loading ? (
                            <div className="loading-placeholder">
                                <p>Загрузка расписания...</p>
                            </div>
                        ) : (
                            <>
                                {view === 'daily' && (
                                    <DailyView 
                                        schedule={dailySchedule} 
                                        date={selectedDate}
                                        onLessonClick={openModal}
                                        timelineRef={timelineWrapperRef}
                                    />
                                )}
                                {view === 'weekly' && (
                                    <WeeklyView 
                                        scheduleByDay={weeklyScheduleData}
                                        onLessonClick={openModal} 
                                    />
                                )}
                                {view === 'table' && (
                                    <TableView 
                                        weekSchedule={weekSchedule} // Передаем сырые данные
                                        onLessonClick={openModal} // openModal уже умеет работать с этим
                                    />
                                )}
                            </>
                        )}
                    </div>
                </main>
                <aside className="right-panel">
                    <ViewSwitcher view={view} setView={setView} />
                    <CalendarPicker selectedDate={selectedDate} view={view} />
                    <ActionButtons />
                </aside>
                <Modal 
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    lessonData={selectedLesson}
                />
            </div>
        </>
    );
}

export default SchedulePage;