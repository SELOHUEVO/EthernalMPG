
import { persistence } from '../utils/persistence';
import { User, Country, Post, AdminCode, BannedEmail, TwoFactorSession, SiteNews, AIModerationSettings } from '../types';

const KEYS = {
  users: 'vpi_users',
  countries: 'vpi_countries',
  posts: 'vpi_posts',
  session: 'vpi_session',
  initialized: 'vpi_initialized',
  adminCodes: 'vpi_admin_codes',
  bannedEmails: 'vpi_banned_emails',
  twoFactorSessions: 'vpi_2fa_sessions',
  siteNews: 'vpi_site_news',
  aiSettings: 'vpi_ai_settings',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [4, 4, 4];
  return segments.map(len =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-');
}

function generateTwoFactorCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  });
}

async function getData<T>(key: string): Promise<T[]> {
  const raw = await persistence.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function setData<T>(key: string, data: T[]): Promise<void> {
  await persistence.setItem(key, JSON.stringify(data));
}

export const db = {
  async initialize(): Promise<void> {
    const initialized = await persistence.getItem(KEYS.initialized);
    if (initialized) return;

    const countries: Country[] = [
      { id: 'c1', name: 'Российская Федерация', flag: '🇷🇺', description: 'Крупнейшая страна мира, постоянный член СБ ООН. Обладает значительными энергетическими ресурсами и ядерным потенциалом.', userId: null, color: '#1e40af', government: 'Федеративная республика', capital: 'Москва', createdAt: Date.now() },
      { id: 'c2', name: 'Соединённые Штаты Америки', flag: '🇺🇸', description: 'Ведущая мировая держава с крупнейшей экономикой и военным бюджетом. Лидер НАТО.', userId: null, color: '#dc2626', government: 'Федеративная республика', capital: 'Вашингтон', createdAt: Date.now() },
      { id: 'c3', name: 'Китайская Народная Республика', flag: '🇨🇳', description: 'Крупнейшая экономика Азии, глобальная производственная держава.', userId: null, color: '#dc2626', government: 'Социалистическая республика', capital: 'Пекин', createdAt: Date.now() },
      { id: 'c4', name: 'Федеративная Республика Германия', flag: '🇩🇪', description: 'Крупнейшая экономика Европы, лидер ЕС.', userId: null, color: '#fbbf24', government: 'Федеративная парламентская республика', capital: 'Берлин', createdAt: Date.now() },
      { id: 'c5', name: 'Французская Республика', flag: '🇫🇷', description: 'Ядерная держава, постоянный член СБ ООН.', userId: null, color: '#3b82f6', government: 'Унитарная президентская республика', capital: 'Париж', createdAt: Date.now() },
      { id: 'c6', name: 'Великобритания', flag: '🇬🇧', description: 'Конституционная монархия с глобальным влиянием.', userId: null, color: '#1e3a5f', government: 'Конституционная монархия', capital: 'Лондон', createdAt: Date.now() },
      { id: 'c7', name: 'Япония', flag: '🇯🇵', description: 'Технологический гигант Тихоокеанского региона.', userId: null, color: '#ef4444', government: 'Конституционная монархия', capital: 'Токио', createdAt: Date.now() },
      { id: 'c8', name: 'Республика Индия', flag: '🇮🇳', description: 'Быстрорастущая демократия с миллиардным населением.', userId: null, color: '#f97316', government: 'Федеративная парламентская республика', capital: 'Нью-Дели', createdAt: Date.now() },
      { id: 'c9', name: 'Федеративная Республика Бразилия', flag: '🇧🇷', description: 'Крупнейшая экономика Латинской Америки.', userId: null, color: '#22c55e', government: 'Федеративная президентская республика', capital: 'Бразилиа', createdAt: Date.now() },
      { id: 'c10', name: 'Республика Корея', flag: '🇰🇷', description: 'Высокотехнологичная экономика, крупный производитель электроники.', userId: null, color: '#3b82f6', government: 'Президентская республика', capital: 'Сеул', createdAt: Date.now() },
      { id: 'c11', name: 'Турецкая Республика', flag: '🇹🇷', description: 'Стратегическое положение между Европой и Азией.', userId: null, color: '#ef4444', government: 'Президентская республика', capital: 'Анкара', createdAt: Date.now() },
      { id: 'c12', name: 'Итальянская Республика', flag: '🇮🇹', description: 'Третья экономика еврозоны. Член НАТО и G7.', userId: null, color: '#22c55e', government: 'Парламентская республика', capital: 'Рим', createdAt: Date.now() },
      { id: 'c13', name: 'Королевство Саудовская Аравия', flag: '🇸🇦', description: 'Крупнейший экспортёр нефти. Лидер ОПЕК.', userId: null, color: '#22c55e', government: 'Абсолютная монархия', capital: 'Эр-Рияд', createdAt: Date.now() },
      { id: 'c14', name: 'Австралийский Союз', flag: '🇦🇺', description: 'Развитая экономика с богатыми природными ресурсами.', userId: null, color: '#3b82f6', government: 'Конституционная монархия', capital: 'Канберра', createdAt: Date.now() },
      { id: 'c15', name: 'Канада', flag: '🇨🇦', description: 'Вторая по площади страна мира.', userId: null, color: '#ef4444', government: 'Конституционная монархия', capital: 'Оттава', createdAt: Date.now() },
      { id: 'c16', name: 'Королевство Испания', flag: '🇪🇸', description: 'Член ЕС и НАТО.', userId: null, color: '#fbbf24', government: 'Конституционная монархия', capital: 'Мадрид', createdAt: Date.now() },
      { id: 'c17', name: 'Исламская Республика Иран', flag: '🇮🇷', description: 'Региональная держава на Ближнем Востоке.', userId: null, color: '#22c55e', government: 'Исламская республика', capital: 'Тегеран', createdAt: Date.now() },
      { id: 'c18', name: 'Республика Индонезия', flag: '🇮🇩', description: 'Крупнейшая экономика Юго-Восточной Азии.', userId: null, color: '#ef4444', government: 'Президентская республика', capital: 'Джакарта', createdAt: Date.now() },
      { id: 'c19', name: 'Объединённые Арабские Эмираты', flag: '🇦🇪', description: 'Богатое нефтью государство с амбициозными проектами.', userId: null, color: '#22c55e', government: 'Федеративная абсолютная монархия', capital: 'Абу-Даби', createdAt: Date.now() },
      { id: 'c20', name: 'Республика Польша', flag: '🇵🇱', description: 'Крупная экономика Центральной Европы.', userId: null, color: '#ef4444', government: 'Парламентская республика', capital: 'Варшава', createdAt: Date.now() },
      { id: 'c21', name: 'Республика Южная Африка', flag: '🇿🇦', description: 'Крупнейшая экономика Африки.', userId: null, color: '#22c55e', government: 'Парламентская республика', capital: 'Претория', createdAt: Date.now() },
      { id: 'c22', name: 'Мексиканские Соединённые Штаты', flag: '🇲🇽', description: 'Крупная экономика Латинской Америки.', userId: null, color: '#22c55e', government: 'Федеративная президентская республика', capital: 'Мехико', createdAt: Date.now() },
      { id: 'c23', name: 'Королевство Нидерланды', flag: '🇳🇱', description: 'Высокоразвитая экономика, крупный экспортёр.', userId: null, color: '#f97316', government: 'Конституционная монархия', capital: 'Амстердам', createdAt: Date.now() },
      { id: 'c24', name: 'Швейцарская Конфедерация', flag: '🇨🇭', description: 'Нейтральное государство с развитой экономикой.', userId: null, color: '#ef4444', government: 'Федеративная республика', capital: 'Берн', createdAt: Date.now() },
      { id: 'c25', name: 'Королевство Швеция', flag: '🇸🇪', description: 'Высокоразвитое государство Северной Европы.', userId: null, color: '#3b82f6', government: 'Конституционная монархия', capital: 'Стокгольм', createdAt: Date.now() },
      { id: 'c26', name: 'Аргентинская Республика', flag: '🇦🇷', description: 'Крупная экономика Южной Америки.', userId: null, color: '#3b82f6', government: 'Федеративная президентская республика', capital: 'Буэнос-Айрес', createdAt: Date.now() },
      { id: 'c27', name: 'Арабская Республика Египет', flag: '🇪🇬', description: 'Крупнейшая армия Африки.', userId: null, color: '#dc2626', government: 'Президентская республика', capital: 'Каир', createdAt: Date.now() },
      { id: 'c28', name: 'Республика Пакистан', flag: '🇵🇰', description: 'Ядерная держава с молодым населением.', userId: null, color: '#22c55e', government: 'Исламская федеративная республика', capital: 'Исламабад', createdAt: Date.now() },
      { id: 'c29', name: 'Вьетнам', flag: '🇻🇳', description: 'Быстрорастущая экономика Юго-Восточной Азии.', userId: null, color: '#ef4444', government: 'Социалистическая республика', capital: 'Ханой', createdAt: Date.now() },
      { id: 'c30', name: 'Республика Казахстан', flag: '🇰🇿', description: 'Крупнейшая экономика Центральной Азии.', userId: null, color: '#3b82f6', government: 'Президентская республика', capital: 'Астана', createdAt: Date.now() },
    ];

    const posts: Post[] = [
      {
        id: 'p_seed_1', countryId: 'c1', title: 'Декларация о начале модернизации промышленности',
        content: 'Правительство Российской Федерации объявляет о начале масштабной программы модернизации промышленности. Программа включает инвестиции в высокие технологии, развитие инфраструктуры и поддержку малого и среднего бизнеса.\n\nОсновные направления:\n1. Развитие IT-сектора и искусственного интеллекта\n2. Модернизация транспортной инфраструктуры\n3. Поддержка науки и образования\n4. Энергетическая безопасность и развитие атомной энергетики',
        type: 'declaration', status: 'approved', createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 3,
      },
      {
        id: 'p_seed_2', countryId: 'c2', title: 'Предложение о двусторонних переговорах по безопасности',
        content: 'Государственный департамент США выражает заинтересованность в проведении двусторонних переговоров по вопросам глобальной безопасности и экономического сотрудничества.\n\nПовестка дня:\n— Климатические соглашения и экологические стандарты\n— Торговые отношения и снижение тарифов\n— Региональная безопасность и борьба с терроризмом\n— Кибербезопасность',
        type: 'diplomacy', status: 'approved', createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'p_seed_3', countryId: 'c5', title: 'Инициатива по укреплению европейской безопасности',
        content: 'Французская Республика выступает с инициативой по созданию новой системы коллективной безопасности в Европе.\n\nКлючевые предложения:\n• Создание общеевропейского фонда обороны\n• Увеличение совместных военных учений\n• Развитие кибернетической обороны\n• Координация разведывательных служб',
        type: 'military', status: 'approved', createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000,
      },
      {
        id: 'p_seed_4', countryId: 'c3', title: 'Экономическое партнёрство: новый путь Шёлкового пути',
        content: 'Китайская Народная Республика представляет обновлённую концепцию инициативы «Один пояс, один путь».\n\nНаправления сотрудничества:\n— Инфраструктурные проекты в 40+ странах\n— Цифровая торговля и электронная коммерция\n— Зелёная энергетика и устойчивое развитие',
        type: 'economy', status: 'approved', createdAt: Date.now() - 43200000, updatedAt: Date.now() - 43200000,
      },
      {
        id: 'p_seed_5', countryId: 'c8', title: 'Резолюция ООН: борьба с изменением климата',
        content: 'Республика Индия выступает с проектом резолюции Генеральной Ассамблеи ООН по борьбе с изменением климата.\n\nОсновные положения:\n• Сокращение выбросов CO2 на 50% к 2040 году\n• Создание глубокого фонда адаптации для развивающихся стран\n• Обязательные квоты на возобновляемую энергию',
        type: 'un_resolution', status: 'approved', createdAt: Date.now() - 3600000 * 5, updatedAt: Date.now() - 3600000 * 5,
      },
    ];

    const siteNews: SiteNews[] = [
      {
        id: 'sn_seed_1',
        title: '🎉 Добро пожаловать на ВПИ Форум!',
        content: 'Мы рады представить вам обновлённую платформу Виртуально-политической интеграции!\n\nНовые возможности:\n• Улучшенный интерфейс и навигация\n• Система модерации с поддержкой ИИ\n• Раздел новостей сайта\n• Двухфакторная аутентификация\n• Расширенные профили участников\n\nПрисоединяйтесь к дипломатической игре и начните формировать мировую политику!',
        category: 'announcement',
        pinned: true,
        createdBy: 'system',
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now() - 86400000 * 5,
        status: 'approved',
      },
      {
        id: 'sn_seed_2',
        title: '⚙️ Техническое обновление v2.0',
        content: 'Проведено масштабное обновление платформы:\n\n🔧 Улучшения:\n— Оптимизация скорости загрузки страниц\n— Исправлены ошибки в системе уведомлений\n— Улучшена безопасность хранения данных\n— Добавлена поддержка аватаров-фотографий\n\nСпасибо за ваше терпение во время проведения работ!',
        category: 'update',
        pinned: false,
        createdBy: 'system',
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
        status: 'approved',
      },
    ];

    await setData(KEYS.countries, countries);
    await setData(KEYS.posts, posts);
    await setData(KEYS.users, []);
    await setData(KEYS.adminCodes, []);
    await setData(KEYS.bannedEmails, []);
    await setData(KEYS.siteNews, siteNews);
    await persistence.setItem(KEYS.initialized, 'true');
  },

  // Users
  async getUsers(): Promise<User[]> {
    return getData<User>(KEYS.users);
  },

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const users = await this.getUsers();
    const newUser: User = { ...user, id: generateId(), createdAt: Date.now() };
    users.push(newUser);
    await setData(KEYS.users, users);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      await setData(KEYS.users, users);
    }
  },

  async deleteUser(id: string): Promise<void> {
    const users = await this.getUsers();
    await setData(KEYS.users, users.filter(u => u.id !== id));
  },

  async findUser(username: string, password: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.username === username && u.password === password) || null;
  },

  async findUserByUsername(username: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.username === username) || null;
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
  },

  // Countries
  async getCountries(): Promise<Country[]> {
    return getData<Country>(KEYS.countries);
  },

  async createCountry(country: Omit<Country, 'id' | 'createdAt'>): Promise<Country> {
    const countries = await this.getCountries();
    const newCountry: Country = { ...country, id: generateId(), createdAt: Date.now() };
    countries.push(newCountry);
    await setData(KEYS.countries, countries);
    return newCountry;
  },

  async updateCountry(id: string, updates: Partial<Country>): Promise<void> {
    const countries = await this.getCountries();
    const idx = countries.findIndex(c => c.id === id);
    if (idx !== -1) {
      countries[idx] = { ...countries[idx], ...updates };
      await setData(KEYS.countries, countries);
    }
  },

  async deleteCountry(id: string): Promise<void> {
    const countries = await this.getCountries();
    await setData(KEYS.countries, countries.filter(c => c.id !== id));
  },

  async getAvailableCountries(): Promise<Country[]> {
    const countries = await this.getCountries();
    return countries.filter(c => c.userId === null);
  },

  // Posts
  async getPosts(): Promise<Post[]> {
    return getData<Post>(KEYS.posts);
  },

  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    const posts = await this.getPosts();
    const newPost: Post = { ...post, id: generateId(), createdAt: Date.now(), updatedAt: Date.now() };
    posts.push(newPost);
    await setData(KEYS.posts, posts);
    return newPost;
  },

  async updatePost(id: string, updates: Partial<Post>): Promise<void> {
    const posts = await this.getPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx !== -1) {
      posts[idx] = { ...posts[idx], ...updates, updatedAt: Date.now() };
      await setData(KEYS.posts, posts);
    }
  },

  async deletePost(id: string): Promise<void> {
    const posts = await this.getPosts();
    await setData(KEYS.posts, posts.filter(p => p.id !== id));
  },

  // Site News
  async getSiteNews(): Promise<SiteNews[]> {
    return getData<SiteNews>(KEYS.siteNews);
  },

  async createSiteNews(news: Omit<SiteNews, 'id' | 'createdAt' | 'updatedAt'>): Promise<SiteNews> {
    const allNews = await this.getSiteNews();
    const newNews: SiteNews = { ...news, id: generateId(), createdAt: Date.now(), updatedAt: Date.now() };
    allNews.push(newNews);
    await setData(KEYS.siteNews, allNews);
    return newNews;
  },

  async updateSiteNews(id: string, updates: Partial<SiteNews>): Promise<void> {
    const allNews = await this.getSiteNews();
    const idx = allNews.findIndex(n => n.id === id);
    if (idx !== -1) {
      allNews[idx] = { ...allNews[idx], ...updates, updatedAt: Date.now() };
      await setData(KEYS.siteNews, allNews);
    }
  },

  async deleteSiteNews(id: string): Promise<void> {
    const allNews = await this.getSiteNews();
    await setData(KEYS.siteNews, allNews.filter(n => n.id !== id));
  },

  // Admin Codes
  async getAdminCodes(): Promise<AdminCode[]> {
    return getData<AdminCode>(KEYS.adminCodes);
  },

  async generateNewAdminCode(role: 'admin' | 'moderator'): Promise<AdminCode> {
    const newCode: AdminCode = { code: generateCode(), role, createdAt: Date.now() };
    await setData(KEYS.adminCodes, [newCode]);
    return newCode;
  },

  async validateAdminCode(code: string): Promise<AdminCode | null> {
    const codes = await this.getAdminCodes();
    return codes.find(c => c.code === code) || null;
  },

  async consumeAdminCode(code: string): Promise<boolean> {
    const codes = await this.getAdminCodes();
    const idx = codes.findIndex(c => c.code === code);
    if (idx !== -1) {
      const usedCode = codes[idx];
      const newCode: AdminCode = { code: generateCode(), role: usedCode.role, createdAt: Date.now() };
      await setData(KEYS.adminCodes, [newCode]);
      return true;
    }
    return false;
  },

  // Banned Emails
  async getBannedEmails(): Promise<BannedEmail[]> {
    return getData<BannedEmail>(KEYS.bannedEmails);
  },

  async addBannedEmail(email: string, reason: string, bannedBy: string): Promise<BannedEmail> {
    const banned = await this.getBannedEmails();
    const entry: BannedEmail = { id: generateId(), email: email.toLowerCase(), reason, bannedBy, bannedAt: Date.now() };
    banned.push(entry);
    await setData(KEYS.bannedEmails, banned);
    return entry;
  },

  async removeBannedEmail(id: string): Promise<void> {
    const banned = await this.getBannedEmails();
    await setData(KEYS.bannedEmails, banned.filter(b => b.id !== id));
  },

  async isEmailBanned(email: string): Promise<boolean> {
    const banned = await this.getBannedEmails();
    return banned.some(b => b.email.toLowerCase() === email.toLowerCase());
  },

  // Two Factor
  async enableTwoFactor(userId: string): Promise<{ secret: string; backupCodes: string[] }> {
    const secret = generateTwoFactorCode() + generateTwoFactorCode();
    const backupCodes = generateBackupCodes();
    await this.updateUser(userId, { twoFactorEnabled: true, twoFactorSecret: secret, twoFactorBackupCodes: backupCodes });
    return { secret, backupCodes };
  },

  async disableTwoFactor(userId: string): Promise<void> {
    await this.updateUser(userId, { twoFactorEnabled: false, twoFactorSecret: undefined, twoFactorBackupCodes: undefined });
  },

  async createTwoFactorSession(userId: string): Promise<string> {
    const code = generateTwoFactorCode();
    const sessions = await getData<TwoFactorSession>(KEYS.twoFactorSessions);
    const filtered = sessions.filter(s => s.userId !== userId);
    filtered.push({ userId, code, expiresAt: Date.now() + 5 * 60 * 1000 });
    await setData(KEYS.twoFactorSessions, filtered);
    return code;
  },

  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    const sessions = await getData<TwoFactorSession>(KEYS.twoFactorSessions);
    const session = sessions.find(s => s.userId === userId && s.code === code && s.expiresAt > Date.now());
    if (session) {
      await setData(KEYS.twoFactorSessions, sessions.filter(s => s.userId !== userId));
      return true;
    }
    return false;
  },

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const users = await this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user?.twoFactorBackupCodes) {
      const idx = user.twoFactorBackupCodes.indexOf(code.toUpperCase());
      if (idx !== -1) {
        const newCodes = [...user.twoFactorBackupCodes];
        newCodes.splice(idx, 1);
        await this.updateUser(userId, { twoFactorBackupCodes: newCodes });
        return true;
      }
    }
    return false;
  },

  // AI Settings
  async getAISettings(): Promise<AIModerationSettings> {
    const raw = await persistence.getItem(KEYS.aiSettings);
    if (raw) return JSON.parse(raw);
    return { apiKey: '', model: 'openai/gpt-4o-mini', autoModerationEnabled: false, fallbackToAI: false };
  },

  async updateAISettings(settings: AIModerationSettings): Promise<void> {
    await persistence.setItem(KEYS.aiSettings, JSON.stringify(settings));
  },

  // Session
  async getSession(): Promise<string | null> {
    return persistence.getItem(KEYS.session);
  },

  async setSession(userId: string): Promise<void> {
    await persistence.setItem(KEYS.session, userId);
  },

  async clearSession(): Promise<void> {
    await persistence.removeItem(KEYS.session);
  },
};
