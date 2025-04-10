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
      
      // Theme parametrelerini ayarla
      document.documentElement.style.setProperty('--tg-theme-bg-color', window.Telegram.WebApp.themeParams.bg_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-text-color', window.Telegram.WebApp.themeParams.text_color || '#000000');
      document.documentElement.style.setProperty('--tg-theme-button-color', window.Telegram.WebApp.themeParams.button_color || '#2481cc');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', window.Telegram.WebApp.themeParams.button_text_color || '#ffffff');
      
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
    }
  };

  // Telegram User ID alma fonksiyonu
  const getTelegramUserId = (): number | null => {
    if (user) {
      return user.id;
    }
    
    // Çevre değişkeninden fallback ID'yi al
    if (import.meta.env.VITE_FALLBACK_USER_ID) {
      return parseInt(import.meta.env.VITE_FALLBACK_USER_ID, 10);
    }
    
    return null;
  };

  const value = {
    user,
    setUser,
    isTelegramContext,
    setIsTelegramContext,
    isWebAppExpanded,
    expandWebApp,
    getTelegramUserId,
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