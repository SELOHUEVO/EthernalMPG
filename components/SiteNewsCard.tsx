
import React from 'react';
import { SiteNews, SITE_NEWS_CATEGORY_LABELS, SITE_NEWS_CATEGORY_COLORS, Page } from '../types';
import './SiteNewsCard.css';

interface SiteNewsCardProps {
  news: SiteNews;
  onNavigate: (page: Page, params?: { newsId?: string }) => void;
  compact?: boolean;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export function SiteNewsCard({ news, onNavigate, compact, onDelete, canDelete }: SiteNewsCardProps) {
  const timeAgo = getTimeAgo(news.createdAt);
  const categoryColor = SITE_NEWS_CATEGORY_COLORS[news.category];
  const categoryLabel = SITE_NEWS_CATEGORY_LABELS[news.category];

  const handleClick = () => {
    onNavigate('site-news', { newsId: news.id });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(news.id);
  };

  return (
    <article className={`site-news-card ${compact ? 'compact' : ''} ${news.pinned ? 'pinned' : ''}`} onClick={handleClick}>
      {news.pinned && <div className="news-pin-badge">📌 Закреплено</div>}
      <div className="news-card-header">
        <span className="news-category" style={{ color: categoryColor, borderColor: categoryColor + '40' }}>
          {categoryLabel}
        </span>
        <span className="news-time">{timeAgo}</span>
      </div>
      <h3 className="news-card-title">{news.title}</h3>
      {!compact && (
        <p className="news-card-excerpt">
          {news.content.length > 180 ? news.content.substring(0, 180) + '...' : news.content}
        </p>
      )}
      <div className="news-card-footer">
        {news.aiModerated && (
          <span className="news-ai-badge" title={news.aiReason}>🤖 AI-модерация</span>
        )}
        <span className="news-read-more">Читать далее →</span>
        {canDelete && onDelete && (
          <button className="news-delete-btn" onClick={handleDelete} title="Удалить новость">
            🗑️
          </button>
        )}
      </div>
    </article>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'только что';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} дн назад`;
  return new Date(timestamp).toLocaleDateString('ru-RU');
}
