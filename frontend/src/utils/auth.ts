/**
 * Telegram Auth işlemleri için yardımcı fonksiyonlar
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface InitData {
  user?: TelegramUser;
  token?: string;
  startParam?: string;
  [key: string]: any;
}

/**
 * Telegram'dan gelen başlangıç verilerini alır
 */
export const getUserInitData = (): InitData => {
  try {
    // LocalStorage'dan kontrol et
    const storedData = localStorage.getItem('tg_init_data');
    if (storedData) {
      return JSON.parse(storedData);
    }

    // URL'den kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const initData = urlParams.get('initData') || urlParams.get('tgWebAppData');
    
    if (initData) {
      // URL-encoded değeri decode et
      const decodedData = decodeURIComponent(initData);
      
      // Veriyi parse et
      const parsedData: InitData = {};
      const params = new URLSearchParams(decodedData);
      
      params.forEach((value, key) => {
        if (key === 'user') {
          try {
            parsedData.user = JSON.parse(value);
          } catch (e) {
            console.error('User parsing error', e);
          }
        } else {
          parsedData[key] = value;
        }
      });
      
      // LocalStorage'a kaydet
      localStorage.setItem('tg_init_data', JSON.stringify(parsedData));
      return parsedData;
    }
    
    return {};
  } catch (error) {
    console.error('Init data parsing error', error);
    return {};
  }
};

/**
 * Kullanıcı ID'sini döndürür
 */
export const getUserId = (): number | null => {
  const initData = getUserInitData();
  return initData.user?.id || null;
};

/**
 * Kullanıcı görünen adını döndürür
 */
export const getUserDisplayName = (): string => {
  const initData = getUserInitData();
  return initData.user?.first_name || 'Misafir';
};

/**
 * Kullanıcının oturum açıp açmadığını kontrol eder
 */
export const isAuthenticated = (): boolean => {
  return !!getUserId();
};

/**
 * Kullanıcı oturumunu sonlandırır
 */
export const logout = (): void => {
  localStorage.removeItem('tg_init_data');
  localStorage.removeItem('user_token');
  // Ana sayfaya yönlendir
  window.location.href = '/';
}; 