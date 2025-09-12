// src/components/Modal.jsx

import React from 'react';
import { FaTimes, FaClock, FaChalkboardTeacher, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import './Modal.css';

function Modal({ isOpen, onClose, lessonData }) {
    if (!isOpen || !lessonData) return null;

    const lessonsToShow = lessonData.isChoice ? lessonData.choiceLessons : [lessonData];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}><FaTimes /></button>
                <div className="modal-header">
                    <p className="time"><FaClock /> {lessonData.time}</p>
                </div>
                <div className="modal-body">
                    {/* ИСПРАВЛЕНИЕ: Итерируемся по `lessonsToShow` */}
                    {lessonsToShow.map((lesson, index) => {
                        const isTeacherView = lesson.groups !== undefined;
                        let details;

                        if (isTeacherView) {
                            // Детали для расписания преподавателя
                            details = (
                                <div className="subgroup-details">
                                    <p className="room"><FaMapMarkerAlt /> {lesson.room || 'Не указана'}</p>
                                    <p className="teacher"><FaUsers /> Группы: {lesson.groups.join(', ')}</p>
                                </div>
                            );
                        } else {
                            // Детали для расписания студента
                            details = (
                                <>
                                    {lesson.subgroups?.map((sub, subIndex) => (
                                        <div key={subIndex} className="subgroup-details">
                                            <p className="teacher">
                                                <FaChalkboardTeacher />
                                                {sub.teacher || sub.teacherShort || 'Не указан'}
                                                {sub.subgroupNumber && ` (${sub.subgroupNumber} п/г)`}
                                            </p>
                                            <p className="room">
                                                <FaMapMarkerAlt />
                                                {sub.room || 'Не указана'}
                                            </p>
                                        </div>
                                    ))}
                                </>
                            );
                        }
                        // ===== КОНЕЦ ИЗМЕНЕНИЙ =====

                        return (
                            <div key={index} className="modal-lesson-item">
                                <h3 className="lesson-name">{lesson.fullName || lesson.name}</h3>
                                <p className="lesson-type">{lesson.type}</p>
                                {details}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Modal;