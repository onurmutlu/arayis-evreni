import '@twa-dev/types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

// Haptic feedback türleri
export type HapticFeedbackType = 'impact' | 'notification' | 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

// Notification türleri
export type NotificationType = 'success' | 'warning' | 'error' | string;

/**
 * Telegram WebApp üzerinden haptic feedback tetikler
 * Telegram WebApp mevcut değilse sessizce başarısız olur
 */
export const triggerHapticFeedback = (style: HapticFeedbackType): void => {
  try {
    const telegram = window.Telegram;
    if (!telegram || !telegram.WebApp || !telegram.WebApp.HapticFeedback) {
      return; // Sessizce çık
    }

    switch (style) {
      case 'impact':
      case 'light':
      case 'medium':
      case 'heavy':
        telegram.WebApp.HapticFeedback.impactOccurred(style);
        break;
      case 'selection':
        telegram.WebApp.HapticFeedback.selectionChanged();
        break;
      case 'notification':
      case 'success':
        telegram.WebApp.HapticFeedback.notificationOccurred('success');
        break;
      case 'warning':
        telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        break;
      case 'error':
        telegram.WebApp.HapticFeedback.notificationOccurred('error');
        break;
      default:
        telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  } catch (error) {
    // Hata durumunda sessizce devam et
    console.error('Haptic feedback hatası:', error);
  }
};

/**
 * Telegram WebApp üzerinde bildirim gösterir
 * Telegram WebApp mevcut değilse alternatif olarak console.log kullanır
 */
export const showNotification = (type: NotificationType, message?: string): void => {
  try {
    const telegram = window.Telegram;
    if (!telegram || !telegram.WebApp) {
      // Alternatif bildirim yöntemi
      console.log(`[${type.toUpperCase()}] ${message || getDefaultMessage(type)}`);
      return;
    }

    const finalMessage = message || getDefaultMessage(type);
    
    // Telegram WebApp API'si destekliyorsa popup göster
    if (telegram.WebApp.showPopup) {
      telegram.WebApp.showPopup({
        title: getNotificationTitle(type),
        message: finalMessage,
        buttons: [{ type: 'close' }]
      });
    } 
    // Alternatif olarak alert göster
    else if (telegram.WebApp.showAlert) {
      telegram.WebApp.showAlert(finalMessage);
    }
    // WebApp API'si yoksa console.log kullan
    else {
      console.log(`[${type.toUpperCase()}] ${finalMessage}`);
    }
  } catch (error) {
    console.error('Bildirim gösterme hatası:', error);
  }
};

/**
 * Bildirim türüne göre varsayılan mesaj
 */
function getDefaultMessage(type: NotificationType): string {
  const messages: Record<string, string> = {
    success: 'İşlem başarıyla tamamlandı!',
    warning: 'Dikkat! Bu işlem bazı sorunlar içerebilir.',
    error: 'İşlem başarısız oldu. Lütfen tekrar deneyin.',
  };
  return messages[type] || messages.success;
}

/**
 * Bildirim türüne göre başlık
 */
function getNotificationTitle(type: NotificationType): string {
  const titles: Record<string, string> = {
    success: '✅ Başarılı',
    warning: '⚠️ Uyarı',
    error: '❌ Hata',
  };
  return titles[type] || 'Bildirim';
}
