import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

function ThemeSwitcher() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const style = {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)',
    padding: '0.5rem',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1.2rem',
    display: 'flex',
  };

  return (
    <button onClick={toggleTheme} style={style} aria-label="Переключить тему">
      {theme === 'light' ? <FaMoon /> : <FaSun />}
    </button>
  );
}
export default ThemeSwitcher;