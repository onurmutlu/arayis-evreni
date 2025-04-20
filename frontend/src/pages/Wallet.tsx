import React, { useState, useEffect, useCallback } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import NFTKarti from '../components/NFTKarti';
import { Wallet as WalletIcon, AlertCircle, Loader2, Star, RefreshCw, CreditCard, ShoppingBag, Shield, Sparkles, TrendingUp, Rocket } from 'lucide-react';
import Buton from '../components/Buton';
import { useTelegram } from '../contexts/TelegramContext';
import { fetchUserWallet, fetchOwnedNfts } from '../utils/api';
import { Nft } from '../types';
import { Link } from 'react-router-dom';

const Wallet: React.FC = () => {
  const { getTelegramUserId } = useTelegram();
  const [walletData, setWalletData] = useState<{ stars: number; stars_spent: number; uid: string } | null>(null);
  const [ownedNfts, setOwnedNfts] = useState<Nft[]>([]);
  const [loading, setLoading] = useState(true);
  const [nftsLoading, setNftsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showStarsAnimation, setShowStarsAnimation] = useState(false);

  // Cüzdan verilerini yükle
  const loadWalletData = useCallback(async () => {
    if (refreshing) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const uid = getTelegramUserId();
      const wallet = await fetchUserWallet(uid?.toString());
      setWalletData(wallet);
      
      // NFT verilerini yükle
      setNftsLoading(true);
      try {
        const nfts = await fetchOwnedNfts();
        setOwnedNfts(nfts);
      } catch (nftErr: any) {
        console.error('NFT verileri yüklenirken hata:', nftErr);
        // Kullanıcı cüzdan bilgilerini görebilsin diye kritik hata olarak işaretleme
      } finally {
        setNftsLoading(false);
      }
    } catch (err: any) {
      console.error('Cüzdan verileri yüklenirken hata:', err);
      setError(err.message || 'Cüzdan verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getTelegramUserId, refreshing]);

  // İlk yükleme
  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  // Cüzdanı yenile
  const handleRefreshWallet = () => {
    setRefreshing(true);
    setShowStarsAnimation(true);
    setTimeout(() => setShowStarsAnimation(false), 1500);
    loadWalletData();
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Kozmik arka plan */}
      <div 
        className="fixed inset-0 z-0 bg-gradient-to-b from-background to-black" 
        style={{
          backgroundImage: `url('/assets/images/cosmic-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15
        }}
      ></div>
      
      {/* Parlayan yıldızlar */}
      <div className="fixed inset-0 z-0 overflow-hidden opacity-30">
        {Array.from({length: 25}).map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 7}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Yıldız animasyonu */}
      {showStarsAnimation && (
        <div className="fixed inset-0 z-10 pointer-events-none">
          {Array.from({length: 15}).map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                top: `${30 + Math.random() * 40}%`,
                left: `${30 + Math.random() * 40}%`,
                animationDuration: `${0.5 + Math.random() * 1}s`,
                animationDelay: `${Math.random() * 0.5}s`,
                opacity: Math.random() * 0.8
              }}
            ></div>
          ))}
        </div>
      )}
      
      {/* Ana içerik */}
      <div className="relative z-5 p-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <SayfaBasligi title="Kozmik Cüzdan" icon={WalletIcon} />
          <Buton 
            onClick={handleRefreshWallet} 
            variant="secondary"
            size="sm"
            disabled={loading || refreshing}
            className="bg-primary/20 hover:bg-primary/30 border border-primary/30 backdrop-blur-sm transition-all"
          >
            <RefreshCw size={16} className={`mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </Buton>
        </div>

        {/* Yükleme durumu */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-14 bg-card/20 backdrop-blur-md rounded-xl border border-primary/10">
            <div className="relative">
              <Loader2 size={40} className="animate-spin text-primary z-10" />
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-md animate-pulse"></div>
            </div>
            <span className="mt-4 text-lg text-text/80">Astral varlıklarını topluyoruz...</span>
          </div>
        )}

        {/* Hata durumu */}
        {!loading && error && (
          <div className="p-6 bg-card/30 backdrop-blur-md text-error text-center rounded-xl mb-4 border border-error/30 shadow-lg">
            <div className="bg-error/10 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-3">
              <AlertCircle size={28} className="text-error" />
            </div>
            <p className="text-lg font-medium mb-2">Cüzdan Erişilemedi</p>
            <p className="text-textSecondary mb-4">{error}</p>
            <Buton variant="secondary" size="sm" onClick={handleRefreshWallet}>
              <RefreshCw size={14} className="mr-1.5" />
              Tekrar Dene
            </Buton>
          </div>
        )}

        {/* Cüzdan bilgileri */}
        {!loading && !error && walletData && (
          <div className="mb-8">
            <div className="bg-card/40 backdrop-blur-md rounded-xl shadow-lg p-6 mb-6 border border-primary/20 relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:bg-card/60">
              {/* Dekoratif elementler */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-secondary/5 rounded-full blur-xl"></div>
              
              <h2 className="text-xl font-bold mb-6 flex items-center text-gradient">
                <Sparkles size={22} className="mr-2 text-amber-400" />
                Kozmik Varlıkların
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-md rounded-xl p-5 flex items-center border border-purple-500/30 transform transition-all hover:scale-[1.02] hover:shadow-lg group">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-full mr-3 shadow-md">
                    <Star size={22} className="text-white" />
                  </div>
                  <div className="mr-3">
                    <p className="text-white/80 text-sm mb-1">Mevcut Stars</p>
                    <p className="text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">{walletData.stars}</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-70 transition-opacity">
                    <Star size={16} className="text-amber-300 animate-pulse" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-md rounded-xl p-5 flex items-center border border-blue-500/30 transform transition-all hover:scale-[1.02] hover:shadow-lg group">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-full mr-3 shadow-md">
                    <TrendingUp size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm mb-1">Toplam Harcanan</p>
                    <p className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">{walletData.stars_spent || 0}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-600/20 to-violet-600/20 backdrop-blur-md rounded-xl p-5 flex items-center border border-indigo-500/30 transform transition-all hover:scale-[1.02] hover:shadow-lg group">
                  <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-3 rounded-full mr-3 shadow-md">
                    <Shield size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm mb-1">Kullanıcı ID</p>
                    <p className="text-lg font-medium text-white truncate group-hover:text-violet-300 transition-colors">{walletData.uid}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Link to="/payment">
                  <Buton variant="primary" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border-0">
                    <Rocket size={16} className="mr-2" />
                    Stars Satın Al
                  </Buton>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* NFT'ler */}
        <div className="bg-card/40 backdrop-blur-md rounded-xl shadow-lg p-6 mb-6 border border-primary/20 relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:bg-card/60">
          {/* Dekoratif elementler */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary/5 rounded-full blur-xl"></div>
          
          <h2 className="text-xl font-bold mb-6 flex items-center text-gradient">
            <ShoppingBag size={22} className="mr-2 text-purple-400" />
            Galaktik Koleksiyonun
          </h2>
          
          {nftsLoading && (
            <div className="flex justify-center items-center py-10">
              <div className="relative">
                <Loader2 size={32} className="animate-spin text-primary z-10" />
                <div className="absolute -inset-1 rounded-full bg-primary/20 blur-md animate-pulse"></div>
              </div>
              <span className="ml-3 text-textSecondary">NFT'ler keşfediliyor...</span>
            </div>
          )}
          
          {!nftsLoading && ownedNfts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-surface/30 rounded-xl border border-primary/20 backdrop-blur-md">
              <div className="bg-primary/10 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                <ShoppingBag size={28} className="text-primary opacity-70" />
              </div>
              <p className="text-lg font-medium text-text mb-2">Henüz NFT'n yok</p>
              <p className="text-sm text-textSecondary max-w-xs mb-6">
                Galeri'ye giderek dijital evrenin en nadide koleksiyon parçalarını keşfet ve satın al
              </p>
              <Link to="/galeri">
                <Buton variant="primary" className="relative group overflow-hidden">
                  <span className="relative z-10">Galeri'yi Keşfet</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Buton>
              </Link>
            </div>
          )}
          
          {!nftsLoading && ownedNfts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {ownedNfts.map((nft) => (
                  <NFTKarti 
                    key={nft.id} 
                    nft={nft}
                    isOwned={true}
                    onMint={() => {}}
                    isMinting={false}
                    userStars={walletData?.stars || 0}
                  />
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Link to="/galeri">
                  <Buton variant="secondary" className="bg-surface/50 hover:bg-surface/70 backdrop-blur-sm">
                    Tüm Koleksiyonları Gör
                  </Buton>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet; 