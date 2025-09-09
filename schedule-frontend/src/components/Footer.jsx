import React from 'react';
import { FaTelegramPlane, FaGithub } from 'react-icons/fa';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <p>Разработано с ❤️ by malish_oleg</p>
        <p>По всем вопросам и предложениям, а также об обнаруженных ошибках можете обращаться в телеграмм</p>
        <div className="social-links">
          <a 
            href="https://t.me/malish_oleg" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Telegram"
          >
            <FaTelegramPlane />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;