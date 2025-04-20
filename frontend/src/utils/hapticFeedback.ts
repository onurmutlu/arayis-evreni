import '@twa-dev/types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

/**
 * Haptic feedback türleri
 */
export type HapticIntensity = 'light' | 'medium' | 'heavy';
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Haptic geri bildirim sağlar (dokunmatik geri bildirim)
 * @param intensity 'light' | 'medium' | 'heavy' şiddet seviyesi
 */
export function triggerHapticFeedback(intensity: HapticIntensity | NotificationType = 'medium'): void {
  try {
    // iOS için
    if (window.Telegram?.WebApp?.hapticFeedback) {
      if (intensity === 'light' || intensity === 'info') {
        window.Telegram.WebApp.hapticFeedback.notificationOccurred('success');
      } else if (intensity === 'medium' || intensity === 'success') {
        window.Telegram.WebApp.hapticFeedback.notificationOccurred('warning');
      } else if (intensity === 'heavy' || intensity === 'error') {
        window.Telegram.WebApp.hapticFeedback.notificationOccurred('error');
      }
      return;
    }
    
    // Web standart Vibration API
    if ('vibrate' in navigator) {
      switch (intensity) {
        case 'light':
        case 'info':
          navigator.vibrate(10);
          break;
        case 'medium':
        case 'success':
          navigator.vibrate([10, 30, 10]);
          break;
        case 'heavy':
        case 'error':
          navigator.vibrate([10, 100, 10, 100, 10]);
          break;
        default:
          navigator.vibrate(20);
      }
    }
  } catch (error) {
    console.warn('Haptic feedback is not supported on this device.');
  }
}

/**
 * Bildirim gösterme fonksiyonu
 * @param type Bildirim tipi
 * @param message Mesaj (opsiyonel)
 */
export function showNotification(type: NotificationType, message?: string): void {
  try {
    if (window.Telegram?.WebApp?.showPopup) {
      let title = '';
      switch (type) {
        case 'success':
          title = '✓ Başarılı';
          break;
        case 'error':
          title = '✗ Hata';
          break;
        case 'info':
          title = 'ℹ️ Bilgi';
          break;
        case 'warning':
          title = '⚠️ Uyarı';
          break;
      }
      
      window.Telegram.WebApp.showPopup({
        title,
        message: message || '',
      });
      
      return;
    }
    
    // Tarayıcıda basit bir bildirim efekti
    console.log(`[${type.toUpperCase()}] ${message || ''}`);
  } catch (error) {
    console.warn('Notification is not supported on this device.');
  }
}

// Başarı dokunma geri bildirimi
export function successHaptic(): void {
  triggerHapticFeedback('medium');
}

// Hata dokunma geri bildirimi
export function errorHaptic(): void {
  triggerHapticFeedback('heavy');
}

// Bildirim dokunma geri bildirimi
export function notificationHaptic(): void {
  triggerHapticFeedback('light');
}
