import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminGrantStars, adminDistributeNFT, adminFetchUserProfile, adminFetchUserNFTs } from '../utils/api';
import { UserProfile, Nft } from '../types';
import { AlertCircle, CheckCircle, UserCheck, Gift, Star, Key, Users, Award, Zap, ShieldAlert } from 'lucide-react';

// Admin şifresi
const ADMIN_PASSCODE = 'secret123';

const Admin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'stars' | 'nft' | 'profile'>('stars');
  
  // Stars Yönetim State
  const [starsUserId, setStarsUserId] = useState<string>('');
  const [starsAmount, setStarsAmount] = useState<string>('');
  const [starsReason, setStarsReason] = useState<string>('');
  const [starsLoading, setStarsLoading] = useState<boolean>(false);
  const [starsResult, setStarsResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // NFT Dağıtım State
  const [nftUserId, setNftUserId] = useState<string>('');
  const [nftId, setNftId] = useState<string>('');
  const [nftLoading, setNftLoading] = useState<boolean>(false);
  const [nftResult, setNftResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Profil Görüntüleme State
  const [profileUserId, setProfileUserId] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userNfts, setUserNfts] = useState<Nft[]>([]);
  
  // Yetkilendirme kontrolü
  useEffect(() => {
    const adminCode = searchParams.get('admin');
    setIsAuthorized(adminCode === ADMIN_PASSCODE);
  }, [searchParams]);
  
  // Stars verme işlevi
  const handleGrantStars = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!starsUserId || !starsAmount) return;
    
    setStarsLoading(true);
    setStarsResult(null);
    
    try {
      const userId = parseInt(starsUserId, 10);
      const amount = parseInt(starsAmount, 10);
      const reason = starsReason || 'Admin tarafından manuel eklendi';
      
      const result = await adminGrantStars(userId, amount, reason);
      setStarsResult(result);
      
      if (result.success) {
        // Başarılı ise formu temizle
        setStarsUserId('');
        setStarsAmount('');
        setStarsReason('');
      }
    } catch (error) {
      setStarsResult({
        success: false,
        message: 'Stars verilirken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')
      });
    } finally {
      setStarsLoading(false);
    }
  };
  
  // NFT dağıtım işlevi
  const handleDistributeNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nftUserId || !nftId) return;
    
    setNftLoading(true);
    setNftResult(null);
    
    try {
      const userId = parseInt(nftUserId, 10);
      const nftIdNumber = parseInt(nftId, 10);
      
      const result = await adminDistributeNFT(userId, nftIdNumber);
      setNftResult(result);
      
      if (result.success) {
        // Başarılı ise formu temizle
        setNftUserId('');
        setNftId('');
      }
    } catch (error) {
      setNftResult({
        success: false,
        message: 'NFT dağıtılırken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')
      });
    } finally {
      setNftLoading(false);
    }
  };
  
  // Kullanıcı profili görüntüleme işlevi
  const handleFetchUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUserId) return;
    
    setProfileLoading(true);
    setUserProfile(null);
    setUserNfts([]);
    
    try {
      const userId = parseInt(profileUserId, 10);
      
      // Paralel olarak profil ve NFT bilgilerini çek
      const [profile, nfts] = await Promise.all([
        adminFetchUserProfile(userId),
        adminFetchUserNFTs(userId)
      ]);
      
      setUserProfile(profile);
      setUserNfts(nfts);
    } catch (error) {
      console.error('Profil getirme hatası:', error);
    } finally {
      setProfileLoading(false);
    }
  };
  
  // Yetkisiz erişim durumunda
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600 mb-6">
            Bu sayfaya erişim için yetkilendirme gereklidir.
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
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <ShieldAlert size={28} className="text-primary mr-2" />
            Admin Kontrol Paneli
          </h1>
          <p className="text-gray-600">Stars, NFT ve Kullanıcı yönetimi</p>
        </header>
        
        {/* Tab Menüsü */}
        <nav className="flex border-b mb-8">
          <button
            className={`py-3 px-6 font-medium text-center ${activeTab === 'stars' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('stars')}
          >
            <div className="flex items-center">
              <Star size={18} className="mr-2" />
              Stars Yönetimi
            </div>
          </button>
          <button
            className={`py-3 px-6 font-medium text-center ${activeTab === 'nft' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('nft')}
          >
            <div className="flex items-center">
              <Gift size={18} className="mr-2" />
              NFT Dağıtımı
            </div>
          </button>
          <button
            className={`py-3 px-6 font-medium text-center ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center">
              <UserCheck size={18} className="mr-2" />
              Kullanıcı Profili
            </div>
          </button>
        </nav>
        
        {/* Stars Yönetimi */}
        {activeTab === 'stars' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Star size={20} className="text-amber-400 mr-2" />
              Stars Verme Aracı
            </h2>
            
            <form onSubmit={handleGrantStars} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı ID (Telegram ID)
                </label>
                <input
                  type="number"
                  value={starsUserId}
                  onChange={(e) => setStarsUserId(e.target.value)}
                  placeholder="Örn: 12345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stars Miktarı
                </label>
                <input
                  type="number"
                  value={starsAmount}
                  onChange={(e) => setStarsAmount(e.target.value)}
                  placeholder="Örn: 100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sebep (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={starsReason}
                  onChange={(e) => setStarsReason(e.target.value)}
                  placeholder="Örn: Etkinlik ödülü"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              
              <button
                type="submit"
                disabled={starsLoading}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starsLoading ? 'İşleniyor...' : 'Stars Ver'}
              </button>
            </form>
            
            {starsResult && (
              <div className={`mt-4 p-3 rounded-md ${starsResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex">
                  {starsResult.success ? (
                    <CheckCircle size={18} className="text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-red-500 mr-2 flex-shrink-0" />
                  )}
                  <p>{starsResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* NFT Dağıtımı */}
        {activeTab === 'nft' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Gift size={20} className="text-indigo-500 mr-2" />
              NFT Dağıtım Aracı
            </h2>
            
            <form onSubmit={handleDistributeNFT} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı ID (Telegram ID)
                </label>
                <input
                  type="number"
                  value={nftUserId}
                  onChange={(e) => setNftUserId(e.target.value)}
                  placeholder="Örn: 12345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NFT ID
                </label>
                <input
                  type="number"
                  value={nftId}
                  onChange={(e) => setNftId(e.target.value)}
                  placeholder="Örn: 201"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={nftLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nftLoading ? 'İşleniyor...' : 'NFT Dağıt'}
              </button>
            </form>
            
            {nftResult && (
              <div className={`mt-4 p-3 rounded-md ${nftResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex">
                  {nftResult.success ? (
                    <CheckCircle size={18} className="text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-red-500 mr-2 flex-shrink-0" />
                  )}
                  <p>{nftResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Kullanıcı Profili */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <UserCheck size={20} className="text-blue-500 mr-2" />
              Kullanıcı Profili Sorgulama
            </h2>
            
            <form onSubmit={handleFetchUserProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı ID (Telegram ID)
                </label>
                <input
                  type="number"
                  value={profileUserId}
                  onChange={(e) => setProfileUserId(e.target.value)}
                  placeholder="Örn: 12345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileLoading ? 'Yükleniyor...' : 'Profili Göster'}
              </button>
            </form>
            
            {profileLoading && (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {userProfile && !profileLoading && (
              <div className="mt-6 space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Users size={18} className="text-blue-600 mr-2" />
                    Kullanıcı Bilgileri
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Kullanıcı ID</p>
                      <p className="font-medium">{userProfile.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telegram ID</p>
                      <p className="font-medium">{userProfile.telegram_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Kullanıcı Adı</p>
                      <p className="font-medium">{userProfile.username || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ad</p>
                      <p className="font-medium">{userProfile.first_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Katılım Tarihi</p>
                      <p className="font-medium">{new Date(userProfile.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">VIP Erişim</p>
                      <p className="font-medium">{userProfile.has_vip_access ? 'Evet' : 'Hayır'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Zap size={18} className="text-amber-600 mr-2" />
                    XP ve Level Bilgisi
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Level</p>
                      <p className="text-xl font-bold text-amber-600">{userProfile.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Toplam XP</p>
                      <p className="text-xl font-bold text-indigo-600">{userProfile.xp} XP</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Stars</p>
                      <p className="text-xl font-bold text-yellow-500">{userProfile.stars} ⭐</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Görev Zinciri</p>
                      <p className="font-medium">{userProfile.mission_streak} gün</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Kesintisiz Giriş</p>
                      <p className="font-medium">{userProfile.consecutive_login_days} gün</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Davet Edilen Kişi</p>
                      <p className="font-medium">{userProfile.invited_users_count} kişi</p>
                    </div>
                  </div>
                </div>
                
                {userNfts.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Award size={18} className="text-purple-600 mr-2" />
                      NFT Koleksiyonu ({userNfts.length})
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {userNfts.map(nft => (
                        <div key={nft.id} className="bg-white rounded-md border border-gray-200 p-3 shadow-sm">
                          {nft.image_url && (
                            <img 
                              src={nft.image_url} 
                              alt={nft.name} 
                              className="w-full aspect-square object-cover rounded-md mb-2"
                            />
                          )}
                          <h4 className="font-medium text-gray-800">{nft.name}</h4>
                          <p className="text-xs text-gray-500">{nft.description}</p>
                          <div className="flex justify-between items-center mt-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${nft.is_minted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {nft.is_minted ? 'Mint Edildi' : 'Mint Edilmedi'}
                            </span>
                            <span className="text-gray-500">ID: {nft.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin; 