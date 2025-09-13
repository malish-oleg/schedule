// src/components/UpdateModal.jsx

import React from 'react';
import './Modal.css'; // Мы можем переиспользовать стили от нашей основной модалки!
import { FaExternalLinkAlt } from 'react-icons/fa';

// on_Close - функция, которая будет вызвана при закрытии
function UpdateModal({ on_Close }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>🎉 Сайт обновился и переехал!</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>
            Привет! Рад сообщить, что проект получил большое обновление и теперь доступен по новому, более удобному адресу.
          </p>
          <p>
            Пожалуйста, обновите свои закладки.
          </p>
          <a 
            href="http://окак.вшн.site" // <-- ЗАМЕНИ НА СВОЙ НОВЫЙ ДОМЕН
            className="update-link-button"
          >
            <span>Перейти на новый сайт окак.вшн.site</span>
            <FaExternalLinkAlt />
          </a>
          <button onClick={on_Close} className="close-update-button">
            Остаться на старой версии
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateModal;