/**
 * Haptic geri bildirim fonksiyonları
 * Farklı kullanıcı etkileşimlerinde dokunmatik geri bildirim sağlar
 */

export type HapticIntensity = 'light' | 'medium' | 'heavy';

/**
 * Haptic geri bildirim fonksiyonu
 * @param intensity Titreşim yoğunluğu
 */
export const hapticFeedback = (intensity: HapticIntensity) => {
  try {
    // Web API destekleniyorsa kullan
    if ('vibrate' in navigator) {
      switch (intensity) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate([30, 20, 40]);
          break;
        default:
          navigator.vibrate(15);
      }
    }
    
    // iOS için haptic geri bildirim (eğer varsa)
    // @ts-ignore - Bu özelliği kontrol etmek için
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.hapticFeedback) {
      // @ts-ignore
      window.webkit.messageHandlers.hapticFeedback.postMessage({ intensity });
    }

  } catch (error) {
    console.warn('Haptic geri bildirim desteklenmiyor:', error);
  }
};

/**
 * Başarı haptic geri bildirimi
 */
export const successHaptic = () => {
  hapticFeedback('medium');
};

/**
 * Hata haptic geri bildirimi
 */
export const errorHaptic = () => {
  hapticFeedback('heavy');
};

/**
 * Bildirim haptic geri bildirimi
 */
export const notificationHaptic = () => {
  hapticFeedback('light');
}; 