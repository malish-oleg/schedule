// src/components/ActionButtons.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaShareAlt, FaDownload } from 'react-icons/fa';
import './ActionButtons.css';

function ActionButtons() {
    const { facultyId, groupId } = useParams();
    const [copySuccess, setCopySuccess] = useState(''); // Состояние для сообщения об успехе
    const [installPrompt, setInstallPrompt] = useState(null);

    // Ловим событие, которое позволяет показать кастомную кнопку установки
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Функция копирования ссылки
    const handleCopyLink = () => {
        const link = `${window.location.origin}/schedule/${facultyId}/${groupId}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopySuccess('Ссылка скопирована!');
            // Убираем сообщение через 2 секунды
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            setCopySuccess('Ошибка копирования!');
            setTimeout(() => setCopySuccess(''), 2000);
            console.error('Could not copy text: ', err);
        });
    };

    // Функция установки приложения
    const handleInstallApp = async () => {
        if (!installPrompt) {
            alert("Чтобы установить приложение, используйте меню браузера ('Добавить на главный экран' или 'Установить').");
            return;
        }
        const result = await installPrompt.prompt();
        // Сбрасываем prompt, так как его можно использовать только один раз
        setInstallPrompt(null);
    };

    return (
        <div className="action-buttons-container">
            <button className="action-button" onClick={handleCopyLink}>
                <FaShareAlt />
                <span>{copySuccess || 'Короткая ссылка'}</span>
            </button>
            
            {/* Кнопка установки показывается, только если браузер это позволяет */}
            {installPrompt && (
                <button className="action-button primary" onClick={handleInstallApp}>
                    <FaDownload />
                    <span>Добавить на экран</span>
                </button>
            )}
        </div>
    );
}

export default ActionButtons;