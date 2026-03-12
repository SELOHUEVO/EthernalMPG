

import React, { useState, useEffect } from 'react';
import { User, Country, Post, Page, ROLE_LABELS, ROLE_COLORS } from '../../types';
import { db } from '../../services/database';
import { PostCard } from '../../components/PostCard';
import { Button } from '../../components/FormElements';
import './ProfilePage.css';

interface ProfilePageProps {
  user: User;
  country: Country | null;
  posts: Post[];
  countries: Country[];
  onNavigate: (page: Page) => void;
  onUserUpdate: (user: User) => Promise<void>;
}

export function ProfilePage({ user, country, posts, countries, onNavigate, onUserUpdate }: ProfilePageProps) {
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);
  const [selectingCountry, setSelectingCountry] = useState(false);

  useEffect(() => {
    db.getAvailableCountries().then(setAvailableCountries);
  }, []);

  const userPosts = posts.filter(p => p.countryId === user.countryId);
  const approvedCount = userPosts.filter(p => p.status === 'approved').length;
  const pendingCount = userPosts.filter(p => p.status === 'pending').length;
  const roleColor = ROLE_COLORS[user.role];

  const handleSelectCountry = async (countryId: string) => {
    if (user.countryId) {
      await db.updateCountry(user.countryId, { userId: null });
    }
    await db.updateCountry(countryId, { userId: user.id });
    await db.updateUser(user.id, { countryId });
    const updatedUser = { ...user, countryId };
    await onUserUpdate(updatedUser);
    setSelectingCountry(false);
  };

  const handleDropCountry = async () => {
    if (user.countryId) {
      await db.updateCountry(user.countryId, { userId: null });
      await db.updateUser(user.id, { countryId: null });
      await onUserUpdate({ ...user, countryId: null });
    }
  };

  const hasPhoto = user.avatarUrl && user.avatarUrl.length > 0;

  return (
    <div className="profile-page">
      <div className="profile-header-card">
        <div className="profile-avatar" style={{ borderColor: roleColor }}>
          {hasPhoto ? (
            <img src={user.avatarUrl} alt={user.username} className="profile-avatar-photo" />
          ) : (
            <span className="profile-avatar-emoji">{user.avatar || '👤'}</span>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{user.username}</h1>
          <div className="profile-role">
            <span className="role-badge" style={{ background: roleColor + '20', color: roleColor, borderColor: roleColor + '40' }}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <p className="profile-joined">
            Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onNavigate('edit-profile')}>
          ✏️ Редактировать
        </Button>
      </div>

      {/* Country Section */}
      <div className="profile-section">
        <h2 className="section-heading">🌍 Ваша страна</h2>
        {country ? (
          <div className="current-country">
            <div className="country-detail-card">
              <div className="country-detail-flag">{country.flag}</div>
              <div className="country-detail-info">
                <h3>{country.name}</h3>
                <p>{country.government} • {country.capital}</p>
                <p className="country-desc">{country.description}</p>
              </div>
            </div>
            <div className="country-actions">
              <Button variant="danger" size="sm" onClick={handleDropCountry}>
                Отказаться от страны
              </Button>
            </div>
          </div>
        ) : (
          <div className="no-country">
            <p>У вас пока нет назначенной страны.</p>
            {!selectingCountry ? (
              <Button variant="secondary" onClick={() => setSelectingCountry(true)}>
                Выбрать страну
              </Button>
            ) : (
              <div className="country-picker">
                {availableCountries.length > 0 ? (
                  <div className="country-picker-grid">
                    {availableCountries.map(c => (
                      <button key={c.id} className="country-picker-item" onClick={() => handleSelectCountry(c.id)}>
                        <span className="picker-flag">{c.flag}</span>
                        <span className="picker-name">{c.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="no-available">Нет свободных стран. Обратитесь к администрации.</p>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSelectingCountry(false)}>Отмена</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      {country && (
        <div className="profile-section">
          <h2 className="section-heading">📊 Статистика</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-card-number">{userPosts.length}</span>
              <span className="stat-card-label">Всего постов</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-number">{approvedCount}</span>
              <span className="stat-card-label">Одобрено</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-number">{pendingCount}</span>
              <span className="stat-card-label">На проверке</span>
            </div>
          </div>
        </div>
      )}

      {/* User Posts */}
      {userPosts.length > 0 && (
        <div className="profile-section">
          <h2 className="section-heading">📜 Ваши публикации</h2>
          <div className="profile-posts">
            {userPosts.map(post => (
              <PostCard key={post.id} post={post} country={country || undefined} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

