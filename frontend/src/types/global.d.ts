// src/types/global.d.ts
interface TelegramWebApp {
  WebApp: {
    ready: () => void;
    expand: () => void;
    close: () => void;
    showPopup: (params: { title?: string; message: string; buttons?: any[] }) => void;
    showAlert: (message: string) => void;
    hapticFeedback: {
      impactOccurred: (style: string) => void;
      notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
      selectionChanged: () => void;
    };
    isExpanded: boolean;
    MainButton: {
      text: string;
      color: string;
      textColor: string;
      isVisible: boolean;
      isActive: boolean;
      isProgressVisible: boolean;
      show: () => void;
      hide: () => void;
      enable: () => void;
      disable: () => void;
      showProgress: (leaveActive?: boolean) => void;
      hideProgress: () => void;
      onClick: (callback: () => void) => void;
      offClick: (callback: () => void) => void;
    };
    HapticFeedback: {
      impactOccurred: (style: string) => void;
      notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
      selectionChanged: () => void;
    };
    // ek özellikler...
  };
}

interface Window {
  Telegram?: TelegramWebApp;
} 