
import React, { useState } from 'react';
import { User, Country, Page, PostType, POST_TYPE_LABELS, AIModerationSettings } from '../../types';
import { db } from '../../services/database';
import { moderateWithAI } from '../../services/aiModeration';
import { Button, Input, TextArea, Select } from '../../components/FormElements';
import './CreatePostPage.css';

interface CreatePostPageProps {
  currentUser: User;
  country: Country | null;
  onNavigate: (page: Page) => void;
  onPostCreated: () => Promise<void>;
}

export function CreatePostPage({ currentUser, country, onNavigate, onPostCreated }: CreatePostPageProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<PostType>('general');
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!country) {
    return (
      <div className="create-post-page">
        <div className="no-country-warning">
          <div className="warning-icon">⚠️</div>
          <h2>У вас нет назначенной страны</h2>
          <p>Для создания постов необходимо иметь назначенную страну. Обратитесь к администрации.</p>
          <Button variant="secondary" onClick={() => onNavigate('feed')}>Вернуться к ленте</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let status: 'pending' | 'approved' | 'rejected' = 'pending';
      let aiModerated = false;
      let aiReason = '';

      if (useAI) {
        const settings = await db.getAISettings();
        if (settings.apiKey && settings.autoModerationEnabled) {
          const result = await moderateWithAI(content, title, settings);
          aiModerated = true;
          aiReason = result.reason;
          if (result.status === 'approved') {
            status = 'approved';
          } else if (result.status === 'rejected') {
            setError(`ИИ рекомендует отклонить: ${result.reason}. Пост отправлен на ручную проверку.`);
            status = 'pending';
          }
        }
      }

      await db.createPost({
        countryId: country.id,
        title: title.trim(),
        content: content.trim(),
        type,
        status,
        aiModerated,
        aiReason,
      });

      await onPostCreated();
      onNavigate('feed');
    } catch (err) {
      setError('Ошибка при создании поста');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = Object.entries(POST_TYPE_LABELS).map(([value, label]) => ({
    value, label,
  }));

  return (
    <div className="create-post-page">
      <div className="create-post-header">
        <button className="back-link" onClick={() => onNavigate('feed')}>← Назад к ленте</button>
        <h1 className="create-post-title">✍ Новый пост</h1>
        <p className="create-post-subtitle">
          Публикуете от имени: {country.flag} {country.name}
        </p>
      </div>

      <form className="create-post-form" onSubmit={handleSubmit}>
        <div className="form-card">
          <Input
            label="Заголовок"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Введите заголовок публикации..."
            maxLength={200}
          />

          <Select
            label="Тип публикации"
            value={type}
            onChange={e => setType(e.target.value as PostType)}
            options={typeOptions}
          />

          <TextArea
            label="Содержание"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Напишите содержание вашего заявления..."
            rows={10}
          />

          <div className="form-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useAI}
                onChange={e => setUseAI(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span>🤖 Отправить на ИИ-проверку</span>
            </label>
            <p className="checkbox-hint">
              ИИ-модератор проверит контент и может автоматически одобрить пост
            </p>
          </div>

          <div className="form-note">
            <span className="note-icon">ℹ️</span>
            <span>Ваш пост будет отправлен на проверку администрации перед публикацией.</span>
          </div>

          {error && <div className="form-error-msg">{error}</div>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => onNavigate('feed')}>
              Отмена
            </Button>
            <Button type="submit" loading={loading}>
              📤 Отправить на проверку
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
