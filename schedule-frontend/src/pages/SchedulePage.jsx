// src/pages/SchedulePage.jsx

import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaChalkboardTeacher, FaMapMarkerAlt, FaClock, FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getWeekNumber } from '../utils/dateUtils';
import Modal from '../components/Modal';

function SchedulePage() {
    // `week` теперь может быть undefined, если его нет в URL
    const { facultyId, groupId, week } = useParams();
    const navigate = useNavigate();
    const dayRefs = useRef({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

    const [schedule, setSchedule] = useState({});
    const [weekInfo, setWeekInfo] = useState('');
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const dayOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

    const openModal = (timeSlot) => {
        setSelectedTimeSlot(timeSlot);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTimeSlot(null);
    };

    useEffect(() => {
        if (!facultyId || !groupId) return;

        const fetchSchedule = async () => {
            try {
                setLoading(true);
                setError(null);
                setGroupName('');
                setWeekInfo('');
                setSchedule({});

                // Если `week` в URL есть, используем его. Если нет - вычисляем текущую неделю.
                const weekToFetch = week || getWeekNumber(new Date());

                const scheduleResponse = await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule`, {
                    faculty_id: facultyId,
                    group_id: groupId,
                    year_week_number: weekToFetch.toString()
                });
                
                // Вся логика обработки ответа должна быть здесь, ПОСЛЕ получения ответа
                const { weekInfo: newWeekInfo, schedule: lessons } = scheduleResponse.data;
                setWeekInfo(newWeekInfo);
                
                try {
                    const groupsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups/${facultyId}`);
                    const currentGroup = groupsResponse.data.find(g => g.id === groupId);
                    if (currentGroup) setGroupName(currentGroup.name);
                } catch (groupError) { console.error("Could not fetch group name", groupError); }
                
                const groupedByDay = lessons.reduce((acc, lesson) => {
                    (acc[lesson.day] = acc[lesson.day] || []).push(lesson);
                    return acc;
                }, {});

                const finalSchedule = {};
                for (const day in groupedByDay) {
                    const lessonsForDay = groupedByDay[day];
                    const groupedByTime = lessonsForDay.reduce((acc, lesson) => {
                        if (!acc[lesson.time]) {
                            acc[lesson.time] = { time: lesson.time, lessons: [] };
                        }
                        acc[lesson.time].lessons.push(lesson);
                        return acc;
                    }, {});
                    finalSchedule[day] = Object.values(groupedByTime).sort((a, b) => a.time.localeCompare(b.time));
                }
                
                if (Object.keys(finalSchedule).length === 0) {
                    setError("На выбранной неделе нет занятий.");
                } else {
                    setSchedule(finalSchedule);

                    setTimeout(() => {
                        const today = new Date();
                        const day = String(today.getDate()).padStart(2, '0');
                        const month = String(today.getMonth() + 1).padStart(2, '0');
                        const year = today.getFullYear();
                        const formattedToday = `${day}.${month}.${year}`;

                        let todayDayName = null;

                        for (const [dayName, dayData] of Object.entries(finalSchedule)) {
                            if (dayData[0]?.lessons[0]?.date === formattedToday) {
                                todayDayName = dayName;
                                break;
                            }
                        }

                        if (todayDayName && dayRefs.current[todayDayName]) {
                            dayRefs.current[todayDayName].scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                    }, 100);
                }

            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError("Расписание для данной группы не найдено.");
                } else {
                    setError("На выбранной неделе нет занятий.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, [facultyId, groupId, week]);

    const handlePrevWeek = () => {
        const currentWeekNumber = parseInt(week || getWeekNumber(new Date()), 10);
        const prevWeek = currentWeekNumber - 1;
        navigate(`/schedule/${facultyId}/${groupId}/${prevWeek}`);
    };

    const handleNextWeek = () => {
        const currentWeekNumber = parseInt(week || getWeekNumber(new Date()), 10);
        const nextWeek = currentWeekNumber + 1;
        navigate(`/schedule/${facultyId}/${groupId}/${nextWeek}`);
    };
    
    if (loading) return <div className="container"><h1>Загрузка...</h1></div>;

    return (
        <>
            <Link to="/" className="back-link"><FaArrowLeft /> Назад к выбору группы</Link>
            
            <div className="schedule-title-container">
                <button onClick={handlePrevWeek} className="nav-arrow"><FaChevronLeft /></button>
                <div className="schedule-title">
                    <h2 className="group-name">Группа {groupName || groupId}</h2>
                    <h1 className="schedule-header">Расписание</h1>
                    {weekInfo && <p className="week-info">{weekInfo}</p>}
                </div>
                <button onClick={handleNextWeek} className="nav-arrow"><FaChevronRight /></button>
            </div>
            
            {error ? (
                <div className="no-lessons-card full-page-card"><h1>{error}</h1></div>
            ) : (
                <div className="schedule-container">
                    {Object.keys(schedule)
                      .filter(day => schedule[day].length > 0)
                      .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
                      .map(day => (
                        <div key={day} className="day-column" ref={(el) => (dayRefs.current[day] = el)}>
                          <div className="day-header">
                            <h2>{day}</h2>
                            <p className="date">{schedule[day][0]?.lessons[0]?.date || ' '}</p>
                          </div>
                          {schedule[day].map((timeSlot, index) => (
                              <div key={index} className={`timeslot-wrapper ${timeSlot.lessons.length > 1 ? 'is-choice' : ''}`}>
                              <p className="time"><FaClock /> {timeSlot.time}</p>
                              
                              {timeSlot.lessons.map((lesson, lessonIndex) => (
                                lesson.isEmpty ? (
                                    <div key={lessonIndex} className="lesson-card empty-lesson">
                                        <p>Окно</p>
                                    </div>
                                ) : (
                                    <div key={lessonIndex} className="lesson-card choice-lesson" onClick={() => openModal(timeSlot)}>
                                      <div className="lesson-info" title={lesson.fullName}>
                                        <h3 className="lesson-name">{lesson.name}</h3>
                                        {lesson.type && <p className="lesson-type">{lesson.type}</p>}
                                      </div>
                                      <div className="lesson-details">
                                        {lesson.subgroups.map((sub, subIndex) => (
                                          <div key={subIndex} className="subgroup-info">
                                            <p className="teacher">
                                              <FaChalkboardTeacher />
                                              {sub.teacherShort || 'Не указан'}
                                            </p>
                                            <p className="room">
                                              <FaMapMarkerAlt />
                                              {sub.subgroupNumber && `(${sub.subgroupNumber}) `}
                                              {sub.room || 'Не указана'}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                )
                              ))}
                              </div>
                          ))}
                        </div>
                    ))}
                </div>
            )}
          <Modal 
              isOpen={isModalOpen} 
              onClose={closeModal} 
              timeSlot={selectedTimeSlot} 
          />
        </>
    );
}

export default SchedulePage;