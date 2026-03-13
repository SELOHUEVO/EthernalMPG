
import React, { useState, useEffect } from 'react';
import { User, Country, Post, SiteNews, AdminCode, BannedEmail, Page, POST_TYPE_LABELS, ROLE_LABELS, ROLE_COLORS, COMMON_FLAGS, SITE_NEWS_CATEGORY_LABELS, canModeratePosts, canManageCountries, canManageUsers, canManageAdmins, canDeleteUsers, canDemoteAdmins, isValidEmail, AIModerationSettings } from '../../types';
import { db } from '../../services/database';
import { moderateWithAI } from '../../services/aiModeration';
import { Button, Input, TextArea, Select, EmptyState } from '../../components/FormElements';
import { PostCard } from '../../components/PostCard';
import { CountryCard } from '../../components/CountryCard';
import './AdminPanel.css';

interface AdminPanelProps {
  currentUser: User;
  countries: Country[];
  posts: Post[];
  siteNews: SiteNews[];
  onNavigate: (page: Page) => void;
  onRefresh: () => Promise<void>;
}

type AdminTab = 'overview' | 'countries' | 'posts' | 'news' | 'users' | 'create-country' | 'codes' | 'banned-emails' | 'ai-settings';

export function AdminPanel({ currentUser, countries, posts, siteNews, onNavigate, onRefresh }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminCodes, setAdminCodes] = useState<AdminCode[]>([]);
  const [bannedEmails, setBannedEmails] = useState<BannedEmail[]>([]);
  const [aiSettings, setAISettings] = useState<AIModerationSettings>({ apiKey: '', model: 'openai/gpt-4o-mini', autoModerationEnabled: false, fallbackToAI: false });
  
  // Banned emails state
  const [newEmail, setNewEmail] = useState('');
  const [banReason, setBanReason] = useState('');
  const [emailError, setEmailError] = useState('');

  // Create country state
  const [createCountryData, setCreateCountryData] = useState({
    name: '',
    flag: '🏳️',
    description: '',
    government: '',
    capital: '',
    color: '#3b82f6',
  });
  const [searchFlag, setSearchFlag] = useState('');

  // Posts filter state
  const [postFilterStatus, setPostFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  
  // News filter state
  const [newsFilterStatus, setNewsFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');

  // Admin codes state
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator'>('moderator');

  // AI Settings test state (moved from renderAISettings to top level)
  const [localSettings, setLocalSettings] = useState<AIModerationSettings>({ apiKey: '', model: 'openai/gpt-4o-mini', autoModerationEnabled: false, fallbackToAI: false });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testContent, setTestContent] = useState('Тестовое содержание для проверки работы ИИ-модератора. Это дипломатическое заявление о начале переговоров между государствами.');
  const [testTitle, setTestTitle] = useState('Тестовый заголовок дипломатической ноты');

  const isHeadAdmin = currentUser.role === 'head_admin';
  const canModerate = canModeratePosts(currentUser.role);
  const canCountries = canManageCountries(currentUser.role);
  const canUsers = canManageUsers(currentUser.role);

  useEffect(() => {
    db.getUsers().then(setAllUsers);
    db.getBannedEmails().then(setBannedEmails);
    db.getAISettings().then(s => {
      setAISettings(s);
      setLocalSettings(s);
    });
    if (isHeadAdmin) {
      db.getAdminCodes().then(setAdminCodes);
    }
  }, [isHeadAdmin]);

  const pendingPosts = posts.filter(p => p.status === 'pending');
  const pendingNews = siteNews.filter(n => n.status === 'pending');

  const tabs: { id: AdminTab; label: string; icon: string; badge?: number; show?: boolean }[] = [
    { id: 'overview', label: 'Обзор', icon: '📊' },
    { id: 'countries', label: 'Страны', icon: '🌍', show: canCountries },
    { id: 'posts', label: 'Посты', icon: '📜', badge: pendingPosts.length, show: canModerate },
    { id: 'news', label: 'Новости', icon: '📢', badge: pendingNews.length, show: canModerate },
    { id: 'users', label: 'Пользователи', icon: '👥', show: canUsers },
    { id: 'create-country', label: 'Создать страну', icon: '➕', show: isHeadAdmin },
    { id: 'codes', label: 'Коды доступа', icon: '🔑', show: isHeadAdmin },
    { id: 'banned-emails', label: 'Заблокированные email', icon: '🚫', show: canUsers },
    { id: 'ai-settings', label: 'Настройки ИИ', icon: '🤖', show: isHeadAdmin },
  ].filter(tab => tab.show !== false);

  const handleApprovePost = async (postId: string) => {
    await db.updatePost(postId, { status: 'approved' });
    await onRefresh();
  };

  const handleRejectPost = async (postId: string, reason: string) => {
    await db.updatePost(postId, { status: 'rejected', rejectionReason: reason });
    await onRefresh();
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('Удалить этот пост?')) {
      await db.deletePost(postId);
      await onRefresh();
    }
  };

  const handleApproveNews = async (newsId: string) => {
    await db.updateSiteNews(newsId, { status: 'approved' });
    await onRefresh();
  };

  const handleRejectNews = async (newsId: string) => {
    await db.updateSiteNews(newsId, { status: 'rejected' });
    await onRefresh();
  };

  const handleDeleteNews = async (newsId: string) => {
    if (confirm('Удалить эту новость?')) {
      await db.deleteSiteNews(newsId);
      await onRefresh();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!canDeleteUsers(currentUser.role)) return;
    if (confirm('Удалить пользователя? Это действие нельзя отменить.')) {
      const user = allUsers.find(u => u.id === userId);
      if (user?.countryId) {
        await db.updateCountry(user.countryId, { userId: null });
      }
      await db.deleteUser(userId);
      await onRefresh();
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: User['role']) => {
    if (!canManageAdmins(currentUser.role)) return;
    await db.updateUser(userId, { role: newRole });
    await onRefresh();
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleChangeUserCountry = async (userId: string, countryId: string | null) => {
    if (!canManageUsers(currentUser.role)) return;
    const user = allUsers.find(u => u.id === userId);
    if (user?.countryId) {
      await db.updateCountry(user.countryId, { userId: null });
    }
    if (countryId) {
      await db.updateCountry(countryId, { userId });
    }
    await db.updateUser(userId, { countryId });
    await onRefresh();
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, countryId } : u));
  };

  const handleGenerateAdminCode = async (role: 'admin' | 'moderator') => {
    if (!isHeadAdmin) return;
    const code = await db.generateNewAdminCode(role);
    setAdminCodes([code]);
    alert(`Код сгенерирован: ${code.code}`);
  };

  const handleAddBannedEmail = async (email: string, reason: string) => {
    if (!canUsers) return;
    await db.addBannedEmail(email, reason, currentUser.id);
    const updated = await db.getBannedEmails();
    setBannedEmails(updated);
  };

  const handleRemoveBannedEmail = async (id: string) => {
    await db.removeBannedEmail(id);
    setBannedEmails(prev => prev.filter(b => b.id !== id));
  };

  const handleSaveAISettings = async () => {
    await db.updateAISettings(localSettings);
    setAISettings(localSettings);
    alert('Настройки сохранены');
  };

  const handleTestAI = async () => {
    if (!localSettings.apiKey) {
      setTestResult('Введите API ключ');
      return;
    }
    if (!testTitle || !testContent) {
      setTestResult('Введите заголовок и содержание для теста');
      return;
    }
    setTesting(true);
    setTestResult('');
    try {
      const result = await moderateWithAI(testContent, testTitle, localSettings);
      setTestResult(`Тест пройден: ${result.status} - ${result.reason}`);
    } catch (error) {
      setTestResult('Ошибка тестирования: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const handleResetTestData = () => {
    setTestTitle('Тестовый заголовок дипломатической ноты');
    setTestContent('Тестовое содержание для проверки работы ИИ-модератора. Это дипломатическое заявление о начале переговоров между государствами.');
    setTestResult('');
  };

  const renderOverview = () => (
    <div className="admin-overview">
      <div className="overview-stats">
        <div className="overview-stat">
          <span className="os-number">{countries.length}</span>
          <span className="os-label">Стран</span>
        </div>
        <div className="overview-stat">
          <span className="os-number">{allUsers.length}</span>
          <span className="os-label">Пользователей</span>
        </div>
        <div className="overview-stat">
          <span className="os-number">{posts.length}</span>
          <span className="os-label">Постов</span>
        </div>
        <div className="overview-stat pending">
          <span className="os-number">{pendingPosts.length}</span>
          <span className="os-label">На проверке</span>
        </div>
      </div>

      {pendingPosts.length > 0 && (
        <div className="overview-pending">
          <h3>Посты на проверке</h3>
          <div className="pending-list">
            {pendingPosts.slice(0, 5).map(post => {
              const country = countries.find(c => c.id === post.countryId);
              return (
                <div key={post.id} className="pending-item">
                  <span className="pending-flag">{country?.flag}</span>
                  <div className="pending-info">
                    <span className="pending-title">{post.title}</span>
                    <span className="pending-meta">
                      {country?.name} • {POST_TYPE_LABELS[post.type]}
                    </span>
                  </div>
                  <div className="pending-actions">
                    <Button size="sm" onClick={() => handleApprovePost(post.id)}>✅</Button>
                    <Button size="sm" variant="danger" onClick={() => {
                      const reason = prompt('Причина отклонения:');
                      if (reason) handleRejectPost(post.id, reason);
                    }}>❌</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="overview-recent">
        <h3>Последние посты</h3>
        <div className="recent-list">
          {posts.slice(0, 5).map(post => {
            const country = countries.find(c => c.id === post.countryId);
            return (
              <div key={post.id} className="recent-item">
                <span className="recent-flag">{country?.flag}</span>
                <div className="recent-info">
                  <span className="recent-title">{post.title}</span>
                  <span className="recent-meta">
                    {country?.name} • {POST_TYPE_LABELS[post.type]} • {post.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCountries = () => (
    <div className="admin-countries">
      <div className="countries-list">
        {countries.map(country => (
          <div key={country.id} className="admin-country-item">
            <CountryCard country={country} compact />
            <div className="country-admin-actions">
              {country.userId ? (
                <div className="country-user-info">
                  <span>Занята пользователем: {allUsers.find(u => u.id === country.userId)?.username}</span>
                  <div className="country-action-btns">
                    <Button size="sm" variant="danger" onClick={() => handleChangeUserCountry(country.userId!, null)}>
                      Освободить
                    </Button>
                  </div>
                </div>
              ) : (
                <span className="status-available-text">Свободна</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPosts = () => {
    const filteredPosts = postFilterStatus === 'all' 
      ? posts 
      : posts.filter(p => p.status === postFilterStatus);

    return (
      <div className="admin-posts">
        <div className="admin-post-filters">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              className={`filter-btn ${postFilterStatus === status ? 'active' : ''}`}
              onClick={() => setPostFilterStatus(status)}
            >
              {status === 'all' ? 'Все' : status === 'pending' ? 'На проверке' : status === 'approved' ? 'Одобренные' : 'Отклоненные'}
            </button>
          ))}
        </div>
        <div className="admin-posts-list">
          {filteredPosts.map(post => {
            const country = countries.find(c => c.id === post.countryId);
            return (
              <div key={post.id} className="admin-post-item">
                <PostCard 
                  post={post} 
                  country={country} 
                  onNavigate={onNavigate}
                  onDelete={handleDeletePost}
                  canDelete={canModerate}
                />
                {post.status === 'pending' && (
                  <div className="admin-post-actions">
                    <Button size="sm" onClick={() => handleApprovePost(post.id)}>✅ Одобрить</Button>
                    <Button size="sm" variant="danger" onClick={() => {
                      const reason = prompt('Причина отклонения:');
                      if (reason) handleRejectPost(post.id, reason);
                    }}>❌ Отклонить</Button>
                  </div>
                )}
                {post.status === 'rejected' && post.rejectionReason && (
                  <div className="rejection-info">
                    <strong>Причина отклонения:</strong> {post.rejectionReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNews = () => {
    const filteredNews = newsFilterStatus === 'all' 
      ? siteNews 
      : siteNews.filter(n => n.status === newsFilterStatus);

    return (
      <div className="admin-news">
        <div className="admin-post-filters">
          {(['all', 'pending', 'approved'] as const).map(status => (
            <button
              key={status}
              className={`filter-btn ${newsFilterStatus === status ? 'active' : ''}`}
              onClick={() => setNewsFilterStatus(status)}
            >
              {status === 'all' ? 'Все' : status === 'pending' ? 'На проверке' : 'Одобренные'}
            </button>
          ))}
        </div>
        <div className="admin-posts-list">
          {filteredNews.map(news => (
            <div key={news.id} className="admin-post-item">
              <div className="admin-news-card">
                <h4>{news.title}</h4>
                <p>{news.content.substring(0, 200)}...</p>
                <div className="news-meta">
                  <span>{SITE_NEWS_CATEGORY_LABELS[news.category]}</span>
                  <span>{news.status}</span>
                </div>
              </div>
              {news.status === 'pending' && (
                <div className="admin-post-actions">
                  <Button size="sm" onClick={() => handleApproveNews(news.id)}>✅ Одобрить</Button>
                  <Button size="sm" variant="danger" onClick={() => handleRejectNews(news.id)}>❌ Отклонить</Button>
                </div>
              )}
              <div className="admin-post-actions">
                <Button size="sm" variant="danger" onClick={() => handleDeleteNews(news.id)}>🗑️ Удалить</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="admin-users">
      <div className="users-list">
        {allUsers.map(user => {
          const country = countries.find(c => c.id === user.countryId);
          return (
            <div key={user.id} className="admin-user-item">
              <div className="user-info">
                <div className="user-avatar">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="user-avatar-img" />
                  ) : (
                    user.avatar
                  )}
                </div>
                <div>
                  <span className="user-name-display">{user.username}</span>
                  <span className="user-role-display" style={{ color: ROLE_COLORS[user.role] }}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </div>
              <div className="user-country-display">
                {country ? `${country.flag} ${country.name}` : <span className="no-country-text">Нет страны</span>}
              </div>
              <div className="user-actions">
                {canManageUsers(currentUser.role) && (
                  <div className="edit-country-form">
                    <select
                      className="form-select"
                      value={user.countryId || ''}
                      onChange={e => handleChangeUserCountry(user.id, e.target.value || null)}
                    >
                      <option value="">Нет страны</option>
                      {countries.map(c => (
                        <option key={c.id} value={c.id} disabled={c.userId !== null && c.userId !== user.id}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {canManageAdmins(currentUser.role) && user.id !== currentUser.id && (
                  <select
                    className="form-select"
                    value={user.role}
                    onChange={e => handleChangeUserRole(user.id, e.target.value as User['role'])}
                  >
                    {(['user', 'moderator', 'admin', 'head_admin'] as const).map(role => (
                      <option key={role} value={role} disabled={role === 'head_admin' && currentUser.role !== 'head_admin'}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                )}
                {canDeleteUsers(currentUser.role) && user.id !== currentUser.id && user.role !== 'head_admin' && (
                  <Button size="sm" variant="danger" onClick={() => handleDeleteUser(user.id)}>
                    🗑️
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCreateCountry = () => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!createCountryData.name || !createCountryData.flag) {
        alert('Заполните обязательные поля');
        return;
      }
      await db.createCountry({
        ...createCountryData,
        userId: null,
      });
      await onRefresh();
      setCreateCountryData({ name: '', flag: '🏳️', description: '', government: '', capital: '', color: '#3b82f6' });
      alert('Страна создана');
    };

    const filteredFlags = COMMON_FLAGS.filter(flag => 
      flag.includes(searchFlag) || searchFlag === ''
    );

    return (
      <div className="create-country">
        <form className="create-country-form" onSubmit={handleSubmit}>
          <Input
            label="Название страны"
            value={createCountryData.name}
            onChange={e => setCreateCountryData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Название страны"
            required
          />

          <div className="flag-picker">
            <label className="form-label">Флаг страны</label>
            <div className="flag-search-wrap">
              <input
                type="text"
                className="flag-search-input"
                placeholder="Поиск флага..."
                value={searchFlag}
                onChange={e => setSearchFlag(e.target.value)}
              />
              {searchFlag && (
                <button
                  type="button"
                  className="flag-search-clear"
                  onClick={() => setSearchFlag('')}
                >
                  ✕
                </button>
              )}
            </div>
            <p className="flag-count">Выбрано: {createCountryData.flag} • {filteredFlags.length} вариантов</p>
            <div className="flag-grid">
              {filteredFlags.map((flag, index) => (
                <button
                  key={index}
                  type="button"
                  className={`flag-option ${createCountryData.flag === flag ? 'selected' : ''}`}
                  onClick={() => setCreateCountryData(prev => ({ ...prev, flag }))}
                >
                  {flag}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Форма правления"
            value={createCountryData.government}
            onChange={e => setCreateCountryData(prev => ({ ...prev, government: e.target.value }))}
            placeholder="Президентская республика"
          />

          <Input
            label="Столица"
            value={createCountryData.capital}
            onChange={e => setCreateCountryData(prev => ({ ...prev, capital: e.target.value }))}
            placeholder="Название столицы"
          />

          <div className="color-picker">
            <label className="form-label">Цвет страны</label>
            <input
              type="color"
              value={createCountryData.color}
              onChange={e => setCreateCountryData(prev => ({ ...prev, color: e.target.value }))}
              className="color-input"
            />
          </div>

          <TextArea
            label="Описание"
            value={createCountryData.description}
            onChange={e => setCreateCountryData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Описание страны..."
            rows={4}
          />

          <div className="form-actions">
            <Button type="submit">Создать страну</Button>
          </div>
        </form>
      </div>
    );
  };

  const renderAdminCodes = () => {
    return (
      <div className="admin-codes">
        <div className="codes-header-section">
          <h2 className="codes-title">Коды доступа</h2>
          <p className="codes-description">
            Коды доступа позволяют пользователям получить роль администратора или модератора при регистрации.
            Код одноразовый и автоматически генерируется после использования.
          </p>
        </div>

        <div className="codes-section">
          <div className="codes-section-header">
            <h3>Текущий код</h3>
            <div className="code-gen-form">
              <div className="role-select-codes">
                <label className="form-label">Выберите роль для нового кода</label>
                <div className="role-options">
                  <div
                    className={`role-option ${selectedRole === 'moderator' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole('moderator')}
                  >
                    <span className="role-opt-icon">🔰</span>
                    <span className="role-opt-label">Модератор</span>
                    <span className="role-opt-desc">Может модерировать посты</span>
                  </div>
                  <div
                    className={`role-option ${selectedRole === 'admin' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole('admin')}
                  >
                    <span className="role-opt-icon">🛡️</span>
                    <span className="role-opt-label">Администратор</span>
                    <span className="role-opt-desc">Полный доступ к управлению</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => handleGenerateAdminCode(selectedRole)}>
                🔄 Сгенерировать новый код
              </Button>
            </div>
          </div>

          <div className="codes-list">
            {adminCodes.length > 0 ? (
              adminCodes.map((code, index) => (
                <div key={index} className="code-item">
                  <div className="code-info-row">
                    <div className="code-value">
                      <code>{code.code}</code>
                    </div>
                    <span className="code-role-badge" style={{ 
                      background: code.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      color: code.role === 'admin' ? '#3b82f6' : '#22c55e'
                    }}>
                      {ROLE_LABELS[code.role]}
                    </span>
                  </div>
                  <div className="code-meta">
                    <span className="code-created">
                      Создан: {new Date(code.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-codes">
                Нет активных кодов. Сгенерируйте новый код.
              </div>
            )}
          </div>

          <div className="codes-warning">
            <span className="warning-icon">⚠️</span>
            <span>
              Коды автоматически обновляются после использования. Новый код генерируется сразу после использования текущего.
            </span>
          </div>
        </div>

        <div className="codes-instructions">
          <h3>Как использовать код</h3>
          <div className="roles-info">
            <div className="role-info-item">
              <span className="rii-icon">🔰</span>
              <div>
                <strong>Модератор</strong>
                <p>Может проверять и одобрять/отклонять посты, управлять новостями платформы</p>
              </div>
            </div>
            <div className="role-info-item">
              <span className="rii-icon">🛡️</span>
              <div>
                <strong>Администратор</strong>
                <p>Полный доступ к панели управления, может управлять странами, пользователями и настройками</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBannedEmails = () => {
    const handleAdd = async () => {
      setEmailError('');
      if (!newEmail || !banReason) {
        setEmailError('Заполните все поля');
        return;
      }
      if (!isValidEmail(newEmail)) {
        setEmailError('Введите корректный email');
        return;
      }
      const exists = bannedEmails.find(b => b.email.toLowerCase() === newEmail.toLowerCase());
      if (exists) {
        setEmailError('Этот email уже заблокирован');
        return;
      }
      await handleAddBannedEmail(newEmail, banReason);
      setNewEmail('');
      setBanReason('');
    };

    return (
      <div className="admin-banned-emails">
        <div className="banned-emails-header">
          <h2 className="banned-emails-title">Заблокированные email адреса</h2>
          <p className="banned-emails-desc">
            Email адреса из этого списка не смогут зарегистрироваться на платформе
          </p>
        </div>

        <div className="banned-email-add-card">
          <h3>Добавить email в чёрный список</h3>
          <div className="banned-email-form">
            <Input
              label="Email адрес"
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="example@mail.com"
            />
            <Input
              label="Причина блокировки"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="Укажите причину..."
            />
            {emailError && <div className="banned-error">{emailError}</div>}
            <Button onClick={handleAdd}>Добавить в чёрный список</Button>
          </div>
        </div>

        <div className="banned-emails-list-section">
          <h3>Заблокированные адреса ({bannedEmails.length})</h3>
          {bannedEmails.length > 0 ? (
            <div className="banned-emails-list">
              {bannedEmails.map(email => (
                <div key={email.id} className="banned-email-item">
                  <div className="banned-email-info">
                    <span className="banned-email-address">{email.email}</span>
                    <span className="banned-email-meta">
                      {email.reason} • {new Date(email.bannedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => handleRemoveBannedEmail(email.id)}>
                    Удалить
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-banned-emails">
              <span className="no-banned-icon">📭</span>
              <p>Список пуст</p>
            </div>
          )}
        </div>

        <div className="banned-emails-info">
          <h4>Информация</h4>
          <ul>
            <li>Заблокированные email не смогут зарегистрироваться</li>
            <li>Существующие пользователи с этим email не будут затронуты</li>
            <li>Причина блокировки видна только администраторам</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderAISettings = () => {
    return (
      <div className="admin-ai-settings">
        <h2>Настройки ИИ-модерации</h2>
        <p className="ai-description">
          Настройте автоматическую модерацию контента с помощью искусственного интеллекта
        </p>

        <div className="ai-settings-card">
          <Input
            label="API ключ OpenRouter"
            type="password"
            value={localSettings.apiKey}
            onChange={e => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
            placeholder="sk-or-..."
          />

          <Select
            label="Модель ИИ"
            value={localSettings.model}
            onChange={e => setLocalSettings(prev => ({ ...prev, model: e.target.value }))}
            options={[
              { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (рекомендуется)' },
              { value: 'openai/gpt-4o', label: 'GPT-4o' },
              { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
              { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
            ]}
          />

          <div className="ai-toggle-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localSettings.autoModerationEnabled}
                onChange={e => setLocalSettings(prev => ({ ...prev, autoModerationEnabled: e.target.checked }))}
              />
              <span className="checkbox-custom"></span>
              <span>Автоматическая модерация</span>
            </label>
            <p className="checkbox-hint">
              ИИ будет автоматически проверять контент при публикации
            </p>
          </div>

          <div className="ai-toggle-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localSettings.fallbackToAI}
                onChange={e => setLocalSettings(prev => ({ ...prev, fallbackToAI: e.target.checked }))}
              />
              <span className="checkbox-custom"></span>
              <span>Использовать ИИ как запасной вариант</span>
            </label>
            <p className="checkbox-hint">
              Если ручная модерация недоступна, использовать ИИ
            </p>
          </div>

          <div className="ai-test-section">
            <h3>Тестирование модерации</h3>
            <p className="ai-test-description">
              Проверьте работу ИИ-модерации на тестовом контенте
            </p>
            
            <Input
              label="Тестовый заголовок"
              value={testTitle}
              onChange={e => setTestTitle(e.target.value)}
              placeholder="Заголовок для теста"
            />
            
            <TextArea
              label="Тестовое содержание"
              value={testContent}
              onChange={e => setTestContent(e.target.value)}
              placeholder="Содержание для теста"
              rows={4}
            />
            
            <div className="ai-test-actions">
              <Button onClick={handleTestAI} loading={testing}>
                🧪 Протестировать модерацию
              </Button>
              <Button variant="secondary" onClick={handleResetTestData}>
                🔄 Сбросить тестовые данные
              </Button>
            </div>
            
            {testResult && (
              <div className={`ai-test-result ${testResult.includes('Ошибка') ? 'error' : testResult.includes('approved') ? 'success' : 'warning'}`}>
                {testResult}
              </div>
            )}
          </div>

          <div className="form-actions">
            <Button onClick={handleSaveAISettings}>
              💾 Сохранить настройки
            </Button>
          </div>
        </div>

        <div className="ai-info-section">
          <h4>Как это работает</h4>
          <ul>
            <li>ИИ проверяет контент на соответствие правилам форума</li>
            <li>Одобренные посты публикуются сразу</li>
            <li>Отклонённые посты отправляются на ручную проверку</li>
            <li>ИИ никогда не удаляет контент автоматически</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'countries': return renderCountries();
      case 'posts': return renderPosts();
      case 'news': return renderNews();
      case 'users': return renderUsers();
      case 'create-country': return renderCreateCountry();
      case 'codes': return renderAdminCodes();
      case 'banned-emails': return renderBannedEmails();
      case 'ai-settings': return renderAISettings();
      default: return renderOverview();
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-top">
          <h1 className="admin-title">⚙️ Панель администратора</h1>
          <span className="admin-role-badge" style={{ 
            color: ROLE_COLORS[currentUser.role],
            borderColor: ROLE_COLORS[currentUser.role]
          }}>
            {ROLE_LABELS[currentUser.role]}
          </span>
        </div>
        <p className="admin-subtitle">
          Управление платформой, странами, пользователями и контентом
        </p>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {renderContent()}
      </div>
    </div>
  );
}
