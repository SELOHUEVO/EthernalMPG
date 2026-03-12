
import React, { useState, useEffect, useCallback } from 'react';
import { db } from './services/database';
import { User, Country, Post, Page, SiteNews } from './types';
import { Navbar } from './components/Navbar';
import { HomePage } from './features/home/HomePage';
import { FeedPage } from './features/posts/FeedPage';
import { CreatePostPage } from './features/posts/CreatePostPage';
import { PostDetailPage } from './features/posts/PostDetailPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ProfilePage } from './features/auth/ProfilePage';
import { EditProfilePage } from './features/auth/EditProfilePage';
import { TwoFactorPage } from './features/auth/TwoFactorPage';
import { AdminPanel } from './features/admin/AdminPanel';
import { SiteNewsFeedPage } from './features/site-news/SiteNewsFeedPage';
import { SiteNewsDetailPage } from './features/site-news/SiteNewsDetailPage';
import { CreateSiteNewsPage } from './features/site-news/CreateSiteNewsPage';
import { Footer } from './components/Footer';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingTwoFactorUser, setPendingTwoFactorUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('home');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [siteNews, setSiteNews] = useState<SiteNews[]>([]);

  const refreshData = useCallback(async () => {
    const [c, p, n] = await Promise.all([db.getCountries(), db.getPosts(), db.getSiteNews()]);
    setCountries(c);
    setPosts(p);
    setSiteNews(n);
  }, []);

  const restoreSession = useCallback(async () => {
    await db.initialize();
    const sessionUserId = await db.getSession();
    if (sessionUserId) {
      const users = await db.getUsers();
      const user = users.find(u => u.id === sessionUserId);
      if (user) setCurrentUser(user);
    }
    await refreshData();
    setLoading(false);
  }, [refreshData]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const navigate = useCallback((newPage: Page, params?: { postId?: string; newsId?: string }) => {
    setPage(newPage);
    if (params?.postId) setSelectedPostId(params.postId);
    if (params?.newsId) setSelectedNewsId(params.newsId);
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = useCallback(async (user: User) => {
    if (user.twoFactorEnabled) {
      const code = await db.createTwoFactorSession(user.id);
      setPendingTwoFactorUser(user);
      setPage('verify-2fa');
      // In a real app, this would be sent via email/SMS
      console.log('2FA Code:', code);
    } else {
      setCurrentUser(user);
      await db.setSession(user.id);
      await refreshData();
      navigate('feed');
    }
  }, [navigate, refreshData]);

  const handleTwoFactorVerified = useCallback(async (user: User) => {
    setPendingTwoFactorUser(null);
    setCurrentUser(user);
    await db.setSession(user.id);
    await refreshData();
    navigate('feed');
  }, [navigate, refreshData]);

  const handleTwoFactorCancel = useCallback(() => {
    setPendingTwoFactorUser(null);
    navigate('login');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    setCurrentUser(null);
    await db.clearSession();
    navigate('home');
  }, [navigate]);

  const handleUserUpdate = useCallback(async (user: User) => {
    setCurrentUser(user);
    await refreshData();
  }, [refreshData]);

  const handleDeletePost = useCallback(async (postId: string) => {
    await db.deletePost(postId);
    await refreshData();
  }, [refreshData]);

  const handleDeleteNews = useCallback(async (newsId: string) => {
    await db.deleteSiteNews(newsId);
    await refreshData();
  }, [refreshData]);

  const getCountryForUser = useCallback((user: User | null): Country | null => {
    if (!user?.countryId) return null;
    return countries.find(c => c.id === user.countryId) || null;
  }, [countries]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-ornament">♾️</div>
        <div className="loading-text">Загрузка Eternal MPG...</div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'head_admin' || currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={navigate} countries={countries} posts={posts} siteNews={siteNews} currentUser={currentUser} />;
      case 'feed':
        return <FeedPage posts={posts} countries={countries} onNavigate={navigate} currentUser={currentUser} onDeletePost={handleDeletePost} />;
      case 'post':
        return selectedPostId ? (
          <PostDetailPage postId={selectedPostId} posts={posts} countries={countries} onNavigate={navigate} currentUser={currentUser} onDeletePost={handleDeletePost} />
        ) : <FeedPage posts={posts} countries={countries} onNavigate={navigate} currentUser={currentUser} onDeletePost={handleDeletePost} />;
      case 'create-post':
        return currentUser ? (
          <CreatePostPage currentUser={currentUser} country={getCountryForUser(currentUser)} onNavigate={navigate} onPostCreated={refreshData} />
        ) : <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onLogin={handleLogin} onNavigate={navigate} countries={countries} />;
      case 'profile':
        return currentUser ? (
          <ProfilePage user={currentUser} country={getCountryForUser(currentUser)} posts={posts} countries={countries} onNavigate={navigate} onUserUpdate={handleUserUpdate} />
        ) : <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
      case 'edit-profile':
        return currentUser ? (
          <EditProfilePage user={currentUser} onNavigate={navigate} onUserUpdate={handleUserUpdate} />
        ) : <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
      case 'verify-2fa':
        return pendingTwoFactorUser ? (
          <TwoFactorPage user={pendingTwoFactorUser} onVerified={handleTwoFactorVerified} onCancel={handleTwoFactorCancel} />
        ) : <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
      case 'admin':
        return isAdmin ? (
          <AdminPanel currentUser={currentUser!} countries={countries} posts={posts} siteNews={siteNews} onNavigate={navigate} onRefresh={refreshData} />
        ) : <HomePage onNavigate={navigate} countries={countries} posts={posts} siteNews={siteNews} currentUser={currentUser} />;
      case 'site-news':
        return <SiteNewsFeedPage news={siteNews} currentUser={currentUser} onNavigate={navigate} onDeleteNews={handleDeleteNews} />;
      case 'site-news-detail':
        return selectedNewsId ? (
          <SiteNewsDetailPage newsId={selectedNewsId} allNews={siteNews} currentUser={currentUser} onNavigate={navigate} onDelete={handleDeleteNews} />
        ) : <SiteNewsFeedPage news={siteNews} currentUser={currentUser} onNavigate={navigate} onDeleteNews={handleDeleteNews} />;
      case 'create-site-news':
        return isAdmin ? (
          <CreateSiteNewsPage currentUser={currentUser!} onNavigate={navigate} onNewsCreated={refreshData} />
        ) : <HomePage onNavigate={navigate} countries={countries} posts={posts} siteNews={siteNews} currentUser={currentUser} />;
      default:
        return <HomePage onNavigate={navigate} countries={countries} posts={posts} siteNews={siteNews} currentUser={currentUser} />;
    }
  };

  return (
    <div className="app">
      <Navbar currentUser={currentUser} country={getCountryForUser(currentUser)} currentPage={page} onNavigate={navigate} onLogout={handleLogout} />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

export default App;
