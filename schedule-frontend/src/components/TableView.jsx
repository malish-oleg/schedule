// src/components/TableView.jsx

import React, { useMemo } from 'react';
import { FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import './TableView.css';

function TableView({ weekSchedule, onLessonClick }) {
    const dayOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    
    const timeSlots = useMemo(() => {
        if (!weekSchedule) return [];
        return Array.from(new Set(weekSchedule.map(lesson => lesson.time))).sort();
    }, [weekSchedule]);

    const scheduleMatrix = useMemo(() => {
        if (!weekSchedule) return {};
        const matrix = {};
        timeSlots.forEach(time => {
            matrix[time] = {};
            dayOrder.forEach(day => {
                matrix[time][day] = weekSchedule.find(l => l.day === day && l.time === time) || null;
            });
        });
        return matrix;
    }, [weekSchedule, timeSlots, dayOrder]);

    if (!weekSchedule || weekSchedule.length === 0) {
        return <div className="no-lessons-placeholder">На этой неделе нет занятий.</div>;
    }

    return (
        <div className="table-view-container" id="tableViewForExport">
            <div className="schedule-grid">
                {/* === ЗАГОЛОВОЧНАЯ СТРОКА === */}
                <div className="table-header time-cell">Время</div>
                {dayOrder.map(day => (
                    <div key={day} className="table-header">
                        <span className="day-name">{day}</span>
                        <span className="day-date">{scheduleMatrix[timeSlots[0]][day]?.date || ''}</span>
                    </div>
                ))}
                
                {/* === СТРОКИ С ДАННЫМИ === */}
                {timeSlots.map(time => (
                    // React.Fragment группирует элементы одной строки
                    <React.Fragment key={time}>
                        <div className="time-cell">{time}</div>
                        {dayOrder.map(day => {
                            const lesson = scheduleMatrix[time][day];
                            return (
                                <div key={`${time}-${day}`} className="lesson-cell">
                                    {lesson && !lesson.isEmpty && (
                                        <div 
                                            className={`lesson-card-table ${lesson.isChoice ? 'is-choice' : ''}`}
                                            onClick={() => onLessonClick(lesson)}
                                        >
                                            <p className="name" title={lesson.fullName}>{lesson.name}</p>
                                            <p className="type">{lesson.type}</p>
                                            <div className="details">
                                                <span><FaUsers /> {lesson.subgroups?.length || lesson.groups?.length || 0}</span>
                                                <span><FaMapMarkerAlt /> {lesson.subgroups?.[0]?.room || lesson.room || '...'}</span>
                                            </div>
                                        </div>
                                    )}
                                    {lesson && lesson.isEmpty && (
                                        <div className="lesson-card-table is-empty"></div>
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