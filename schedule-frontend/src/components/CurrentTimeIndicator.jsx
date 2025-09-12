// src/components/CurrentTimeIndicator.jsx

import React, { useState, useEffect, useRef } from 'react';

// Та же самая логика, что и в DailyView, для консистентности
const calculateTopPosition = () => {
    const now = new Date();
    const timelineStartHour = 8;
    const pixelsPerHour = 80;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Считаем, сколько всего минут прошло с начала временной шкалы (8:00)
    const minutesFromStart = (currentHour * 60 + currentMinute) - (timelineStartHour * 60);

    // Если текущее время вне нашей шкалы (до 8 утра или после 22 вечера), не показываем индикатор
    if (minutesFromStart < 0 || minutesFromStart > (14 * 60)) {
        return null;
    }

    // Переводим минуты в пиксели
    return (minutesFromStart / 60) * pixelsPerHour;
};

function CurrentTimeIndicator() {
    const [topPosition, setTopPosition] = useState(calculateTopPosition());
    const indicatorRef = useRef(null); // Ref для самой линии

    useEffect(() => {
        // Функция для обновления позиции
        const updatePosition = () => {
            setTopPosition(calculateTopPosition());
        };

        // Запускаем интервал, который будет обновлять позицию каждую минуту
        const intervalId = setInterval(updatePosition, 60000); // 60000 ms = 1 минута

        // Очищаем интервал, когда компонент размонтируется
        return () => clearInterval(intervalId);
    }, []);
    
    // Если topPosition null (т.е. сейчас не рабочее время), не рендерим ничего
    if (topPosition === null) {
        return null;
    }

    return (
        <div 
            ref={indicatorRef}
            className="current-time-indicator" 
            style={{ top: `${topPosition}px` }}
        >
            <div className="time-dot"></div>
            <div className="time-line"></div>
        </div>
    );
}

// Экспортируем и ref для возможности скролла к нему
export { CurrentTimeIndicator, calculateTopPosition };