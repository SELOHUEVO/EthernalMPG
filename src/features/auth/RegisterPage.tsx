
import React, { useState } from 'react';
import { db } from '../../services/database';
import { User, Country, Page, isValidEmail } from '../../types';
import { Button, Input } from '../../components/FormElements';
import './AuthPages.css';

interface RegisterPageProps {
  onLogin: (user: User) => void;
  onNavigate: (page: Page) => void;
  countries: Country[];
}

export function RegisterPage({ onLogin, onNavigate, countries }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableCountries = countries.filter(c => !c.userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password || !confirmPassword) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (username.trim().length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      return;
    }

    if (email && !isValidEmail(email)) {
      setError('Введите корректный email адрес');
      return;
    }

    if (email) {
      const isBanned = await db.isEmailBanned(email);
      if (isBanned) {
        setError('Этот email адрес заблокирован. Обратитесь к администрации.');
        return;
      }
    }

    if (password.length < 4) {
      setError('Пароль должен содержать минимум 4 символа');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    const existingUser = await db.findUserByUsername(username.trim());
    if (existingUser) {
      setError('Пользователь с таким именем уже существует');
      return;
    }

    if (email) {
      const existingEmail = await db.findUserByEmail(email);
      if (existingEmail) {
        setError('Пользователь с таким email уже существует');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      let role: User['role'] = 'user';

      if (adminCode.trim()) {
        const trimmedCode = adminCode.trim().toUpperCase();
        const codeData = await db.validateAdminCode(trimmedCode);
        if (codeData) {
          role = codeData.role;
          await db.consumeAdminCode(trimmedCode);
        } else {
          setError('Неверный код доступа');
          setLoading(false);
          return;
        }
      }

      const user = await db.createUser({
        username: username.trim(),
        password,
        email: email.trim() || undefined,
        role,
        countryId: selectedCountryId || null,
        avatar: '👤',
        bio: '',
      });

      if (selectedCountryId) {
        await db.updateCountry(selectedCountryId, { userId: user.id });
      }

      onLogin(user);
    } catch (err) {
      setError('Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-ornament">♾️</div>
          <h1 className="auth-title">Регистрация</h1>
          <p className="auth-subtitle">Создайте аккаунт и присоединитесь к Eternal MPG</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="Имя пользователя *"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Придумайте имя пользователя"
            autoComplete="username"
          />

          <Input
            label="Email (необязательно)"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@mail.com"
            autoComplete="email"
          />

          <Input
            label="Пароль *"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Придумайте пароль"
            autoComplete="new-password"
          />

          <Input
            label="Подтвердите пароль *"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Повторите пароль"
            autoComplete="new-password"
          />

          <div className="admin-code-section">
            <Input
              label="Код доступа (необязательно)"
              value={adminCode}
              onChange={e => setAdminCode(e.target.value.toUpperCase())}
              placeholder="Введите код для получения роли"
              maxLength={20}
            />
            <p className="admin-code-hint">
              Если у вас есть код доступа от администратора, введите его для получения соответствующей роли
            </p>
          </div>

          <div className="country-select-section">
            <label className="form-label">Выберите страну (необязательно)</label>
            <p className="form-hint">Вы можете выбрать страну сейчас или позже в профиле.</p>

            <div className="country-select-grid">
              {availableCountries.length > 0 ? (
                availableCountries.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`country-select-item ${selectedCountryId === c.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCountryId(selectedCountryId === c.id ? '' : c.id)}
                  >
                    <span className="country-select-flag">{c.flag}</span>
                    <span className="country-select-name">{c.name}</span>
                  </button>
                ))
              ) : (
                <p className="no-countries">Нет свободных стран. Выберите страну позже.</p>
              )}
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <Button type="submit" loading={loading} className="auth-submit">
            Зарегистрироваться
          </Button>
        </form>

        <div className="auth-footer">
          <span>Уже есть аккаунт?</span>
          <button className="auth-link" onClick={() => onNavigate('login')}>Войти</button>
        </div>
      </div>
    </div>
  );
}
