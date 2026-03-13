
import React, { useState } from 'react';
import { User, Page, SiteNews, SITE_NEWS_CATEGORY_LABELS, AIModerationSettings } from '../../types';
import { db } from '../../services/database';
import { moderateWithAI } from '../../services/aiModeration';
import { Button, Input, TextArea, Select } from '../../components/FormElements';
import './CreateSiteNewsPage.css';

interface CreateSiteNewsPageProps {
  currentUser: User;
  onNavigate: (page: Page) => void;
  onNewsCreated: () => Promise<void>;
}

export function CreateSiteNewsPage({ currentUser, onNavigate, onNewsCreated }: CreateSiteNewsPageProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<SiteNews['category']>('announcement');
  const [pinned, setPinned] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categoryOptions = Object.entries(SITE_NEWS_CATEGORY_LABELS).map(([value, label]) => ({
    value, label,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let status: SiteNews['status'] = 'approved';
      let aiModerated = false;
      let aiReason = '';

      if (useAI) {
        const settings = await db.getAISettings();
        if (settings.apiKey) {
          const result = await moderateWithAI(content, title, settings);
          status = result.status;
          aiModerated = true;
          aiReason = result.reason;
          if (result.status === 'rejected') {
            setError(`ИИ отклонил публикацию: ${result.reason}. Контент отправлен на ручную проверку.`);
            status = 'pending';
          }
        }
      }

      await db.createSiteNews({
        title: title.trim(),
        content: content.trim(),
        category,
        pinned,
        createdBy: currentUser.id,
        status,
        aiModerated,
        aiReason,
      });

      await onNewsCreated();
      onNavigate('site-news');
    } catch (err) {
      setError('Ошибка при создании новости');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-site-news-page">
      <div className="create-news-header">
        <button className="back-link" onClick={() => onNavigate('site-news')}>← Назад к новостям</button>
        <h1 className="create-news-title">📝 Новая новость сайта</h1>
        <p className="create-news-subtitle">Создайте объявление или новость для всех участников форума</p>
      </div>

      <form className="create-news-form" onSubmit={handleSubmit}>
        <div className="form-card">
          <Input
            label="Заголовок"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Введите заголовок новости..."
            maxLength={200}
          />

          <Select
            label="Категория"
            value={category}
            onChange={e => setCategory(e.target.value as SiteNews['category'])}
            options={categoryOptions}
          />

          <TextArea
            label="Содержание"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Напишите текст новости..."
            rows={8}
          />

          <div className="form-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={pinned}
                onChange={e => setPinned(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span>📌 Закрепить новость (отображается первой)</span>
            </label>
          </div>

          <div className="form-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useAI}
                onChange={e => setUseAI(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span>🤖 Проверить через ИИ-модератора</span>
            </label>
            <p className="checkbox-hint">
              ИИ проверит контент на соответствие правилам форума перед публикацией
            </p>
          </div>

          {error && <div className="form-error-msg">{error}</div>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => onNavigate('site-news')}>
              Отмена
            </Button>
            <Button type="submit" loading={loading}>
              📤 Опубликовать
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
