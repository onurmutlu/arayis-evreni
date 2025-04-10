import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminFetchUserProfile } from '../utils/api';
import { BarChart3, Users, RefreshCcw, Hash, Share2, TrendingUp, ExternalLink } from 'lucide-react';

// Admin şifresi - gerçek uygulamada güvenli bir yöntemle saklanmalı
const ADMIN_PASSCODE = 'secret123';

type DailyActiveUser = {
  id: number;
  username: string;
  first_name: string;
  last_visit: string;
  stars: number;
};

type TopReferrer = {
  id: number;
  username: string;
  first_name: string;
  invited_count: number;
};

const Growth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'referrers' | 'viral' | 'community'>('daily');
  
  // Mock veriler
  const [dailyActiveUsers, setDailyActiveUsers] = useState<DailyActiveUser[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [viralTaskCompletions, setViralTaskCompletions] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Yetkilendirme kontrolü
  useEffect(() => {
    const adminCode = searchParams.get('admin');
    setIsAuthorized(adminCode === ADMIN_PASSCODE);
  }, [searchParams]);
  
  // Mock veri yükleme
  useEffect(() => {
    if (isAuthorized) {
      loadMockData();
    }
  }, [isAuthorized]);
  
  const loadMockData = async () => {
    setIsLoading(true);
    
    try {
      // Gerçek uygulamada burada API çağrıları olacak
      // Şimdilik mock veriler oluşturalım
      await new Promise(resolve => setTimeout(resolve, 800)); // API çağrısı simülasyonu
      
      // Günlük aktif kullanıcılar
      const mockUsers: DailyActiveUser[] = Array.from({ length: 15 }, (_, i) => ({
        id: 1000 + i,
        username: `user${1000 + i}`,
        first_name: `Kullanıcı ${i + 1}`,
        last_visit: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        stars: Math.floor(Math.random() * 500) + 50
      }));
      
      // En iyi referans verenler
      const mockReferrers: TopReferrer[] = Array.from({ length: 10 }, (_, i) => ({
        id: 1000 + i,
        username: `user${1000 + i}`,
        first_name: `Kullanıcı ${i + 1}`,
        invited_count: Math.floor(Math.random() * 15) + 1
      })).sort((a, b) => b.invited_count - a.invited_count);
      
      // Viral görev tamamlayanlar
      const mockViralCompletions = Math.floor(Math.random() * 50) + 20;
      
      setDailyActiveUsers(mockUsers);
      setTopReferrers(mockReferrers);
      setViralTaskCompletions(mockViralCompletions);
      setLastUpdated(new Date().toLocaleString('tr-TR'));
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Yeniden veri yükleme
  const handleRefresh = () => {
    loadMockData();
  };
  
  // Yetkisiz erişim durumunda
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <TrendingUp size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600 mb-6">
            Bu büyüme analitik sayfasına erişim için yetkilendirme gereklidir.
          </p>
          <div className="text-sm text-gray-500">
            URL parametresine <code className="bg-gray-100 p-1 rounded">?admin=PASSCODE</code> ekleyerek erişebilirsiniz.
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <TrendingUp size={28} className="text-primary mr-2" />
            Büyüme Analitikleri
          </h1>
          <p className="text-gray-600">Kullanıcı kazanımı ve topluluk metrikleri</p>
        </header>
        
        {/* Üst istatistik kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Günlük Aktif Kullanıcılar</h3>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{dailyActiveUsers.length}</p>
            <p className="text-sm text-gray-500 mt-1">Son 24 saat</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Toplam Referanslar</h3>
              <Share2 className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {topReferrers.reduce((sum, user) => sum + user.invited_count, 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Tüm zamanlar</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Viral Görev Tamamlama</h3>
              <RefreshCcw className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{viralTaskCompletions}</p>
            <p className="text-sm text-gray-500 mt-1">"3 Arkadaş Davet Et" görevi</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Büyüme Oranı</h3>
              <BarChart3 className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold mt-2">%{Math.floor(Math.random() * 30) + 5}</p>
            <p className="text-sm text-gray-500 mt-1">Geçen haftaya göre</p>
          </div>
        </div>
        
        {/* Tab Menüsü */}
        <nav className="flex border-b mb-8">
          <button
            className={`py-3 px-6 font-medium text-center ${activeTab === 'daily' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('daily')}
          >
            <div className="flex items-center">
              <Users size={18} className="mr-2" />
              Günlük Aktif Kullanıcılar
            </div>
          </button>
          <button
            className={`py-3 px-6 font-medium text-center ${activeTab === 'referrers' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('referrers')}
          >
            <div className="flex items-center">
              <Share2 size={18} className="mr-2" />
              En İyi Davet Edenler
            </div>
          </button>
          <button
            className={`py-3 px-6 font-medium text-center ${activeTab === 'viral' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('viral')}
          >
            <div className="flex items-center">
              <RefreshCcw size={18} className="mr-2" />
              Viral Görevler
            </div>
          </button>
          <button
            className={`py-3 px-6 font-medium text-center ${activeTab === 'community' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('community')}
          >
            <div className="flex items-center">
              <Hash size={18} className="mr-2" />
              Topluluk Bağlantıları
            </div>
          </button>
        </nav>
        
        {/* İçerik başlığı ve yenileme butonu */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {activeTab === 'daily' && 'Günlük Aktif Kullanıcılar'}
            {activeTab === 'referrers' && 'En İyi Davet Edenler'}
            {activeTab === 'viral' && 'Viral Görev Tamamlayanlar'}
            {activeTab === 'community' && 'Topluluk Bağlantıları'}
          </h2>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-4">
              Son güncelleme: {lastUpdated}
            </span>
            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center text-sm font-medium text-primary hover:text-primary/80 px-3 py-1 border border-primary/30 rounded"
            >
              <RefreshCcw size={16} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </div>
        
        {/* Ana içerik */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Günlük Aktif Kullanıcılar Tab */}
          {activeTab === 'daily' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son Aktif</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stars</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyActiveUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.first_name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.last_visit).toLocaleTimeString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.stars}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* En İyi Davet Edenler Tab */}
          {activeTab === 'referrers' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sıra</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Davet Edilen</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topReferrers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{index + 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.first_name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {user.invited_count} kullanıcı
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-primary hover:text-primary/80">Profili Görüntüle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Viral Görevler Tab */}
          {activeTab === 'viral' && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-start mb-4">
                  <div className="bg-purple-100 text-purple-800 rounded-lg p-4 w-full">
                    <h3 className="text-lg font-medium mb-2">Toplam Tamamlama</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-3xl font-bold">{viralTaskCompletions}</p>
                        <p className="text-sm">3 arkadaş davet görevi tamamlayan kullanıcı</p>
                      </div>
                      <RefreshCcw size={36} className="text-purple-500" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Tamamlama Oranı</h4>
                    <p className="text-2xl font-bold">%{Math.floor(Math.random() * 20) + 10}</p>
                    <p className="text-xs text-gray-500 mt-1">Tüm kullanıcılara oranla</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Bu Hafta Tamamlayan</h4>
                    <p className="text-2xl font-bold">{Math.floor(Math.random() * 15) + 5}</p>
                    <p className="text-xs text-gray-500 mt-1">Son 7 gün</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Ortalama Tamamlama Süresi</h4>
                    <p className="text-2xl font-bold">{Math.floor(Math.random() * 6) + 3} gün</p>
                    <p className="text-xs text-gray-500 mt-1">Görevin başlangıcından itibaren</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Görev Detayları</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <div className="font-medium">Görev Adı</div>
                        <div>3 Arkadaş Davet Et</div>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <div className="font-medium">Ödül</div>
                        <div>150 Stars</div>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <div className="font-medium">Görev Tipi</div>
                        <div>Viral / Davet</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="font-medium">Durum</div>
                        <div className="text-green-600">Aktif</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Topluluk Bağlantıları Tab */}
          {activeTab === 'community' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Hazır Davet Bağlantıları</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-md font-medium flex items-center">
                      <span className="flex h-6 w-6 rounded-full bg-blue-100 text-blue-500 items-center justify-center mr-2">
                        <Hash size={16} />
                      </span>
                      Ana Telegram Grubu
                    </h4>
                    <p className="text-sm text-gray-600 mt-2 mb-4">
                      Tüm kullanıcılar için ana topluluk grubu. Duyurular, tartışmalar ve yardım.
                    </p>
                    <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">t.me/arayis_evreni</span>
                      <a 
                        href="https://t.me/arayis_evreni" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:text-primary/80"
                      >
                        Ziyaret Et <ExternalLink size={14} className="ml-1" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-md font-medium flex items-center">
                      <span className="flex h-6 w-6 rounded-full bg-purple-100 text-purple-500 items-center justify-center mr-2">
                        <Hash size={16} />
                      </span>
                      NFT Tartışma Kanalı
                    </h4>
                    <p className="text-sm text-gray-600 mt-2 mb-4">
                      NFT koleksiyonları, mint ve değer tartışmaları için özel kanal.
                    </p>
                    <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">t.me/arayis_nft</span>
                      <a 
                        href="https://t.me/arayis_nft" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:text-primary/80"
                      >
                        Ziyaret Et <ExternalLink size={14} className="ml-1" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-md font-medium flex items-center">
                      <span className="flex h-6 w-6 rounded-full bg-green-100 text-green-500 items-center justify-center mr-2">
                        <Hash size={16} />
                      </span>
                      Duyuru Kanalı
                    </h4>
                    <p className="text-sm text-gray-600 mt-2 mb-4">
                      Resmi duyurular, güncellemeler ve etkinlikler için yayın kanalı.
                    </p>
                    <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">t.me/arayis_duyuru</span>
                      <a 
                        href="https://t.me/arayis_duyuru" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:text-primary/80"
                      >
                        Ziyaret Et <ExternalLink size={14} className="ml-1" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-md font-medium flex items-center">
                      <span className="flex h-6 w-6 rounded-full bg-amber-100 text-amber-500 items-center justify-center mr-2">
                        <Hash size={16} />
                      </span>
                      Yeni Kullanıcılar
                    </h4>
                    <p className="text-sm text-gray-600 mt-2 mb-4">
                      Yeni başlayanlar için öğreticiler, yardım ve destek grubu.
                    </p>
                    <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">t.me/arayis_yeni</span>
                      <a 
                        href="https://t.me/arayis_yeni" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:text-primary/80"
                      >
                        Ziyaret Et <ExternalLink size={14} className="ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Hazır Davet Mesajları</h3>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-2">Genel Davet Mesajı</h4>
                  <div className="bg-white border border-gray-200 rounded p-3 text-sm">
                    <p>🌟 Arayış Evreni'ne katıl ve TON ekosistemindeki yolculuğuna başla! NFT'ler, ödüller ve daha fazlası seni bekliyor. Kayıt olmak için bağlantıyı kullan: t.me/arayisevrenibot?start=ref123</p>
                    <button 
                      className="mt-2 text-primary hover:text-primary/80 text-xs font-medium"
                      onClick={() => {
                        navigator.clipboard.writeText('🌟 Arayış Evreni\'ne katıl ve TON ekosistemindeki yolculuğuna başla! NFT\'ler, ödüller ve daha fazlası seni bekliyor. Kayıt olmak için bağlantıyı kullan: t.me/arayisevrenibot?start=ref123');
                      }}
                    >
                      Kopyala
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-2">NFT Koleksiyonu Davet Mesajı</h4>
                  <div className="bg-white border border-gray-200 rounded p-3 text-sm">
                    <p>🖼️ Arayış Evreni'nin benzersiz NFT koleksiyonuna göz at! Limitleri koleksiyonlar, TON blokzincirinde mint seçeneği ve çok daha fazlası. Hemen katıl: t.me/arayisevrenibot?start=ref123</p>
                    <button 
                      className="mt-2 text-primary hover:text-primary/80 text-xs font-medium"
                      onClick={() => {
                        navigator.clipboard.writeText('🖼️ Arayış Evreni\'nin benzersiz NFT koleksiyonuna göz at! Limitleri koleksiyonlar, TON blokzincirinde mint seçeneği ve çok daha fazlası. Hemen katıl: t.me/arayisevrenibot?start=ref123');
                      }}
                    >
                      Kopyala
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Growth; 