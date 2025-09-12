// src/components/ContactView.jsx

import React from 'react';
import { FaTelegramPlane, FaGithub, FaEnvelope } from 'react-icons/fa';
import './ContactView.css';

function ContactView() {
  return (
    <div className="contact-view">
      <div className="contact-header">
        <h1>Связь с разработчиком</h1>
        <p>Привет! Меня зовут Влад. Я создал этот проект, чтобы сделать нашу студенческую жизнь немного проще.</p>
        <p>Если у вас есть идеи, предложения или вы нашли ошибку — не стесняйтесь написать мне.</p>
      </div>
      <div className="contact-links">
        <a 
          href="https://t.me/malish_oleg" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="contact-link telegram"
        >
          <FaTelegramPlane />
          <span>Написать в Telegram</span>
        </a>
        <a 
          href="https://t.me/vshn_by_malishOleg" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="chanal-link telegram"
        >
          <FaTelegramPlane />
          <span>Канал в Telegram</span>
        </a>
      </div>
      <div className="contact-footer">
        <p>Буду рад любому фидбэку!</p>
      </div>
    </div>
  );
}

export default ContactView;