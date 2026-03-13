
import React, { useState } from 'react';
import { db } from '../../services/database';
import { User, Page } from '../../types';
import { Button, Input } from '../../components/FormElements';
import './AuthPages.css';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onNavigate: (page: Page) => void;
}

export function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await db.findUser(username.trim(), password);
      if (user) {
        onLogin(user);
      } else {
        setError('Неверное имя пользователя или пароль');
      }
    } catch (err) {
      setError('Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-ornament">⚜</div>
          <h1 className="auth-title">Вход в систему</h1>
          <p className="auth-subtitle">Войдите в свой аккаунт для участия в форуме</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="Имя пользователя"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Введите имя пользователя"
            autoComplete="username"
          />

          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Введите пароль"
            autoComplete="current-password"
          />

          {error && <div className="auth-error">{error}</div>}

          <Button type="submit" loading={loading} className="auth-submit">
            Войти
          </Button>
        </form>

        <div className="auth-footer">
          <span>Нет аккаунта?</span>
          <button className="auth-link" onClick={() => onNavigate('register')}>Зарегистрироваться</button>
        </div>
      </div>
    </div>
  );
}
