// src/components/ExportButtons.jsx

import React from 'react';
import { FaFileExcel, FaFileImage } from 'react-icons/fa';
import './ActionButtons.css'; // Мы можем переиспользовать стили от ActionButtons

function ExportButtons({ scheduleData, groupName }) {
    
    // Функция экспорта в Excel (XLSX)
    const handleExportXLSX = async () => {
        if (!scheduleData || Object.keys(scheduleData).length === 0) {
            alert("Нет данных для экспорта.");
            return;
        }

        const XLSX = await import('xlsx');

        const dayOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
        
        // Получаем все пары из объекта scheduleData и находим уникальные временные слоты
        const allLessons = Object.values(scheduleData).flat();
        const timeSlots = Array.from(new Set(allLessons.map(l => l.time))).sort();

        const headers = ["Время", ...dayOrder];
        const data = [headers];

        timeSlots.forEach(time => {
            const row = [time];
            dayOrder.forEach(day => {
                // Находим все "супер-объекты" пар для данного дня и времени
                const lessonsInSlot = scheduleData[day]?.filter(l => l.time === time) || [];
                
                if (lessonsInSlot.length > 0) {
                    const cellText = lessonsInSlot.map(lessonObject => {
                        // lessonObject - это наш "супер-объект"
                        if (lessonObject.isEmpty) return "Окно";

                        // Если это дисциплина по выбору, обрабатываем ее choiceLessons
                        if (lessonObject.isChoice) {
                            return lessonObject.choiceLessons.map(l => {
                                const isTeacherView = l.groups !== undefined;
                                if (isTeacherView) {
                                    return `${l.name} (${l.type})\nГруппы: ${l.groups.join(', ')}\nАуд: ${l.room}`;
                                } else {
                                    return `${l.name} (${l.type})\n${l.subgroups.map(sg => `${sg.teacherShort} (${sg.room})`).join(', ')}`;
                                }
                            }).join('\n---\n');
                        }
                        
                        // Если это обычная одиночная пара
                        const isTeacherView = lessonObject.groups !== undefined;
                        if (isTeacherView) {
                            return `${lessonObject.name} (${lessonObject.type})\nГруппы: ${lessonObject.groups.join(', ')}\nАуд: ${lessonObject.room}`;
                        } else {
                            return `${lessonObject.name} (${lessonObject.type})\n${lessonObject.subgroups.map(sg => `${sg.teacherShort} (${sg.room})`).join(', ')}`;
                        }

                    }).join('\n---\n'); // Соединяем, если вдруг в ячейке несколько "супер-объектов" (не должно быть)

                    row.push(cellText);
                } else {
                    row.push(""); // Пустая ячейка
                }
            });
            data.push(row);
        });
        
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Расписание");
        XLSX.writeFile(workbook, `Расписание_${groupName}.xlsx`);
    };

    // Функция экспорта в PNG
    const handleExportPNG = async () => {
        const tableViewContainer = document.getElementById('tableViewForExport');
        const gridElement = tableViewContainer?.querySelector('.schedule-grid');
        
        if (!tableViewContainer || !gridElement) {
            alert("Для экспорта в PNG откройте вид 'Таблица'.");
            return;
        }

        const { default: html2canvas } = await import('html2canvas');

        // ===== НАЧАЛО НОВОЙ ЛОГИКИ =====

        // 1. Находим все "липкие" элементы
        const stickyElements = Array.from(gridElement.querySelectorAll('.time-cell, .table-header'));
        
        // 2. Временно убираем "липкость", чтобы она не мешала скриншоту
        stickyElements.forEach(el => el.style.position = 'static');

        // 3. Сохраняем текущую позицию скролла, чтобы вернуть ее позже
        const originalScrollTop = tableViewContainer.scrollTop;
        const originalScrollLeft = tableViewContainer.scrollLeft;
        // Прокручиваем в самое начало
        tableViewContainer.scrollTop = 0;
        tableViewContainer.scrollLeft = 0;

        const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();
        const scale = Math.min(window.devicePixelRatio, 3);

        // 2. Делаем скриншот с новым параметром `scale`
        html2canvas(clone, {
            useCORS: true,
            backgroundColor: backgroundColor,
            width: clone.scrollWidth,
            height: clone.scrollHeight,
            windowWidth: clone.scrollWidth,
            windowHeight: clone.scrollHeight,
            scale: scale, // <-- ГЛАВНОЕ ИЗМЕНЕНИЕ
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `Расписание_${groupName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error("Ошибка при создании PNG:", err);
            alert("Произошла ошибка при создании изображения.");
        }).finally(() => {
            document.body.removeChild(container);
        });

        // ===== КОНЕЦ НОВОЙ ЛОГИКИ =====
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