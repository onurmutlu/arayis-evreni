import { API_ENDPOINTS, ERROR_TYPES } from './constants';
import { getUserInitData } from './auth';

/**
 * Hata raporlama sistemi
 * 
 * Bu modül, uygulama içinde oluşan hataları otomatik olarak sunucuya raporlamak için
 * kullanılır. Kullanıcı bilgileri, cihaz bilgileri ve hata detayları ile birlikte
 * hatalar kaydedilir.
 */

interface ErrorReportDetails {
  message: string;
  stackTrace?: string;
  componentName?: string;
  url: string;
  errorType: string;
  additionalInfo?: Record<string, any>;
}

export interface ErrorReport {
  userId?: number | null;
  username?: string | null;
  deviceInfo: {
    userAgent: string;
    language: string;
    platform: string;
    screenSize: string;
  };
  timestamp: string;
  details: ErrorReportDetails;
}

/**
 * Tarayıcıdan cihaz bilgilerini alır
 */
const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
  };
};

/**
 * Hata raporu oluşturur ve sunucuya gönderir
 */
export const reportError = async (
  error: Error | string,
  errorType: keyof typeof ERROR_TYPES = 'UNKNOWN_ERROR',
  componentName?: string,
  additionalInfo?: Record<string, any>
): Promise<boolean> => {
  try {
    const message = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    // Kullanıcı bilgilerini alma
    const initData = getUserInitData();
    const userId = initData?.user?.id;
    const username = initData?.user?.username;

    const errorReport: ErrorReport = {
      userId: userId || null,
      username: username || null,
      deviceInfo: getDeviceInfo(),
      timestamp: new Date().toISOString(),
      details: {
        message,
        stackTrace,
        componentName,
        url: window.location.href,
        errorType: ERROR_TYPES[errorType],
        additionalInfo,
      },
    };

    // API'ye hata raporunu gönder
    const response = await fetch(`${process.env.REACT_APP_API_URL || ''}${API_ENDPOINTS.ERROR_REPORT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport),
    });

    if (!response.ok) {
      console.error('Hata raporu gönderilemedi:', await response.text());
      return false;
    }

    return true;
  } catch (reportingError) {
    // Hata raporlama sırasında oluşan hatalar konsola yazılır
    console.error('Hata raporlanırken bir sorun oluştu:', reportingError);
    return false;
  }
};

/**
 * API isteklerinde oluşan hataları raporlar
 */
export const reportApiError = (
  endpoint: string,
  error: Error | string,
  requestData?: any
): Promise<boolean> => {
  return reportError(
    error,
    'API_ERROR',
    'ApiClient',
    {
      endpoint,
      requestData: requestData ? JSON.stringify(requestData).substring(0, 500) : undefined,
    }
  );
};

/**
 * İşlenmeyen hataları global olarak yakalamak için
 */
export const setupGlobalErrorHandler = (): void => {
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    reportError(
      error || String(message),
      'UNKNOWN_ERROR',
      'GlobalHandler',
      { source, lineno, colno }
    );
    
    // Orijinal hata işleyicisini çağır
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Promise rejection handler
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    reportError(
      event.reason || 'Unhandled Promise Rejection',
      'UNKNOWN_ERROR',
      'GlobalPromiseHandler'
    );
    
    if (originalOnUnhandledRejection) {
      originalOnUnhandledRejection(event);
    }
  };
};

/**
 * Konsoldan log toplama
 */
export const setupConsoleErrorCapture = (): void => {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Konsol hatalarını raporla
    if (args.length > 0) {
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      reportError(
        errorMessage.substring(0, 1000),
        'UNKNOWN_ERROR',
        'ConsoleError'
      );
    }
    
    // Orijinal console.error'u çağır
    originalConsoleError.apply(console, args);
  };
};

/**
 * Günlük kontrol için basit logger fonksiyonu
 */
export function logError(
  componentName: string,
  error: Error | string,
  metadata?: Record<string, any>
): void {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;
  
  console.group(`🔴 Hata: ${componentName}`);
  console.error(`Mesaj: ${message}`);
  if (stack) console.error(`Stack: ${stack}`);
  if (metadata) console.error('Metadata:', metadata);
  console.groupEnd();
}

/**
 * Kullanıcıya gösterilecek hata mesajlarını formatlar
 */
export function formatErrorMessage(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;
  
  // Bazı yaygın hataları kullanıcı dostu mesajlara çevirebiliriz
  if (message.includes('network') || message.includes('Network Error') || message.includes('timeout')) {
    return 'Bağlantı sorunu yaşıyoruz. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
  }
  
  if (message.includes('401') || message.includes('unauthorized')) {
    return 'Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.';
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return 'Aradığınız içerik bulunamadı. Lütfen daha sonra tekrar deneyin.';
  }
  
  if (message.includes('500') || message.includes('server error')) {
    return 'Şu anda sunucumuzda bir sorun var. Teknik ekibimiz konu üzerinde çalışıyor.';
  }
  
  // Genel hata mesajı
  return 'Bir sorun oluştu. Lütfen daha sonra tekrar deneyin.';
} 