
import React from 'react';
import { Post, Country, User, Page, POST_TYPE_LABELS, POST_TYPE_COLORS, canDeletePost } from '../../types';
import { Button } from '../../components/FormElements';
import './PostDetailPage.css';

interface PostDetailPageProps {
  postId: string;
  posts: Post[];
  countries: Country[];
  onNavigate: (page: Page) => void;
  currentUser: User | null;
  onDeletePost: (id: string) => void;
}

export function PostDetailPage({ postId, posts, countries, onNavigate, currentUser, onDeletePost }: PostDetailPageProps) {
  const post = posts.find(p => p.id === postId);

  if (!post) {
    return (
      <div className="post-detail-page">
        <div className="post-not-found">
          <h2>Публикация не найдена</h2>
          <Button variant="secondary" onClick={() => onNavigate('feed')}>Вернуться к ленте</Button>
        </div>
      </div>
    );
  }

  const country = countries.find(c => c.id === post.countryId);
  const canView = post.status === 'approved' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'head_admin' ||
    currentUser?.countryId === post.countryId;

  if (!canView) {
    return (
      <div className="post-detail-page">
        <div className="post-not-found">
          <h2>⛔ Нет доступа</h2>
          <p>Эта публикация ещё не одобрена администрацией.</p>
          <Button variant="secondary" onClick={() => onNavigate('feed')}>Вернуться к ленте</Button>
        </div>
      </div>
    );
  }

  const typeColor = POST_TYPE_COLORS[post.type];
  const typeLabel = POST_TYPE_LABELS[post.type];
  const userCanDelete = currentUser ? canDeletePost(currentUser, post) : false;

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.')) {
      onDeletePost(post.id);
      onNavigate('feed');
    }
  };

  return (
    <div className="post-detail-page">
      <button className="back-link" onClick={() => onNavigate('feed')}>← Назад к ленте</button>

      <article className="post-detail">
        <header className="post-detail-header">
          <div className="post-detail-country">
            {country && (
              <>
                <span className="detail-flag">{country.flag}</span>
                <div className="detail-country-info">
                  <span className="detail-country-name">{country.name}</span>
                  <span className="detail-government">{country.government}</span>
                </div>
              </>
            )}
          </div>

          <div className="post-detail-meta">
            <span className="detail-type" style={{ color: typeColor, borderColor: typeColor + '40' }}>
              {typeLabel}
            </span>
            <span className="detail-date">
              {new Date(post.createdAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </header>

        <div className="post-detail-status">
          {post.status === 'approved' && <span className="status-approved">✅ Одобрено администрацией</span>}
          {post.status === 'pending' && <span className="status-pending">⏳ Ожидает проверки</span>}
          {post.status === 'rejected' && (
            <div className="status-rejected">
              <span>❌ Отклонено администрацией</span>
              {post.rejectionReason && <p className="rejection-reason">Причина: {post.rejectionReason}</p>}
            </div>
          )}
          {post.aiModerated && (
            <span className="ai-moderation-badge" title={post.aiReason || ''}>🤖 Проверено ИИ</span>
          )}
        </div>

        <h1 className="post-detail-title">{post.title}</h1>

        <div className="post-detail-content">
          {post.content.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <footer className="post-detail-footer">
          <div className="post-detail-signature">
            <div className="signature-line"></div>
            <span className="signature-text">
              {country?.flag} {country?.name}
            </span>
            <span className="signature-date">
              {new Date(post.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
          {userCanDelete && (
            <div className="post-detail-actions">
              <Button variant="danger" size="sm" onClick={handleDelete}>
                🗑️ Удалить пост
              </Button>
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}
