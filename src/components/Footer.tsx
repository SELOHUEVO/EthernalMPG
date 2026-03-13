
import React from 'react';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-ornament">♾️</span>
          <span>Eternal MPG</span>
        </div>
        <p className="footer-text">
          Eternal MPG — платформа для дипломатической ролевой игры и управления государствами
        </p>
        <div className="footer-divider"></div>
        <p className="footer-copy">© 2024 Eternal MPG. Все права защищены.</p>
      </div>
    </footer>
  );
}
