
import React from 'react';
import { Post, Country, POST_TYPE_LABELS, POST_TYPE_COLORS, Page } from '../types';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  country: Country | undefined;
  onNavigate: (page: Page, params?: { postId?: string }) => void;
  compact?: boolean;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export function PostCard({ post, country, onNavigate, compact, onDelete, canDelete }: PostCardProps) {
  const timeAgo = getTimeAgo(post.createdAt);
  const typeColor = POST_TYPE_COLORS[post.type];
  const typeLabel = POST_TYPE_LABELS[post.type];

  const handleClick = () => {
    onNavigate('post', { postId: post.id });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(post.id);
  };

  return (
    <article className={`post-card ${compact ? 'compact' : ''}`} onClick={handleClick}>
      <div className="post-card-header">
        <div className="post-country">
          {country && (
            <>
              <span className="post-flag">{country.flag}</span>
              <span className="post-country-name">{country.name}</span>
            </>
          )}
        </div>
        <div className="post-meta">
          <span className="post-type" style={{ color: typeColor, borderColor: typeColor + '40' }}>{typeLabel}</span>
          <span className="post-time">{timeAgo}</span>
        </div>
      </div>

      <h3 className="post-card-title">{post.title}</h3>

      {!compact && (
        <p className="post-card-excerpt">
          {post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}
        </p>
      )}

      <div className="post-card-footer">
        <div className="post-status-badge" data-status={post.status}>
          {post.status === 'approved' && '✅ Одобрено'}
          {post.status === 'pending' && '⏳ На проверке'}
          {post.status === 'rejected' && '❌ Отклонено'}
          {post.aiModerated && <span className="ai-moderated-tag" title={post.aiReason || ''}> 🤖</span>}
        </div>
        <div className="post-card-actions">
          <span className="post-read-more">Читать далее →</span>
          {canDelete && onDelete && (
            <button className="post-delete-btn" onClick={handleDelete} title="Удалить пост">
              🗑️
            </button>
          )}
        </div>
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
