

export interface User {
  id: string;
  username: string;
  password: string;
  email?: string;
  role: 'head_admin' | 'admin' | 'moderator' | 'user';
  countryId: string | null;
  avatar: string;
  avatarUrl?: string;
  bio: string;
  createdAt: number;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
}

export interface Country {
  id: string;
  name: string;
  flag: string;
  description: string;
  userId: string | null;
  color: string;
  government: string;
  capital: string;
  createdAt: number;
}

export type PostType = 'general' | 'declaration' | 'diplomacy' | 'economy' | 'military' | 'crisis' | 'un_resolution';
export type PostStatus = 'pending' | 'approved' | 'rejected';

export interface Post {
  id: string;
  countryId: string;
  title: string;
  content: string;
  type: PostType;
  status: PostStatus;
  rejectionReason?: string;
  aiModerated?: boolean;
  aiReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SiteNews {
  id: string;
  title: string;
  content: string;
  category: 'update' | 'event' | 'maintenance' | 'announcement' | 'rule_change';
  pinned: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  aiModerated?: boolean;
  aiReason?: string;
  status: PostStatus;
}

export interface AdminCode {
  code: string;
  role: 'admin' | 'moderator';
  createdAt: number;
}

export interface BannedEmail {
  id: string;
  email: string;
  reason: string;
  bannedBy: string;
  bannedAt: number;
}

export interface TwoFactorSession {
  userId: string;
  code: string;
  expiresAt: number;
}

export interface AIModerationSettings {
  apiKey: string;
  model: string;
  autoModerationEnabled: boolean;
  fallbackToAI: boolean;
}

export type Page = 'home' | 'feed' | 'post' | 'create-post' | 'profile' | 'edit-profile' | 'admin' | 'login' | 'register' | 'verify-2fa' | 'site-news' | 'create-site-news';

export const POST_TYPE_LABELS: Record<PostType, string> = {
  general: '🌍 Общее',
  declaration: '📜 Декларация',
  diplomacy: '🤝 Дипломатия',
  economy: '💰 Экономика',
  military: '⚔️ Военное дело',
  crisis: '🔥 Кризис',
  un_resolution: '🏛️ Резолюция ООН',
};

export const POST_TYPE_COLORS: Record<PostType, string> = {
  general: '#60a5fa',
  declaration: '#fbbf24',
  diplomacy: '#34d399',
  economy: '#a78bfa',
  military: '#f87171',
  crisis: '#fb923c',
  un_resolution: '#38bdf8',
};

export const SITE_NEWS_CATEGORY_LABELS: Record<SiteNews['category'], string> = {
  update: '🔄 Обновление',
  event: '🎉 Событие',
  maintenance: '🔧 Техработы',
  announcement: '📢 Объявление',
  rule_change: '📋 Изменение правил',
};

export const SITE_NEWS_CATEGORY_COLORS: Record<SiteNews['category'], string> = {
  update: '#3b82f6',
  event: '#22c55e',
  maintenance: '#f59e0b',
  announcement: '#8b5cf6',
  rule_change: '#ef4444',
};

export const ROLE_LABELS: Record<User['role'], string> = {
  head_admin: '👑 Главный администратор',
  admin: '🛡️ Администратор',
  moderator: '🔰 Модератор',
  user: '👤 Участник',
};

export const ROLE_COLORS: Record<User['role'], string> = {
  head_admin: '#d4af37',
  admin: '#3b82f6',
  moderator: '#22c55e',
  user: '#64748b',
};

export const AVAILABLE_AVATARS = [
  '👤', '😎', '🧐', '🤓', '🦅', '🦁', '🐺', '🐉', '🎭',
  '⚔️', '🛡️', '👑', '🌟', '🔥', '💎', '🎯', '🏛️', '⚖️', '🌍',
  '🦊', '🐻', '🐯', '🦄', '🗡️', '📿', '🎪', '🎨',
  '🦅', '🦊', '🐆', '🦈', '🦚', '🦜',
  '👻', '🤖', '👽', '🧙', '🧛', '🦸', '🦹', '🧝',
  '👑', '🎩', '🎖️', '🏅', '⭐', '🌙', '☀️', '🌊',
];

export const COMMON_FLAGS = [
  '🇷🇺', '🇺🇸', '🇨🇳', '🇩🇪', '🇫🇷', '🇬🇧', '🇯🇵', '🇮🇳', '🇧🇷', '🇨🇦',
  '🇦🇺', '🇰🇷', '🇮🇹', '🇪🇸', '🇹🇷', '🇸🇦', '🇦🇪', '🇪🇬', '🇳🇬', '🇿🇦',
  '🇦🇷', '🇲🇽', '🇮🇩', '🇵🇱', '🇺🇦', '🇸🇪', '🇳🇴', '🇫🇮', '🇨🇭', '🇦🇹',
  '🇳🇱', '🇧🇪', '🇵🇹', '🇬🇷', '🇨🇿', '🇷🇴', '🇭🇺', '🇮🇪', '🇮🇱', '🇮🇷',
  '🇵🇰', '🇧🇩', '🇻🇳', '🇹🇭', '🇵🇭', '🇲🇾', '🇸🇬', '🇰🇿', '🇺🇿', '🇦🇿',
  '🇬🇪', '🇦🇲', '🇹🇼', '🇳🇿', '🇨🇴', '🇨🇱', '🇵🇪', '🇻🇪', '🇰🇵', '🇨🇺',
  '🇮🇶', '🇸🇾', '🇱🇧', '🇯🇴', '🇶🇦', '🇰🇼', '🇧🇭', '🇴🇲', '🇾🇪', '🇱🇾',
  '🇹🇳', '🇩🇿', '🇲🇦', '🇪🇹', '🇰🇪', '🇬🇭', '🇹🇿', '🇦🇴', '🇨🇩',
  '🇸🇳', '🇨🇮', '🇲🇱', '🇧🇫', '🇳🇪', '🇹🇩', '🇨🇲', '🇬🇦', '🇨🇬', '🇲🇬',
  '🇲🇼', '🇿🇲', '🇿🇼', '🇧🇼', '🇳🇦', '🇸🇿', '🇱🇸', '🇲🇺', '🇸🇨', '🇰🇲',
  '🇩🇯', '🇸🇴', '🇪🇷', '🇸🇩', '🇸🇸', '🇷🇼', '🇧🇮', '🇺🇬', '🇹🇱', '🇲🇳',
  '🇲🇲', '🇰🇭', '🇱🇦', '🇳🇵', '🇱🇰', '🇦🇫', '🇹🇯', '🇹🇲', '🇰🇬', '🇧🇹',
  '🇲🇻', '🇧🇳', '🇫🇯', '🇵🇬', '🇸🇧', '🇻🇺', '🇼🇸', '🇹🇴', '🇰🇮', '🇵🇼',
  '🇲🇭', '🇫🇲', '🇳🇷', '🇹🇻', '🇧🇸', '🇧🇧', '🇯🇲', '🇹🇹', '🇬🇾', '🇸🇷',
  '🇨🇷', '🇵🇦', '🇳🇮', '🇭🇳', '🇸🇻', '🇬🇹', '🇧🇿', '🇩🇴', '🇭🇹',
  '🇺🇾', '🇵🇾', '🇧🇴', '🇪🇨', '🇦🇱', '🇷🇸', '🇧🇦', '🇲🇪', '🇽🇰', '🇲🇰',
  '🇧🇬', '🇸🇰', '🇸🇮', '🇭🇷', '🇱🇹', '🇱🇻', '🇪🇪', '🇲🇩', '🇧🇾', '🇱🇺',
  '🇦🇩', '🇲🇨', '🇸🇲', '🇻🇦', '🇱🇮', '🇲🇹', '🇨🇾', '🇮🇸',
];

export function canModeratePosts(role: User['role']): boolean {
  return ['head_admin', 'admin', 'moderator'].includes(role);
}

export function canManageCountries(role: User['role']): boolean {
  return ['head_admin', 'admin'].includes(role);
}

export function canManageUsers(role: User['role']): boolean {
  return ['head_admin', 'admin'].includes(role);
}

export function canManageAdmins(role: User['role']): boolean {
  return role === 'head_admin';
}

export function canDeleteUsers(role: User['role']): boolean {
  return ['head_admin', 'admin'].includes(role);
}

export function canDemoteAdmins(role: User['role']): boolean {
  return role === 'head_admin';
}

export function canManageSiteNews(role: User['role']): boolean {
  return ['head_admin', 'admin', 'moderator'].includes(role);
}

export function canDeletePost(user: User, post: Post): boolean {
  if (user.role === 'head_admin' || user.role === 'admin') return true;
  if (user.role === 'moderator') return true;
  return user.countryId === post.countryId;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
