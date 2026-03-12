

import React, { useState, useEffect } from 'react';
import { User, Page, AVAILABLE_AVATARS, isValidEmail } from '../../types';
import { db } from '../../services/database';
import { Button, Input, TextArea } from '../../components/FormElements';
import './EditProfilePage.css';

interface EditProfilePageProps {
  user: User;
  onNavigate: (page: Page) => void;
  onUserUpdate: (user: User) => Promise<void>;
}

export function EditProfilePage({ user, onNavigate, onUserUpdate }: EditProfilePageProps) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || '');
  const [avatar, setAvatar] = useState(user.avatar || '👤');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarMode, setAvatarMode] = useState<'emoji' | 'photo'>(user.avatarUrl ? 'photo' : 'emoji');
  const [urlError, setUrlError] = useState('');
  const [bio, setBio] = useState(user.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled || false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateImageUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleUrlChange = (url: string) => {
    setAvatarUrl(url);
    if (url && !validateImageUrl(url)) {
      setUrlError('Введите корректный URL (начинается с http:// или https://)');
    } else {
      setUrlError('');
    }
  };

  const handleToggleTwoFactor = async () => {
    if (twoFactorEnabled) {
      if (confirm('Отключить двухфакторную аутентификацию? Это снизит безопасность вашего аккаунта.')) {
        await db.disableTwoFactor(user.id);
        setTwoFactorEnabled(false);
        setBackupCodes([]);
        setShowBackupCodes(false);
        const updatedUser = { ...user, twoFactorEnabled: false, twoFactorSecret: undefined, twoFactorBackupCodes: undefined };
        await onUserUpdate(updatedUser);
        setSuccess('Двухфакторная аутентификация отключена');
      }
    } else {
      const { secret, backupCodes: codes } = await db.enableTwoFactor(user.id);
      setTwoFactorEnabled(true);
      setBackupCodes(codes);
      setShowBackupCodes(true);
      const updatedUser = { ...user, twoFactorEnabled: true, twoFactorSecret: secret, twoFactorBackupCodes: codes };
      await onUserUpdate(updatedUser);
      setSuccess('Двухфакторная аутентификация включена! Сохраните коды восстановления.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('Имя пользователя не может быть пустым');
      return;
    }

    if (username.trim().length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      return;
    }

    if (username.trim() !== user.username) {
      const existing = await db.findUserByUsername(username.trim());
      if (existing && existing.id !== user.id) {
        setError('Это имя пользователя уже занято');
        return;
      }
    }

    if (email && !isValidEmail(email)) {
      setError('Введите корректный email адрес');
      return;
    }

    if (email && email !== user.email) {
      const isBanned = await db.isEmailBanned(email);
      if (isBanned) {
        setError('Этот email адрес заблокирован');
        return;
      }
      const existingEmail = await db.findUserByEmail(email);
      if (existingEmail && existingEmail.id !== user.id) {
        setError('Этот email уже используется другим пользователем');
        return;
      }
    }

    if (avatarMode === 'photo' && avatarUrl && !validateImageUrl(avatarUrl)) {
      setError('Введите корректный URL изображения');
      return;
    }

    if (newPassword) {
      if (currentPassword !== user.password) {
        setError('Неверный текущий пароль');
        return;
      }
      if (newPassword.length < 4) {
        setError('Новый пароль должен содержать минимум 4 символа');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
    }

    setLoading(true);

    try {
      const updates: Partial<User> = {
        username: username.trim(),
        email: email.trim() || undefined,
        avatar: avatarMode === 'emoji' ? avatar : '👤',
        avatarUrl: avatarMode === 'photo' ? avatarUrl.trim() : undefined,
        bio: bio.trim(),
      };

      if (newPassword) {
        updates.password = newPassword;
      }

      await db.updateUser(user.id, updates);
      const updatedUser = { ...user, ...updates };
      await onUserUpdate(updatedUser);
      setSuccess('Профиль успешно обновлён');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  const currentAvatarDisplay = avatarMode === 'photo' && avatarUrl ? avatarUrl : avatar;
  const avatarLoadError = React.useRef(false);

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-header">
        <button className="back-link" onClick={() => onNavigate('profile')}>← Назад к профилю</button>
        <h1 className="edit-profile-title">✏️ Редактирование профиля</h1>
        <p className="edit-profile-subtitle">Настройте свой аккаунт и внешний вид</p>
      </div>

      <form className="edit-profile-form" onSubmit={handleSubmit}>
        {/* Avatar Section */}
        <div className="form-section">
          <h2 className="form-section-title">🎭 Аватар</h2>

          <div className="avatar-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${avatarMode === 'emoji' ? 'active' : ''}`}
              onClick={() => setAvatarMode('emoji')}
            >
              <span className="mode-icon">😀</span>
              <span>Эмодзи</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${avatarMode === 'photo' ? 'active' : ''}`}
              onClick={() => setAvatarMode('photo')}
            >
              <span className="mode-icon">🖼️</span>
              <span>Своя фотография</span>
            </button>
          </div>

          <div className="avatar-preview-large">
            <div className="avatar-preview-frame">
              {avatarMode === 'photo' && avatarUrl && !urlError ? (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="avatar-photo-preview"
                  onError={(e) => {
                    avatarLoadError.current = true;
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.avatar-fallback');
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
                    }
                  }}
                  onLoad={(e) => {
                    avatarLoadError.current = false;
                    (e.target as HTMLImageElement).style.display = 'block';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.avatar-fallback');
                      if (fallback) (fallback as HTMLElement).style.display = 'none';
                    }
                  }}
                />
              ) : null}
              <div className="avatar-fallback" style={avatarMode === 'photo' && avatarUrl && !urlError ? {} : { display: 'flex' }}>
                <span className="avatar-current">{avatar}</span>
              </div>
            </div>
            <span className="avatar-label">
              {avatarMode === 'photo' && avatarUrl ? 'Фото профиля' : 'Текущий аватар'}
            </span>
          </div>

          {avatarMode === 'emoji' ? (
            <div className="avatar-grid">
              {AVAILABLE_AVATARS.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  className={`avatar-option ${avatar === a ? 'selected' : ''}`}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          ) : (
            <div className="photo-url-section">
              <Input
                label="URL изображения"
                value={avatarUrl}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
              {urlError && <span className="url-error">{urlError}</span>}
              <p className="url-hint">
                Вставьте прямую ссылку на изображение (JPG, PNG, GIF, WebP).
                Рекомендуемый размер: минимум 200×200 пикселей.
              </p>
              <div className="url-examples">
                <span className="examples-label">Примеры бесплатных хостингов:</span>
                <div className="examples-list">
                  <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="example-link">Imgur</a>
                  <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="example-link">PostImages</a>
                  <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="example-link">ImgBB</a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="form-section">
          <h2 className="form-section-title">📝 Основная информация</h2>

          <Input
            label="Имя пользователя"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Введите имя пользователя"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@mail.com"
          />

          <TextArea
            label="О себе"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Расскажите немного о себе..."
            rows={4}
            maxLength={500}
          />
          <span className="char-count">{bio.length}/500</span>
        </div>

        {/* Password Change */}
        <div className="form-section">
          <h2 className="form-section-title">🔒 Смена пароля</h2>
          <p className="form-section-hint">Оставьте поля пустыми, если не хотите менять пароль</p>

          <Input
            label="Текущий пароль"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Введите текущий пароль"
          />

          <Input
            label="Новый пароль"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Введите новый пароль"
          />

          <Input
            label="Подтвердите новый пароль"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Повторите новый пароль"
          />
        </div>

        {/* Two-Factor Authentication */}
        <div className="form-section">
          <h2 className="form-section-title">🔐 Двухфакторная аутентификация</h2>
          <p className="form-section-hint">
            Добавьте дополнительный уровень защиты для вашего аккаунта
          </p>

          <div className="twofa-toggle-section">
            <div className="twofa-status">
              <span className={`twofa-status-dot ${twoFactorEnabled ? 'enabled' : 'disabled'}`}></span>
              <span className="twofa-status-text">
                {twoFactorEnabled ? 'Включена' : 'Отключена'}
              </span>
            </div>
            <Button
              type="button"
              variant={twoFactorEnabled ? 'danger' : 'primary'}
              size="sm"
              onClick={handleToggleTwoFactor}
            >
              {twoFactorEnabled ? 'Отключить 2FA' : 'Включить 2FA'}
            </Button>
          </div>

          {showBackupCodes && backupCodes.length > 0 && (
            <div className="backup-codes-section">
              <div className="backup-codes-header">
                <span className="backup-warning">⚠️ Сохраните эти коды в безопасном месте!</span>
                <p className="backup-hint">Каждый код можно использовать только один раз. После использования он будет удалён.</p>
              </div>
              <div className="backup-codes-grid">
                {backupCodes.map((code, i) => (
                  <div key={i} className="backup-code-item">
                    <span className="backup-code-number">{i + 1}.</span>
                    <code className="backup-code-value">{code}</code>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join('\n')).catch(() => {});
                  setSuccess('Коды скопированы в буфер обмена');
                }}
              >
                📋 Скопировать коды
              </Button>
            </div>
          )}

          {twoFactorEnabled && !showBackupCodes && (
            <div className="twofa-info">
              <p>При входе вам потребуется ввести код подтверждения.</p>
              <p className="twofa-codes-info">
                Коды восстановления: {user.twoFactorBackupCodes?.length || 0} осталось
              </p>
            </div>
          )}
        </div>

        {error && <div className="edit-error">{error}</div>}
        {success && <div className="edit-success">{success}</div>}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => onNavigate('profile')}>
            Отмена
          </Button>
          <Button type="submit" loading={loading}>
            💾 Сохранить изменения
          </Button>
        </div>
      </form>
    </div>
  );
}

