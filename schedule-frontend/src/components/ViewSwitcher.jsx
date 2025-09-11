// src/components/ViewSwitcher.jsx

import React from 'react';
// Импортируем иконки для разных видов
import { FaRegCalendarAlt, FaCalendarWeek, FaTable } from 'react-icons/fa';
import './ViewSwitcher.css';

// Компонент принимает текущий активный вид (view) и функцию для его изменения (setView)
function ViewSwitcher({ view, setView }) {
  return (
    <div className="view-switcher">
      <button 
        className={`view-button ${view === 'daily' ? 'active' : ''}`}
        onClick={() => setView('daily')}
        aria-label="Дневной вид"
        title="Дневной вид"
      >
        <FaRegCalendarAlt />
      </button>
      <button 
        className={`view-button ${view === 'weekly' ? 'active' : ''}`}
        onClick={() => setView('weekly')}
        aria-label="Недельный вид"
        title="Недельный вид"
      >
        <FaCalendarWeek />
      </button>
      <button 
        className={`view-button ${view === 'table' ? 'active' : ''}`}
        onClick={() => setView('table')}
        aria-label="Вид таблицы"
        title="Вид таблицы"
      >
        <FaTable />
      </button>
    </div>
  );
}

export default ViewSwitcher;