// src/pages/SchedulePage.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { useSwipe } from '../hooks/useSwipe';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CalendarPicker from '../components/CalendarPicker';
import DailyView from '../components/DailyView';
import Modal from '../components/Modal';
import { calculateTopPosition } from '../components/CurrentTimeIndicator';
import ViewSwitcher from '../components/ViewSwitcher';
import WeeklyView from '../components/WeeklyView';
import TableView from '../components/TableView';
import Header from '../components/Header';
import Overlay from '../components/Overlay';
import ActionButtons from '../components/ActionButtons';
import ContactView from '../components/ContactView';
import { getWeekNumber } from '../utils/dateUtils';
import ExportButtons from '../components/ExportButtons';
import CalendarExportButtons from '../components/CalendarExportButtons';

function SchedulePage() {
    // Получаем универсальные параметры из URL
    const { type, id1, id2, year, month, day } = useParams();
    const navigate = useNavigate();
    const selectedDate = useMemo(() => new Date(year, month - 1, day), [year, month, day]);
    
    const timelineWrapperRef = useRef(null); 
    const [weekSchedule, setWeekSchedule] = useState(null);
    const [entityName, setEntityName] = useState(''); // Универсальное имя (группы или преподавателя)
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('daily');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
    const [activeView, setActiveView] = useState('schedule');

    // Эффект для загрузки данных в зависимости от типа (студент/преподаватель)
    useEffect(() => {
        if (!type || !id1 || !id2) return;

        const weekToFetch = getWeekNumber(selectedDate);
        
        const fetchScheduleData = async () => {
            setLoading(true);
            try {
                let namePromise, schedulePromise;

                if (type === 'group') {
                    // Запросы для группы
                    namePromise = axios.get(`${import.meta.env.VITE_API_URL}/api/all-groups`);
                    schedulePromise = axios.post(`${import.meta.env.VITE_API_URL}/api/schedule`, {
                        faculty_id: id1, group_id: id2, year_week_number: weekToFetch.toString(),
                    });
                } else if (type === 'teacher') {
                    // Запросы для преподавателя
                    namePromise = axios.get(`${import.meta.env.VITE_API_URL}/api/all-teachers`);
                    schedulePromise = axios.post(`${import.meta.env.VITE_API_URL}/api/teacher-schedule`, {
                        chair_id: id1, teacher_id: id2, year_week_number: weekToFetch.toString(),
                    });
                } else {
                    throw new Error("Unknown schedule type");
                }

                const [nameRes, scheduleRes] = await Promise.all([namePromise, schedulePromise]);
                
                // Находим имя сущности
                const currentEntity = nameRes.data.find(e => e.id === id2);
                if (currentEntity) setEntityName(currentEntity.name);

                // Сохраняем расписание
                setWeekSchedule(scheduleRes.data.schedule);

            } catch (err) {
                console.error("Failed to fetch schedule data", err);
                setWeekSchedule([]);
            } finally {
                setLoading(false);
            }
        };
        
        const currentWeekNumberInState = weekSchedule ? getWeekNumber(new Date(weekSchedule[0]?.date.split('.').reverse().join('-'))) : null;
        if (weekSchedule === null || currentWeekNumberInState !== weekToFetch) {
            fetchScheduleData();
        } else {
            setLoading(false);
        }

    }, [type, id1, id2, selectedDate]);
    
    // `dailySchedule` и `weeklyScheduleData` остаются без изменений,
    // так как они работают с уже загруженными `weekSchedule`.
    const dailySchedule = useMemo(() => {
        if (!weekSchedule) return [];
        const selectedDateString = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
        const groupedByTime = weekSchedule.filter(lesson => lesson.date === selectedDateString).reduce((acc, lesson) => {
            (acc[lesson.time] = acc[lesson.time] || []).push(lesson);
            return acc;
        }, {});
        return Object.values(groupedByTime).map(lessonsInSlot => {
            if (lessonsInSlot.length === 1) return lessonsInSlot[0];
            return { isChoice: true, name: 'Дисциплины по выбору', time: lessonsInSlot[0].time, type: `${lessonsInSlot.length} ${lessonsInSlot.length > 4 ? 'вариантов' : 'варианта'}`, subgroups: lessonsInSlot.flatMap(l => l.subgroups), choiceLessons: lessonsInSlot };
        });
    }, [weekSchedule, year, month, day]);

    const weeklyScheduleData = useMemo(() => {
        if (!weekSchedule) return {};
        const groupedByDay = weekSchedule.reduce((acc, lesson) => {
            (acc[lesson.day] = acc[lesson.day] || []).push(lesson);
            return acc;
        }, {});
        const finalWeeklySchedule = {};
        for (const dayName in groupedByDay) {
            const lessonsForDay = groupedByDay[dayName];
            const groupedByTime = lessonsForDay.reduce((acc, lesson) => {
                (acc[lesson.time] = acc[lesson.time] || []).push(lesson);
                return acc;
            }, {});
            finalWeeklySchedule[dayName] = Object.values(groupedByTime).map(lessonsInSlot => {
                if (lessonsInSlot.length === 1) return lessonsInSlot[0];
                return { isChoice: true, name: 'Дисциплины по выбору', time: lessonsInSlot[0].time, type: `${lessonsInSlot.length} ${lessonsInSlot.length > 4 ? 'вариантов' : 'варианта'}`, subgroups: lessonsInSlot.flatMap(l => l.subgroups), choiceLessons: lessonsInSlot };
            }).sort((a, b) => a.time.localeCompare(b.time));
        }
        return finalWeeklySchedule;
    }, [weekSchedule]);

    // Эффект для авто-прокрутки
    useEffect(() => {
        if (loading || dailySchedule.length === 0) return;
        const today = new Date();
        const isTodayView = selectedDate.getDate() === today.getDate() && selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();
        if (isTodayView && timelineWrapperRef.current) {
            const topPosition = calculateTopPosition();
            if (topPosition !== null) {
                timelineWrapperRef.current.scrollTo({ top: topPosition - (timelineWrapperRef.current.clientHeight / 3), behavior: 'smooth' });
            }
        }
    }, [dailySchedule, loading, selectedDate]);
    
    const openModal = (lesson) => {
        setSelectedLesson(lesson);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedLesson(null);
    };

    const navigateToDay = (date) => {
        const newYear = date.getFullYear();
        const newMonth = date.getMonth() + 1;
        const newDay = date.getDate();
        navigate(`/schedule/${type}/${id1}/${id2}/${newYear}/${newMonth}/${newDay}`);
    };
    
    const handlePrevDay = () => {
        const prevDay = new Date(selectedDate);
        prevDay.setDate(prevDay.getDate() - 1);
        navigateToDay(prevDay);
    };

    const handleNextDay = () => {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        navigateToDay(nextDay);
    };

    // ===== ИСПОЛЬЗУЕМ ХУК СВАЙПА =====
    const swipeHandlers = useSwipe(handleNextDay, handlePrevDay);

    // Определяем данные для сайдбара
    const sidebarTitle = type === 'group' ? 'Группа' : 'Преподаватель';
    const sidebarInitials = entityName ? (type === 'teacher' ? entityName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : entityName.substring(0, 2)) : '..';

    return (
        <>
            <Header 
                onToggleSidebar={() => setIsSidebarOpen(true)}
                onToggleRightPanel={() => setIsRightPanelOpen(true)}
                groupName={entityName}
            />
            <div 
                className={`
                    app-container 
                    ${isSidebarOpen ? 'sidebar-open' : ''} 
                    ${isRightPanelOpen ? 'right-panel-open' : ''}
                `}
            >
                <Overlay isActive={isSidebarOpen || isRightPanelOpen} onClick={() => { setIsSidebarOpen(false); setIsRightPanelOpen(false); }} />
                
                <Sidebar 
                    title={sidebarTitle}
                    name={entityName}
                    initials={sidebarInitials}
                    on_Close={() => setIsSidebarOpen(false)}
                    activeView={activeView}
                    setActiveView={setActiveView}
                />
                
                <main className="main-content">
                    <div className="schedule-view">
                        {activeView === 'schedule' ? (
                        <>
                            {loading ? (
                                <div className="loading-placeholder">
                                    <p>Загрузка расписания...</p>
                                </div>
                            ) : (
                                <>
                                    {view === 'daily' && (
                                        <div className="swipe-wrapper" {...swipeHandlers}>
                                            <DailyView 
                                                schedule={dailySchedule} 
                                                date={selectedDate}
                                                onLessonClick={openModal}
                                                timelineRef={timelineWrapperRef}
                                            />
                                        </div>
                                    )}
                                    {view === 'weekly' && (
                                        <WeeklyView 
                                            scheduleByDay={weeklyScheduleData}
                                            onLessonClick={openModal} 
                                        />
                                    )}
                                    {view === 'table' && (
                                        <TableView 
                                            weekSchedule={weekSchedule}
                                            onLessonClick={openModal}
                                        />
                                    )}
                                </>
                            )}
                        </>
                        ) : (
                            <ContactView />
                        )}
                    </div>
                </main>
                <aside className="right-panel">
                    <button className="panel-close-button" onClick={() => setIsRightPanelOpen(false)}>
                        <FaTimes />
                    </button>
                    <div className="panel-content">
                        <ViewSwitcher view={view} setView={setView} />
                        <CalendarPicker selectedDate={selectedDate} view={view} />
                        <ActionButtons />
                        {(view === 'weekly' || view === 'table') && (
                            <ExportButtons 
                                scheduleData={weeklyScheduleData} 
                                groupName={entityName}
                            />
                        )}
                        {view === 'daily' && (
                            <CalendarExportButtons 
                                weekSchedule={weekSchedule} // Передаем НЕФИЛЬТРОВАННЫЕ данные на неделю
                                groupName={entityName}
                                entityType={type} // Передаем тип (group/teacher)
                            />
                        )}
                    </div>
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