// src/components/ExportButtons.jsx

import React from 'react';
import { FaFileExcel, FaFileImage } from 'react-icons/fa';
import './ActionButtons.css'; // Мы можем переиспользовать стили от ActionButtons

function ExportButtons({ scheduleData, groupName }) {
    
    // Функция экспорта в Excel (XLSX)
    const handleExportXLSX = async() => {
        if (!scheduleData || Object.keys(scheduleData).length === 0) {
            alert("Нет данных для экспорта.");
            return;
        }

        const XLSX = await import('xlsx');

        const dayOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
        const timeSlots = Array.from(new Set(Object.values(scheduleData).flat().map(l => l.time))).sort();

        // 1. Создаем заголовки (Время, ПН, ВТ, ...)
        const headers = ["Время", ...dayOrder];
        const data = [headers];

        // 2. Заполняем строки данными
        timeSlots.forEach(time => {
            const row = [time];
            dayOrder.forEach(day => {
                const lessonsInSlot = scheduleData[day]?.filter(l => l.time === time);
                if (lessonsInSlot && lessonsInSlot.length > 0) {
                    // Собираем текст для ячейки
                    const cellText = lessonsInSlot.map(lesson => {
                        if (lesson.isEmpty) return "Окно";
                        const details = lesson.isChoice ? 
                            lesson.choiceLessons.map(l => `${l.name} (${l.type})`).join('\n') :
                            `${lesson.name} (${lesson.type})\n${lesson.subgroups[0]?.teacherShort || ''}\n${lesson.subgroups[0]?.room || ''}`;
                        return details;
                    }).join('\n---\n');
                    row.push(cellText);
                } else {
                    row.push(""); // Пустая ячейка
                }
            });
            data.push(row);
        });
        
        // 3. Создаем и скачиваем файл
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Расписание");
        XLSX.writeFile(workbook, `Расписание_${groupName}.xlsx`);
    };

    // Функция экспорта в PNG
    const handleExportPNG = async() => {
        // Ищем элемент с таблицей в DOM. Мы дадим ему id='tableView'
        const tableViewElement = document.getElementById('tableViewForExport');
        
        if (!tableViewElement) {
            alert("Для экспорта в PNG откройте вид 'Таблица'.");
            return;
        }

        const { default: html2canvas } = await import('html2canvas');

        html2canvas(tableViewElement, {
            useCORS: true, // На случай, если есть внешние изображения
            scale: 2, // Увеличиваем разрешение для лучшего качества
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `Расписание_${groupName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    };

    return (
        <div className="action-buttons-container export-buttons">
            <button className="action-button" onClick={handleExportXLSX}>
                <FaFileExcel />
                <span>Экспорт в XLSX</span>
            </button>
            <button className="action-button" onClick={handleExportPNG}>
                <FaFileImage />
                <span>Экспорт в PNG</span>
            </button>
        </div>
    );
}

export default ExportButtons;