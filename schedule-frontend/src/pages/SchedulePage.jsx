import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaChalkboardTeacher, FaMapMarkerAlt, FaClock, FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';


function SchedulePage() {
    const { facultyId, groupId, week } = useParams();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const dayOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

    useEffect(() => {
        if (!facultyId || !groupId || !week) return;

        const fetchSchedule = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/schedule`, {
                    faculty_id: facultyId,
                    group_id: groupId,
                    year_week_number: week
                });

                const groupedByDay = response.data.reduce((acc, lesson) => {
                    (acc[lesson.day] = acc[lesson.day] || []).push(lesson);
                    return acc;
                }, {});

                const finalSchedule = {};
                for (const day in groupedByDay) {
                    const lessonsForDay = groupedByDay[day];

                    const groupedByTime = lessonsForDay.reduce((acc, lesson) => {
                        if (!acc[lesson.time]) {
                            acc[lesson.time] = {
                                time: lesson.time,
                                lessons: []
                            };
                        }
                        acc[lesson.time].lessons.push(lesson);
                        return acc;
                    }, {});

                    finalSchedule[day] = Object.values(groupedByTime).sort((a, b) => a.time.localeCompare(b.time));
                }
                
                setSchedule(finalSchedule);
            } catch (err) {
                setError("Не удалось загрузить расписание. Возможно, для этой группы на текущей неделе нет пар.");
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, [facultyId, groupId, week]);

    const handlePrevWeek = () => {
        const prevWeek = parseInt(week, 10) - 1;
        navigate(`/schedule/${facultyId}/${groupId}/${prevWeek}`);
    };

    const handleNextWeek = () => {
        const nextWeek = parseInt(week, 10) + 1;
        navigate(`/schedule/${facultyId}/${groupId}/${nextWeek}`);
    };
    
    if (loading) return <div className="container"><h1>Загрузка расписания...</h1></div>;

    return (
        <>
            <Link to="/" className="back-link"><FaArrowLeft /> Назад к выбору группы</Link>
            {error ? (
                 <div className="schedule-title-container">
                    <button onClick={handlePrevWeek} className="nav-arrow"><FaChevronLeft /></button>
                    <div className="no-lessons-card full-page-card"><h1>{error}</h1></div>
                    <button onClick={handleNextWeek} className="nav-arrow"><FaChevronRight /></button>
                </div>
            ) : (
                <>
                    <div className="schedule-title-container">
                        <button onClick={handlePrevWeek} className="nav-arrow"><FaChevronLeft /></button>
                        <h1 className="schedule-header">Расписание</h1>
                        <button onClick={handleNextWeek} className="nav-arrow"><FaChevronRight /></button>
                    </div>
                    <div className="schedule-container">
                        {Object.keys(schedule)
                          .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
                          .map(day => (
                            <div key={day} className="day-column">
                              <div className="day-header">
                                <h2>{day}</h2>
                                <p className="date">{schedule[day][0]?.lessons[0]?.date || ' '}</p>
                              </div>

                              {schedule[day].length > 0 ? (
                                schedule[day].map((timeSlot, index) => (
                                  <div key={index} className="lesson-card">
                                    <p className="time"><FaClock /> {timeSlot.time}</p>
                                    
                                    {timeSlot.lessons.map((lesson, lessonIndex) => (
                                      <div key={lessonIndex} className="choice-lesson">
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
                                    ))}
                                  </div>
                                ))
                              ) : (
                                <div className="no-lessons-card">
                                  <p>Пар нет, можно отдыхать!</p>
                                </div>
                              )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}

export default SchedulePage;