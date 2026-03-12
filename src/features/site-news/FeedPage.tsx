
import React, { useState, useMemo } from 'react';
import { Post, Country, User, Page, PostType, POST_TYPE_LABELS, canDeletePost } from '../../types';
import { PostCard } from '../../components/PostCard';
import { Button, EmptyState } from '../../components/FormElements';
import './FeedPage.css';

interface FeedPageProps {
  posts: Post[];
  countries: Country[];
  onNavigate: (page: Page, params?: { postId?: string }) => void;
  currentUser: User | null;
  onDeletePost: (id: string) => void;
}

export function FeedPage({ posts, countries, onNavigate, currentUser, onDeletePost }: FeedPageProps) {
  const [filterType, setFilterType] = useState<PostType | 'all'>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [showPending, setShowPending] = useState(false);

  const filteredPosts = useMemo(() => {
    let result = showPending
      ? posts.filter(p => currentUser?.role === 'admin' || currentUser?.role === 'head_admin' || p.countryId === currentUser?.countryId)
      : posts.filter(p => p.status === 'approved');

    if (filterType !== 'all') {
      result = result.filter(p => p.type === filterType);
    }

    if (filterCountry !== 'all') {
      result = result.filter(p => p.countryId === filterCountry);
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, filterType, filterCountry, showPending, currentUser]);

  const postTypes: { value: PostType | 'all'; label: string }[] = [
    { value: 'all', label: '📋 Все типы' },
    ...Object.entries(POST_TYPE_LABELS).map(([value, label]) => ({ value: value as PostType, label })),
  ];

  return (
    <div className="feed-page">
      <div className="feed-header">
        <div className="feed-title-area">
          <h1 className="feed-title">📰 Лента публикаций</h1>
          <p className="feed-subtitle">Дипломатические документы и заявления государств</p>
        </div>
        {currentUser && currentUser.countryId && (
          <Button onClick={() => onNavigate('create-post')}>
            ✍ Написать пост
          </Button>
        )}
      </div>

      <div className="feed-filters">
        <div className="filter-group">
          <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value as PostType | 'all')}>
            {postTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select className="form-select" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
            <option value="all">🌍 Все страны</option>
            {countries.map(c => (
              <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>

        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'head_admin' || currentUser.countryId) && (
          <div className="feed-toggle">
            <button
              className={`toggle-btn ${!showPending ? 'active' : ''}`}
              onClick={() => setShowPending(false)}
            >
              ✅ Одобренные
            </button>
            <button
              className={`toggle-btn ${showPending ? 'active' : ''}`}
              onClick={() => setShowPending(true)}
            >
              ⏳ На проверке
            </button>
          </div>
        )}
      </div>

      <div className="feed-list">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => {
            const country = countries.find(c => c.id === post.countryId);
            const canDel = currentUser ? canDeletePost(currentUser, post) : false;
            return (
              <PostCard
                key={post.id}
                post={post}
                country={country}
                onNavigate={onNavigate}
                onDelete={canDel ? onDeletePost : undefined}
                canDelete={canDel}
              />
            );
          })
        ) : (
          <EmptyState
            icon="📭"
            title="Публикаций не найдено"
            description="Попробуйте изменить фильтры или станьте первым, кто опубликует заявление"
          />
        )}
      </div>
    </div>
  );
}
