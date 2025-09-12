// src/components/DailyView.jsx

import React from 'react';
import { FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import './DailyView.css';

const calculatePosition = (timeString) => {
    // Эти константы должны СТРОГО соответствовать CSS
    const timelineStartHour = 8;
    const pixelsPerHour = 80;

    // Защита от невалидных данных
    if (typeof timeString !== 'string' || !timeString.includes(' - ')) {
        console.error(`Invalid time string for position calculation: ${timeString}`);
        return { top: -1000, height: 0 }; // Прячем невалидный элемент
    }

    const [start, end] = timeString.split(' - ');
    if (!start || !end || !start.includes(':') || !end.includes(':')) {
        console.error(`Invalid start/end time format: ${timeString}`);
        return { top: -1000, height: 0 };
    }

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    // 1. Считаем смещение от начала шкалы (8:00) в минутах
    const topInMinutes = (startH * 60 + startM) - (timelineStartHour * 60);
    
    // 2. Считаем длительность пары в минутах
    const durationInMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    // 3. Переводим минуты в пиксели
    const top = (topInMinutes / 60) * pixelsPerHour;
    const height = (durationInMinutes / 60) * pixelsPerHour;

    return { top, height };
};

function DailyView({ schedule, date, onLessonClick, timelineRef }) {
    const hours = Array.from({ length: 14 }, (_, i) => i + 8);
    const dateTitle = new Intl.DateTimeFormat('ru-RU', { month: 'long', day: 'numeric' }).format(date);
    const dayOfWeekTitle = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    return (
        <div className="daily-view">
            <div className="daily-header">
                <h3>{dayOfWeekTitle}</h3>
                <h2>{dateTitle}</h2>
            </div>
            <div className="timeline-wrapper" ref={timelineRef}>
                <div className="timeline">
                    {/* ===== ИЗМЕНЕНИЕ ЗДЕСЬ ===== */}
                    {hours.map((hour, index) => (
                        <div 
                            key={hour} 
                            className="time-marker" 
                            style={{ top: `${index * pixelsPerHour}px` }}
                        >
                            <span className="hour-label">{hour}:00</span>
                            <div className="line"></div>
                        </div>
                    ))}
                    <div className="lessons-container">
                        {isToday && <CurrentTimeIndicator />}
                        {schedule.map((lesson, index) => {
                            if (lesson.isEmpty) return null;
                            const { top, height } = calculatePosition(lesson.time);
                            const isChoice = lesson.isChoice || false;

                            const isTeacherView = lesson.groups !== undefined;
                            let subDetails;

                            if (isTeacherView) {
                                // Вид для преподавателя
                                subDetails = (
                                    <>
                                        <span title={lesson.groups.join(', ')}>
                                            <FaUsers />
                                            {lesson.groups.length} {lesson.groups.length === 1 ? 'группа' : 'групп'}
                                        </span>
                                        <span>
                                            <FaMapMarkerAlt />
                                            {lesson.room || '...'}
                                        </span>
                                    </>
                                );
                            } else {
                                // Вид для студента (как и было)
                                subDetails = (
                                    <>
                                        {/* Добавляем проверку на существование subgroups */}
                                        <span title={lesson.subgroups?.map(s => s.teacher).join(', ')}>
                                            <FaUsers />
                                            {lesson.subgroups?.length || 0} преп.
                                        </span>
                                        <span>
                                            <FaMapMarkerAlt />
                                            {lesson.subgroups?.[0]?.room || '...'}
                                        </span>
                                    </>
                                );
                            }

                            return (
                                <div 
                                    key={index} 
                                    className={`daily-lesson ${isChoice ? 'is-choice' : ''}`}
                                    style={{ top: `${top}px`, height: `${height}px` }}
                                    onClick={() => onLessonClick(lesson)}
                                >
                                    <strong className="lesson-name">{lesson.name}</strong>
                                    <span className="lesson-details">{lesson.type}</span>
                                    <div className="lesson-sub-details">
                                        {subDetails}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Константа pixelsPerHour должна быть доступна и здесь
const pixelsPerHour = 80;

export default DailyView;