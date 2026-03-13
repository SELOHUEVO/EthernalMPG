
import React from 'react';
import { Country, Post, User, Page, SiteNews } from '../../types';
import { PostCard } from '../../components/PostCard';
import { CountryCard } from '../../components/CountryCard';
import { SiteNewsCard } from '../../components/SiteNewsCard';
import { Button } from '../../components/FormElements';
import './HomePage.css';

interface HomePageProps {
  onNavigate: (page: Page, params?: { postId?: string; newsId?: string }) => void;
  countries: Country[];
  posts: Post[];
  siteNews?: SiteNews[];
  currentUser: User | null;
}

export function HomePage({ onNavigate, countries, posts, siteNews = [], currentUser }: HomePageProps) {
  const approvedPosts = posts.filter(p => p.status === 'approved').slice(0, 4);
  const approvedNews = siteNews.filter(n => n.status === 'approved').slice(0, 3);
  const availableCountries = countries.filter(c => !c.userId).length;
  const totalPosts = posts.filter(p => p.status === 'approved').length;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-content">
          <div className="hero-ornament">♾️</div>
          <h1 className="hero-title">Eternal MPG</h1>
          <p className="hero-subtitle">
            Дипломатическая платформа, где государства рождаются, союзы заключаются,
            а история пишется вашими руками
          </p>
          <div className="hero-features">
            <div className="feature-badge">🌍 Геополитика</div>
            <div className="feature-badge">💰 Экономика</div>
            <div className="feature-badge">⚔️ Военное дело</div>
            <div className="feature-badge">🤝 Дипломатия</div>
            <div className="feature-badge">🔬 Технологии</div>
          </div>
          <div className="hero-actions">
            {currentUser ? (
              <Button size="lg" onClick={() => onNavigate('feed')}>
                📰 Перейти к ленте
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => onNavigate('register')}>
                  ⚜ Присоединиться
                </Button>
                <Button size="lg" variant="secondary" onClick={() => onNavigate('feed')}>
                  📰 Читать ленту
                </Button>
              </>
            )}
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{countries.length}</span>
              <span className="stat-label">Государств</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-number">{totalPosts}</span>
              <span className="stat-label">Публикаций</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-number">{availableCountries}</span>
              <span className="stat-label">Свободных стран</span>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column: Site News + Diplomatic Posts */}
      <section className="home-section home-two-column">
        {/* Site News */}
        {approvedNews.length > 0 && (
          <div className="home-news-column">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">📢</span>
                Новости платформы
              </h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('site-news')}>
                Все новости →
              </Button>
            </div>
            <div className="news-list-compact">
              {approvedNews.map(news => (
                <SiteNewsCard key={news.id} news={news} onNavigate={onNavigate} compact />
              ))}
            </div>
          </div>
        )}

        {/* Featured Posts */}
        {approvedPosts.length > 0 && (
          <div className="home-posts-column">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">📜</span>
                Последние публикации
              </h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('feed')}>
                Все публикации →
              </Button>
            </div>
            <div className="posts-list-compact">
              {approvedPosts.map(post => {
                const country = countries.find(c => c.id === post.countryId);
                return <PostCard key={post.id} post={post} country={country} onNavigate={onNavigate} compact />;
              })}
            </div>
          </div>
        )}
      </section>

      {/* Countries Section */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-icon">🌍</span>
            Участвующие государства
          </h2>
        </div>
        <div className="countries-grid">
          {countries.slice(0, 12).map(country => (
            <CountryCard key={country.id} country={country} compact />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      {!currentUser && (
        <section className="home-cta">
          <div className="cta-content">
            <h2 className="cta-title">Готовы начать свою дипломатическую карьеру?</h2>
            <p className="cta-desc">Зарегистрируйтесь, получите страну и начните формировать мировую политику</p>
            <Button size="lg" onClick={() => onNavigate('register')}>
              ⚜ Зарегистрироваться
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
