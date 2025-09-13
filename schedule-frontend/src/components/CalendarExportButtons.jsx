// src/components/CalendarExportButtons.jsx

import React from 'react';
import { createEvents } from 'ics'; // Импортируем библиотеку
import { FaCalendarPlus } from 'react-icons/fa';
import './ActionButtons.css';

// Вспомогательная функция для преобразования даты и времени в формат, понятный `ics`
// "08.09.2025", "08:30" -> [2025, 9, 8, 8, 30]
const parseDateTime = (dateString, timeString) => {
    const [day, month, year] = dateString.split('.').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    return [year, month, day, hours, minutes];
};

function CalendarExportButtons({ weekSchedule, groupName, entityType }) {

    const handleExportICS = () => {
        if (!weekSchedule || weekSchedule.length === 0) {
            alert("Нет данных для экспорта в календарь.");
            return;
        }

        // 1. Преобразуем наше расписание в массив событий для `ics`
        const events = weekSchedule
            .filter(lesson => !lesson.isEmpty) // Пропускаем "окна"
            .map(lesson => {
                const [startTime, endTime] = lesson.time.split(' - ');
                
                let description = `Тип: ${lesson.type}\n`;
                let location = '';

                if (lesson.groups) { // Расписание преподавателя
                    description += `Группы: ${lesson.groups.join(', ')}`;
                    location = lesson.room || 'Аудитория не указана';
                } else { // Расписание студента
                    const teacherInfo = lesson.subgroups.map(sg => `${sg.teacherShort} (${sg.room})`).join('\n');
                    description += `Преподаватели:\n${teacherInfo}`;
                    location = lesson.subgroups.map(sg => sg.room).join(', ');
                }

                return {
                    title: lesson.name,
                    start: parseDateTime(lesson.date, startTime),
                    end: parseDateTime(lesson.date, endTime),
                    description,
                    location,
                };
            });

        // 2. Генерируем .ics файл
        createEvents(events, (error, value) => {
            if (error) {
                console.error(error);
                alert("Произошла ошибка при создании файла календаря.");
                return;
            }

            // 3. Создаем ссылку и "кликаем" по ней, чтобы скачать файл
            const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `Расписание_${groupName}.ics`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    return (
        <div className="action-buttons-container export-buttons">
            <button className="action-button primary" onClick={handleExportICS}>
                <FaCalendarPlus />
                <span>Добавить в календарь (.ics)</span>
            </button>
        </div>
    );
}

export default CalendarExportButtons;