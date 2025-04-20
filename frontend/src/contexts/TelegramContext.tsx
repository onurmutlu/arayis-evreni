import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// TelegramUser tipini tanımla
export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

// TelegramContext için değer tipi
interface TelegramContextValue {
  user: TelegramUser | null;
  setUser: (user: TelegramUser | null) => void;
  isTelegramContext: boolean;
  setIsTelegramContext: (value: boolean) => void;
  isWebAppExpanded: boolean;
  expandWebApp: () => void;
  getTelegramUserId: () => number | null;
  getInitDataRaw: () => string;
  initWebApp: () => void;
  isReady: boolean;
}

// Context'i oluştur
const TelegramContext = createContext<TelegramContextValue | undefined>(undefined);

// Context provider bileşeni
export const TelegramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegramContext, setIsTelegramContext] = useState<boolean>(false);
  const [isWebAppExpanded, setIsWebAppExpanded] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // WebApp'i genişletme fonksiyonu
  const expandWebApp = () => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();
      setIsWebAppExpanded(true);
    }
  };

  // WebApp'i başlatma
  const initWebApp = () => {
    if (window.Telegram && window.Telegram.WebApp) {
      // WebApp ile ilgili kurulumları yap
      setIsTelegramContext(true);
      
      // Telegram WebApp tema parametrelerini CSS değişkenlerine uygula
      const theme = window.Telegram.WebApp.themeParams;
      if (theme) {
        // Ana renkleri ayarla
        document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hint_color || '#707579');
        document.documentElement.style.setProperty('--tg-theme-link-color', theme.link_color || '#3390ec');
        document.documentElement.style.setProperty('--tg-theme-button-color', theme.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.button_text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color || '#f4f4f5');

        // Karanlık tema tespiti
        const isDarkTheme = theme.bg_color && isColorDark(theme.bg_color);
        if (isDarkTheme) {
          document.documentElement.classList.add('dark-theme');
          // Karanlık tema için border ve muted renklerini güncelle
          document.documentElement.style.setProperty('--border', 'rgba(255, 255, 255, 0.12)');
          document.documentElement.style.setProperty('--muted', 'rgba(255, 255, 255, 0.06)');
        } else {
          document.documentElement.classList.remove('dark-theme');
          // Açık tema için border ve muted renklerini güncelle
          document.documentElement.style.setProperty('--border', 'rgba(0, 0, 0, 0.12)');
          document.documentElement.style.setProperty('--muted', 'rgba(0, 0, 0, 0.06)');
        }
      }
      
      // Kullanıcı bilgisini ayarla
      if (window.Telegram.WebApp.initDataUnsafe?.user) {
        setUser(window.Telegram.WebApp.initDataUnsafe.user);
      }
      
      // WebApp'i genişlet
      expandWebApp();
      
      // WebApp hazır olduğunu bildir
      window.Telegram.WebApp.ready();
      setIsReady(true);
      
      console.log('Telegram WebApp başarıyla başlatıldı!');
    } else {
      console.warn('Telegram WebApp bulunamadı! Geliştirme modunda çalışıyor olabilirsiniz.');
      setIsTelegramContext(false);
      setIsReady(true);
      
      // Geliştirme modu için sistem tema tercihine göre karanlık/açık tema ayarla
      const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDarkMode) {
        document.documentElement.classList.add('dark-theme');
      }
    }
  };

  // Rengin karanlık olup olmadığını kontrol et
  const isColorDark = (hexColor: string): boolean => {
    // Hex rengi RGB'ye dönüştür
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Renk parlaklığını hesapla (0-255 arasında)
    // W3C formülü: (R * 299 + G * 587 + B * 114) / 1000
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 128'den küçük değerler karanlık olarak kabul edilir
    return brightness < 128;
  };

  // Telegram User ID alma fonksiyonu
  const getTelegramUserId = (): number | null => {
    if (user && user.id) {
      return user.id;
    }
    
    // Çevre değişkeninden fallback ID'yi al
    if (import.meta.env.VITE_FALLBACK_USER_ID) {
      const parsedId = parseInt(import.meta.env.VITE_FALLBACK_USER_ID, 10);
      // NaN kontrolü
      if (!isNaN(parsedId)) {
        return parsedId;
      }
    }
    
    // Fallback olarak sabit bir değer döndür
    console.log("⚠️ Geçerli kullanıcı ID'si bulunamadı, varsayılan demo ID kullanılıyor");
    return 123456; // Demo kullanıcı ID'si
  };

  // Ham initData bilgisini alma fonksiyonu
  const getInitDataRaw = (): string => {
    if (window.Telegram && window.Telegram.WebApp) {
      return window.Telegram.WebApp.initData || '';
    }
    return '';
  };

  const value = {
    user,
    setUser,
    isTelegramContext,
    setIsTelegramContext,
    isWebAppExpanded,
    expandWebApp,
    getTelegramUserId,
    getInitDataRaw,
    initWebApp,
    isReady
  };

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
};

// Hook kullanımı için
export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram hook must be used within a TelegramProvider');
  }
  return context;
};

// useTelegramUser hook'unu güncelleyelim
export const useTelegramUser = () => {
  const { user } = useTelegram();
  
  // User ID kontrolü (üretim ve demo modları için)
  const userId = user?.id?.toString() || import.meta.env.VITE_FALLBACK_USER_ID || 'demo123';
  
  return {
    userId,
    username: user?.username || 'demo_user',
    firstName: user?.first_name || 'Demo Kullanıcı',
    photoUrl: user?.photo_url || undefined
  };
};

// WebApp fonksiyonlarını dışa aktaran yardımcı fonksiyonlar
export const triggerHapticFeedback = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
  }
};

export const showNotification = (type: 'error' | 'success' | 'warning') => {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
  }
};

export const showMainButton = (text: string, onClick: () => void) => {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.MainButton) {
    window.Telegram.WebApp.MainButton.setText(text);
    window.Telegram.WebApp.MainButton.onClick(onClick);
    window.Telegram.WebApp.MainButton.show();
  }
};

export const hideMainButton = () => {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.MainButton) {
    window.Telegram.WebApp.MainButton.hide();
  }
};

// Back Button Kontrolü
export const showBackButton = (onClick: () => void) => {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
    window.Telegram.WebApp.BackButton.onClick(onClick);
    window.Telegram.WebApp.BackButton.show();
  }
};

export const hideBackButton = () => {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
    window.Telegram.WebApp.BackButton.hide();
  }
};

// Link açma yardımcıları
export const openLink = (url: string) => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.openLink(url);
  } else {
    window.open(url, '_blank');
  }
};

export const openTelegramLink = (url: string) => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
};

export default TelegramContext; 