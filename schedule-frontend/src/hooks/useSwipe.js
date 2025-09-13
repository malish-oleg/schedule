// src/hooks/useSwipe.js

import { useState } from 'react';

export function useSwipe(onSwipeLeft, onSwipeRight, threshold = 50) {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const handleTouchStart = (e) => {
        setTouchEnd(null); // Сбрасываем предыдущий свайп
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > threshold;
        const isRightSwipe = distance < -threshold;

        if (isLeftSwipe) {
            onSwipeLeft();
        }

        if (isRightSwipe) {
            onSwipeRight();
        }
        
        // Сбрасываем состояние
        setTouchStart(null);
        setTouchEnd(null);
    };

    // Возвращаем объект с обработчиками, которые мы привяжем к нашему div
    return {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    };
}