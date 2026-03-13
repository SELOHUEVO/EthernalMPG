
import React, { useState, useRef, useEffect } from 'react';
import { User, Country, Page, ROLE_COLORS } from '../types';
import './Navbar.css';

interface NavbarProps {
  currentUser: User | null;
  country: Country | null;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export function Navbar({ currentUser, country, currentPage, onNavigate, onLogout }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'head_admin' || currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMenuOpen(false);
    setMoreOpen(false);
  };

  const roleColor = currentUser ? ROLE_COLORS[currentUser.role] : '#64748b';
  const hasPhoto = currentUser?.avatarUrl && currentUser.avatarUrl.length > 0;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button className="navbar-brand" onClick={() => handleNav('home')}>
          <span className="brand-ornament">♾️</span>
          <span className="brand-text">Eternal MPG</span>
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <button
            className={`navbar-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNav('home')}
          >
            <span className="link-icon">🏠</span>
            <span className="link-label">Главная</span>
          </button>

          <div className="navbar-dropdown" ref={moreRef}>
            <button
              className={`navbar-link dropdown-trigger ${['feed', 'site-news', 'create-post', 'create-site-news'].includes(currentPage) ? 'active' : ''}`}
              onClick={() => setMoreOpen(!moreOpen)}
            >
              <span className="link-icon">📰</span>
              <span className="link-label">Лента</span>
              <span className={`dropdown-arrow ${moreOpen ? 'open' : ''}`}>▾</span>
            </button>
            {moreOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => handleNav('feed')}>
                  🌍 Дипломатическая лента
                </button>
                <button className="dropdown-item" onClick={() => handleNav('site-news')}>
                  📢 Новости платформы
                </button>
                {currentUser && (
                  <>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={() => handleNav('create-post')}>
                      ✍ Новый пост
                    </button>
                    {isAdmin && (
                      <button className="dropdown-item" onClick={() => handleNav('create-site-news')}>
                        📝 Новость платформы
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <button
              className={`navbar-link ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => handleNav('admin')}
            >
              <span className="link-icon">⚙️</span>
              <span className="link-label">Админ</span>
            </button>
          )}
        </div>

        <div className="navbar-actions">
          {currentUser ? (
            <div className="navbar-user">
              <button className="user-badge" onClick={() => handleNav('profile')}>
                <span className="user-avatar-mini">
                  {hasPhoto ? (
                    <img src={currentUser.avatarUrl} alt="" className="user-avatar-mini-photo" />
                  ) : (
                    currentUser.avatar || '👤'
                  )}
                </span>
                <span className="user-name">{currentUser.username}</span>
                <span className="user-role-dot" style={{ background: roleColor }}></span>
              </button>
              <button className="btn-logout" onClick={onLogout}>Выход</button>
            </div>
          ) : (
            <div className="navbar-auth">
              <button className="btn-login" onClick={() => handleNav('login')}>Вход</button>
              <button className="btn-register" onClick={() => handleNav('register')}>Регистрация</button>
            </div>
          )}
        </div>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
            <span></span><span></span><span></span>
          </span>
        </button>
      </div>
    </nav>
  );
}
