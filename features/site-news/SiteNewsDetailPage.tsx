
import React from 'react';
import { SiteNews, User, Page, SITE_NEWS_CATEGORY_LABELS, SITE_NEWS_CATEGORY_COLORS } from '../../types';
import { Button } from '../../components/FormElements';
import './SiteNewsDetailPage.css';

interface SiteNewsDetailPageProps {
  newsId: string;
  allNews: SiteNews[];
  currentUser: User | null;
  onNavigate: (page: Page) => void;
  onDelete: (id: string) => void;
}

export function SiteNewsDetailPage({ newsId, allNews, currentUser, onNavigate, onDelete }: SiteNewsDetailPageProps) {
  const news = allNews.find(n => n.id === newsId);

  if (!news) {
    return (
      <div className="site-news-detail-page">
        <div className="news-not-found">
          <h2>Новость не найдена</h2>
          <Button variant="secondary" onClick={() => onNavigate('site-news')}>Вернуться к новостям</Button>
        </div>
      </div>
    );
  }

  const canManage = currentUser && ['head_admin', 'admin', 'moderator'].includes(currentUser.role);
  const categoryColor = SITE_NEWS_CATEGORY_COLORS[news.category];
  const categoryLabel = SITE_NEWS_CATEGORY_LABELS[news.category];

  const handleDelete = () => {
    if (confirm('Удалить эту новость?')) {
      onDelete(news.id);
      onNavigate('site-news');
    }
  };

  return (
    <div className="site-news-detail-page">
      <button className="back-link" onClick={() => onNavigate('site-news')}>← Назад к новостям</button>

      <article className="site-news-detail">
        <header className="news-detail-header">
          <div className="news-detail-meta-top">
            {news.pinned && <span className="news-detail-pin">📌 Закреплено</span>}
            <span className="news-detail-category" style={{ color: categoryColor, borderColor: categoryColor + '40' }}>
              {categoryLabel}
            </span>
            <span className="news-detail-date">
              {new Date(news.createdAt).toLocaleDateString('ru-RU', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
          {canManage && (
            <div className="news-detail-admin-actions">
              <Button size="sm" variant="danger" onClick={handleDelete}>🗑️ Удалить</Button>
            </div>
          )}
        </header>

        <h1 className="news-detail-title">{news.title}</h1>

        <div className="news-detail-content">
          {news.content.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {news.aiModerated && (
          <div className="news-detail-ai-info">
            <span className="ai-icon">🤖</span>
            <div>
              <span className="ai-label">Контент проверен ИИ-модератором</span>
              {news.aiReason && <span className="ai-reason">{news.aiReason}</span>}
            </div>
          </div>
        )}

        <footer className="news-detail-footer">
          <div className="news-detail-signature">
            <div className="signature-ornament">⚜</div>
            <span className="signature-text">Администрация ВПИ Форума</span>
          </div>
        </footer>
      </article>
    </div>
  );
}
