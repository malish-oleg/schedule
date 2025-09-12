// src/hooks/useWindowSize.js

import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    // Вызываем сразу, чтобы установить начальный размер
    handleResize();

    // Очищаем слушатель
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}