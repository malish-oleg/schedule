// src/components/TableView.jsx

import React, { useMemo } from 'react';
import { FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import './TableView.css';

function TableView({ weekSchedule, onLessonClick }) {
    const dayOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    
    const timeSlots = useMemo(() => {
        if (!weekSchedule) return [];
        const uniqueTimes = new Set(weekSchedule.map(lesson => lesson.time));
        return Array.from(uniqueTimes).sort();
    }, [weekSchedule]);

    const scheduleMatrix = useMemo(() => {
        if (!weekSchedule) return {};
        const matrix = {};
        timeSlots.forEach(time => {
            matrix[time] = {};
            dayOrder.forEach(day => {
                const lesson = weekSchedule.find(l => l.day === day && l.time === time);
                matrix[time][day] = lesson || null;
            });
        });
        return matrix;
    }, [weekSchedule, timeSlots, dayOrder]);

    if (!weekSchedule || weekSchedule.length === 0) {
        return <div className="no-lessons-placeholder">На этой неделе нет занятий.</div>;
    }

    return (
        <div className="table-view-container">
            <div className="schedule-grid">
                {/* Заголовки (оси таблицы) */}
                <div className="table-header time-cell">Время</div>
                {dayOrder.map( day => {
                    const firstLessonOfTheDay = weekSchedule.find(l => l.day === day);
                    const date = firstLessonOfTheDay ? firstLessonOfTheDay.date : '';
                    return (
                        <div key={day} className="table-header">
                            <span className="day-name">{day}</span>
                            {/* Добавляем дату под названием дня */}
                            {date && <span className="day-date">{date}</span>}
                        </div>
                    )
                })}
                
                {/* Строки таблицы */}
                {timeSlots.map(time => (
                    <React.Fragment key={time}>
                        <div className="time-cell">{time}</div>
                        {dayOrder.map(day => {
                            const lesson = scheduleMatrix[time][day];
                            return (
                                <div key={`${time}-${day}`} className="lesson-cell">
                                    {lesson && !lesson.isEmpty && (
                                        <div 
                                            className={`lesson-card-table ${lesson.isChoice ? 'is-choice' : ''}`}
                                            data-day={day}
                                            data-time={time}
                                            onClick={() => onLessonClick(lesson)}
                                        >
                                            <p className="name" title={lesson.fullName}>{lesson.name}</p>
                                            <p className="type">{lesson.type}</p>
                                            <div className="details">
                                                <span><FaUsers /> {lesson.subgroups.length}</span>
                                                <span><FaMapMarkerAlt /> {lesson.subgroups[0]?.room || '...'}</span>
                                            </div>
                                        </div>
                                    )}
                                    {lesson && lesson.isEmpty && (
                                        <div 
                                            className="lesson-card-table is-empty"
                                            data-day={day}
                                            data-time={time}
                                        >
                                            Окно
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

export default TableView;