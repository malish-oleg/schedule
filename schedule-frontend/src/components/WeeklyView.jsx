// src/components/WeeklyView.jsx

import React from 'react';
import { FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import './WeeklyView.css';

function WeeklyView({ scheduleByDay, onLessonClick }) {
    const dayOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

    // Фильтруем дни, в которые есть пары, сохраняя правильный порядок
    const daysWithLessons = dayOrder.filter(day => scheduleByDay[day] && scheduleByDay[day].length > 0);

    if (daysWithLessons.length === 0) {
        return <div className="no-lessons-placeholder">На этой неделе нет занятий.</div>;
    }

    return (
        <div className="weekly-view-container">
            {daysWithLessons.map(dayName => {
                const lessonsForDay = scheduleByDay[dayName];
                // Берем дату из первой пары дня
                const date = lessonsForDay[0]?.date || '';

                return (
                    <div key={dayName} className="day-column-weekly">
                        <div className="day-header-weekly">
                            <h3>{dayName}</h3>
                            <p>{date}</p>
                        </div>
                        <div className="lessons-list">
                            {lessonsForDay.map((lesson, index) => {
                                const isTeacherView = lesson.groups !== undefined;
                                let details;

                                if (isTeacherView) {
                                    details = (
                                        <>
                                            <span><FaUsers /> {lesson.groups.length} {lesson.groups.length === 1 ? 'группа' : 'групп'}</span>
                                            <span><FaMapMarkerAlt /> {lesson.room || '...'}</span>
                                        </>
                                    );
                                } else {
                                    details = (
                                        <>
                                            <span><FaUsers /> {lesson.subgroups?.length || 0} преп.</span>
                                            <span><FaMapMarkerAlt /> {lesson.subgroups?.[0]?.room || '...'}</span>
                                        </>
                                    );
                                }
                                // ===== КОНЕЦ ИЗМЕНЕНИЙ =====

                                return (
                                    <div 
                                        key={index} 
                                        className={`lesson-card-weekly ${lesson.isChoice ? 'is-choice' : ''}`}
                                        onClick={() => onLessonClick(lesson)}
                                    >
                                        <p className="time">{lesson.time}</p>
                                        <p className="name" title={lesson.fullName}>{lesson.name}</p>
                                        <p className="type">{lesson.type}</p>
                                        <div className="details">
                                            {details}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}

export default WeeklyView;