// src/components/CalendarPicker.jsx

import React from 'react';
import Calendar from 'react-calendar';
import { useNavigate, useParams } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';

// Вспомогательная функция для получения начала и конца недели
const getWeekRange = (date) => {
    const start = new Date(date);
    // Находим понедельник (день недели 1, но в getDay() вс=0, пн=1, ...)
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Коррекция для воскресенья
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { start, end };
};

function CalendarPicker({ selectedDate, view }) { // <-- Добавляем `view` в пропсы
    const navigate = useNavigate();
    const { facultyId, groupId } = useParams();

    const handleDateChange = (date) => {
        let targetDate = date;

        // Если мы в режиме просмотра недели или таблицы
        if (view === 'weekly' || view === 'table') {
            // Находим понедельник этой недели
            const weekStart = getWeekRange(date).start;
            targetDate = weekStart;
        }
        
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const day = targetDate.getDate();

        navigate(`/schedule/${facultyId}/${groupId}/${year}/${month}/${day}`);
    };

    // Функция для добавления класса к ячейкам недели
    const tileClassName = ({ date, view: calendarView }) => {
        if (calendarView === 'month' && (view === 'weekly' || view === 'table')) {
            const { start, end } = getWeekRange(selectedDate);
            // Убираем время из дат для корректного сравнения
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);

            if (date >= start && date <= end) {
                return 'week-highlight'; // Класс для подсветки недели
            }
        }
        return null;
    };

    return (
        <div className="calendar-widget">
            <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                locale="ru-RU"
                tileClassName={tileClassName} // <-- Добавляем новое свойство
            />
        </div>
    );
}

export default CalendarPicker;