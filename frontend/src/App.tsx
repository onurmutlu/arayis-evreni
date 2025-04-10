// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
import React, { useEffect, useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { loginWithInitData, setAuthToken, getAuthToken, fetchUserProfile, fetchUserWallet } from './utils/api';
import { TelegramProvider, useTelegram, TelegramUser } from './contexts/TelegramContext';

// Router import'u
import AppRouter from './router';
const router = createBrowserRouter([{ path: "*", element: <AppRouter /> }]);

// Global Telegram tipini tanımla
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: TelegramUser;
          auth_date?: string;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
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
          setText: (text: string) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        platform: string;
        colorScheme: string;
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
        isVersionAtLeast: (version: string) => boolean;
        version: string;
      };
    };
  }
}

// .env dosyasından fallback UID alınıyor
const FALLBACK_USER_ID = parseInt(import.meta.env.VITE_FALLBACK_USER_ID || '12345678', 10);

// Geliştirme ortamında demo kullanıcı (Telegram bağlamında değilken kullanılır)
const createDemoUser = (id: number): TelegramUser => ({
  id: id,
  first_name: "Demo",
  last_name: "Kullanıcı",
  username: "demo_user",
  language_code: "tr",
  is_premium: false
});

const App: React.FC = () => {
  return (
    <TelegramProvider>
      <AppContent />
    </TelegramProvider>
  );
};

const AppContent: React.FC = () => {
  const { 
    user, 
    setUser, 
    isTelegramContext, 
    setIsTelegramContext, 
    initWebApp, 
    isReady, 
    getTelegramUserId 
  } = useTelegram();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  
  // Yeni fonksiyon - Kullanıcı verilerini yükle
  const loadUserData = async () => {
    if (!user || userDataLoaded) return;
    
    try {
      // Profil ve cüzdan verilerini paralel olarak yükle
      const [profileData, walletData] = await Promise.all([
        fetchUserProfile(),
        fetchUserWallet()
      ]);
      
      console.log('✅ Kullanıcı verileri yüklendi:', profileData.username);
      setUserDataLoaded(true);
    } catch (err) {
      console.error('❌ Kullanıcı verileri yüklenirken hata:', err);
      // Devam et - temel uygulama yine de çalışabilir
    }
  };
  
  // Kullanıcı verileri yükle
  useEffect(() => {
    if (user && !userDataLoaded) {
      loadUserData();
    }
  }, [user, userDataLoaded]);
  
  // Telegram WebApp başlatma ve kullanıcı kimlik doğrulama
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Telegram WebApp'i başlat
        initWebApp();
        
        // Telegram WebApp var mı kontrol et
        if (window.Telegram?.WebApp) {
          console.log('🚀 Telegram WebApp tespit edildi');
          
          // initData varsa kullanıcı oturumunu aç
          if (window.Telegram.WebApp.initData) {
            console.log('📡 Telegram initData mevcut, giriş yapılıyor');
            try {
              const loginResult = await loginWithInitData(window.Telegram.WebApp.initData);
              if (loginResult && loginResult.access_token) {
                setAuthToken(loginResult.access_token);
                console.log('✅ Giriş başarılı, token alındı');
                
                // İlk kez giriş yapılıyorsa hoşgeldin mesajını göster
                if (loginResult.is_new_user) {
                  setShowWelcome(true);
                }
              }
            } catch (loginError) {
              console.error('❌ Telegram initData ile giriş başarısız:', loginError);
              setError('Telegram ile giriş yapılırken bir hata oluştu.');
            }
          } else {
            console.warn('⚠️ Telegram initData bulunamadı!');
          }
        } else {
          console.log('⚠️ Telegram WebApp tespit edilemedi, development modunda çalışılıyor');
          // Development modunda demo kullanıcı kullan
          setUser(createDemoUser(FALLBACK_USER_ID));
          // Geliştirme ortamında test token
          setAuthToken("fake-dev-token-123");
        }
        
        // Varolan token kontrolü (Telegram WebApp olmasa bile)
        const existingToken = getAuthToken();
        if (existingToken) {
          console.log('🔑 Varolan auth token tespit edildi');
          // Token doğrulama API çağrısı burada eklenebilir
        }
        
      } catch (err) {
        console.error('❌ App başlatılırken hata:', err);
        setError('Uygulama başlatılırken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);
  
  if (isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-4">
        <div className="bg-error/10 text-error p-4 rounded-lg mb-4 max-w-md w-full">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Hoşgeldin modalı - İlk kez giren kullanıcılar için */}
      {showWelcome && user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-4">
              {user.photo_url && (
                <img 
                  src={user.photo_url} 
                  alt={user.first_name} 
                  className="w-20 h-20 rounded-full mx-auto border-4 border-primary"
                />
              )}
              <h2 className="text-xl font-bold mt-4">
                Hoş Geldin, {user.first_name}!
              </h2>
              <p className="text-gray-600 mt-2">
                Arayış Evreni'ne katıldığın için teşekkür ederiz. NFT'leri keşfetmeye, Stars kazanmaya ve toplulukla etkileşime geçmeye hazırsın!
              </p>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium shadow-md hover:bg-primary/90 transition-colors"
            >
              Başla
            </button>
          </div>
        </div>
      )}
      
      <RouterProvider router={router} />
    </>
  );
};

export default App;
