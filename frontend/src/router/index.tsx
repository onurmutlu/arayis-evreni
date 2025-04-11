import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout'; // Orijinal göreceli yola geri dönüldü
import { getAuthToken } from '../utils/api'; // Token kontrolü için

// Sayfaları lazy load ile yükle (performans için)
// Henüz oluşturulmamış sayfaları yorum satırı yapalım
const Profil = lazy(() => import('../pages/Profil'));
const Gorevler = lazy(() => import('../pages/Gorevler')); // Yorum kaldırıldı
const Galeri = lazy(() => import('../pages/Galeri')); // Yorum kaldırıldı
const Dao = lazy(() => import('../pages/Dao')); // Yorum kaldırıldı
const NftClaim = lazy(() => import('../pages/NftClaim')); // Yorum kaldırıldı
const Wallet = lazy(() => import('../pages/Wallet')); // Yorum kaldırıldı
const VIP = lazy(() => import('../pages/VIP')); // Yorum kaldırıldı
const Leaderboard = lazy(() => import('../pages/Leaderboard')); // Yorum kaldırıldı
const Bildirimler = lazy(() => import('../pages/Bildirimler')); // Yorum kaldırıldı
// Admin sayfası
const Admin = lazy(() => import('../pages/Admin'));
// Büyüme analitikleri sayfası
const Growth = lazy(() => import('../pages/Growth'));
// Ödeme sayfası
const Payment = lazy(() => import('../pages/Payment'));
// const Login = lazy(() => import('../pages/Login')); // Login sayfası gerekebilir

// Yükleniyor göstergesi
const LoadingIndicator: React.FC = () => (
  <div className="flex justify-center items-center h-screen w-screen fixed top-0 left-0 bg-background/80 z-50">
    {/* Basit bir spinner veya animasyon eklenebilir */}
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    {/* <span className="ml-3 text-lg text-textSecondary">Yükleniyor...</span> */} 
  </div>
);

// Korunması gereken route'lar için bir wrapper bileşeni
// Token yoksa login'e veya bir "bekleme" ekranına yönlendirebilir.
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  // Geliştirme modunda her zaman token var olarak kabul edelim
  // const token = getAuthToken();

  // // Henüz token kontrol edilmemiş veya yoksa bekleme göstergesi
  // // Gerçek uygulamada, token'ı async olarak alıp durumu yönetmek daha iyi olabilir
  // if (!token) {
  //   return (
  //     <div className="flex justify-center items-center h-screen text-textSecondary">
  //       Giriş yapılıyor veya yetki kontrol ediliyor...
  //     </div>
  //   );
  // }

  return <>{children}</>; // React.ReactNode için Fragment kullan
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingIndicator />}>
        <Routes>
           {/* Admin sayfası - Layout dışında */}
           <Route path="/admin" element={<Admin />} />
           
           {/* Büyüme analitikleri sayfası - Layout dışında */}
           <Route path="/growth" element={<Growth />} />
           
           {/* Ödeme sayfası - Layout dışında */}
           <Route path="/payment" element={<Payment />} />

           {/* Ana Layout ile sarılmış ve AuthGuard ile korunan sayfalar */}
           <Route
             path="/"
             element={
                <AuthGuard>
                    <Layout />
                </AuthGuard>
             }
           >
             <Route index element={<Navigate to="/profil" replace />} />
             <Route path="profil" element={<Profil />} />
             <Route path="gorevler" element={<Gorevler />} />  // Yorum kaldırıldı
             <Route path="galeri" element={<Galeri />} /> // Yorum kaldırıldı
             <Route path="dao" element={<Dao />} /> // Yorum kaldırıldı
             <Route path="claim" element={<NftClaim />} /> // Yorum kaldırıldı
             <Route path="wallet" element={<Wallet />} />
             <Route path="vip" element={<VIP />} />
             <Route path="leaderboard" element={<Leaderboard />} />
             <Route path="bildirimler" element={<Bildirimler />} /> // Yorum kaldırıldı
           </Route>

           {/* Login veya diğer layout dışı sayfalar (varsa) */}
           {/* <Route path="/login" element={<Login />} /> */}

           <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter; 