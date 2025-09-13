// src/components/ActionButtons.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaShareAlt, FaDownload } from 'react-icons/fa';
import './ActionButtons.css';

function copyToClipboard(text) {
  // Пробуем использовать новый, современный API, если он доступен (на HTTPS или localhost)
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Если новый API недоступен, используем старый, "костыльный" метод
    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Делаем элемент невидимым
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // Выполняем команду копирования
        const successful = document.execCommand('copy');
        
        document.body.removeChild(textArea);

        if (successful) {
          resolve();
        } else {
          reject(new Error('Copy command was unsuccessful'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}

function ActionButtons() {
    const { type, id1, id2 } = useParams(); 
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
        // Используем window.location.origin, так как VITE_PUBLIC_URL может быть неактуален
        // при прямом доступе по IP
        const baseUrl = "http://окак.вшн.site"
        const link = `${baseUrl}/schedule/${type}/${id1}/${id2}`;
        
        copyToClipboard(link).then(() => {
            setCopySuccess('Ссылка скопирована!');
            setTimeout(() => setCopySuccess(''), 2000);
        }).catch((err) => {
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