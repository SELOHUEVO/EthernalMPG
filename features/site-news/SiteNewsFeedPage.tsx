
import React, { useState, useMemo } from 'react';
import { SiteNews, User, Page, SITE_NEWS_CATEGORY_LABELS } from '../../types';
import { SiteNewsCard } from '../../components/SiteNewsCard';
import { Button, EmptyState } from '../../components/FormElements';
import './SiteNewsFeedPage.css';

interface SiteNewsFeedPageProps {
  news: SiteNews[];
  currentUser: User | null;
  onNavigate: (page: Page, params?: { newsId?: string }) => void;
  onDeleteNews: (id: string) => void;
}

export function SiteNewsFeedPage({ news, currentUser, onNavigate, onDeleteNews }: SiteNewsFeedPageProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const canManage = currentUser && ['head_admin', 'admin', 'moderator'].includes(currentUser.role);

  const filteredNews = useMemo(() => {
    let result = news.filter(n => n.status === 'approved');
    if (filterCategory !== 'all') {
      result = result.filter(n => n.category === filterCategory);
    }
    // Pinned first, then by date
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [news, filterCategory]);

  const categories = [
    { value: 'all', label: '📋 Все категории' },
    ...Object.entries(SITE_NEWS_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  ];

  return (
    <div className="site-news-feed-page">
      <div className="news-feed-header">
        <div className="news-feed-title-area">
          <h1 className="news-feed-title">📢 Новости сайта</h1>
          <p className="news-feed-subtitle">Обновления, события и важные объявления платформы</p>
        </div>
        {canManage && (
          <Button onClick={() => onNavigate('create-site-news')}>
            📝 Создать новость
          </Button>
        )}
      </div>

      <div className="news-feed-filters">
        <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="news-feed-list">
        {filteredNews.length > 0 ? (
          filteredNews.map(item => (
            <SiteNewsCard
              key={item.id}
              news={item}
              onNavigate={onNavigate}
              onDelete={canManage ? onDeleteNews : undefined}
              canDelete={!!canManage}
            />
          ))
        ) : (
          <EmptyState
            icon="📭"
            title="Новостей не найдено"
            description="Попробуйте изменить фильтры или загляните позже"
          />
        )}
      </div>
    </div>
  );
}
