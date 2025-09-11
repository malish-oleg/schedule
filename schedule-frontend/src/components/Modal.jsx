// src/components/Modal.jsx

import React from 'react';
import { FaTimes, FaClock, FaChalkboardTeacher, FaMapMarkerAlt } from 'react-icons/fa';
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
                    {lessonsToShow.map((lesson, index) => (
                        <div key={index} className="modal-lesson-item">
                            <h3 className="lesson-name">{lesson.fullName || lesson.name}</h3>
                            <p className="lesson-type">{lesson.type}</p>
                            
                            {lesson.subgroups.map((sub, subIndex) => (
                                <div key={subIndex} className="subgroup-details">
                                    <p className="teacher">
                                        <FaChalkboardTeacher />
                                        {sub.teacher || sub.teacherShort || 'Не указан'}
                                    </p>
                                    <p className="room">
                                        <FaMapMarkerAlt />
                                        {sub.subgroupNumber && `(${sub.subgroupNumber}) `}
                                        {sub.room || 'Не указана'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Modal;