import React, { useState, useEffect, useCallback } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import NFTKarti from '../components/NFTKarti';
import { Wallet as WalletIcon, AlertCircle, Loader2, Star, RefreshCw } from 'lucide-react';
import Buton from '../components/Buton';
import { useTelegram } from '../contexts/TelegramContext';
import { fetchUserWallet, fetchOwnedNfts } from '../utils/api';
import { Nft } from '../types';

const Wallet: React.FC = () => {
  const { getTelegramUserId } = useTelegram();
  const [walletData, setWalletData] = useState<{ stars: number; stars_spent: number; uid: string } | null>(null);
  const [ownedNfts, setOwnedNfts] = useState<Nft[]>([]);
  const [loading, setLoading] = useState(true);
  const [nftsLoading, setNftsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
    loadWalletData();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <SayfaBasligi title="Cüzdan" icon={WalletIcon} />
        <Buton 
          onClick={handleRefreshWallet} 
          variant="ghost" 
          size="sm"
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} className={`mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Yenile
        </Buton>
      </div>

      {/* Yükleme durumu */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="ml-3 text-lg text-textSecondary">Cüzdan bilgileri yükleniyor...</span>
        </div>
      )}

      {/* Hata durumu */}
      {!loading && error && (
        <div className="p-4 bg-error/10 text-error text-center rounded-lg mb-4 border border-error/30">
          <AlertCircle size={20} className="inline-block mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* Cüzdan bilgileri */}
      {!loading && !error && walletData && (
        <div className="mb-8">
          <div className="bg-surface rounded-lg shadow-md p-6 mb-4">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Star size={20} className="mr-2 text-amber-400" />
              Stars Bakiyesi
            </h2>
            
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="bg-muted/30 rounded-lg p-4 flex-1">
                <p className="text-textSecondary text-sm mb-1">Mevcut Stars</p>
                <p className="text-2xl font-bold text-amber-400">{walletData.stars}</p>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4 flex-1">
                <p className="text-textSecondary text-sm mb-1">Toplam Harcanan</p>
                <p className="text-2xl font-bold">{walletData.stars_spent}</p>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4 flex-1">
                <p className="text-textSecondary text-sm mb-1">Kullanıcı ID</p>
                <p className="text-lg font-medium truncate">{walletData.uid}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NFT'ler */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Sahip Olduğun NFT'ler</h2>
        
        {nftsLoading && (
          <div className="flex justify-center items-center py-6">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="ml-2 text-textSecondary">NFT'ler yükleniyor...</span>
          </div>
        )}
        
        {!nftsLoading && ownedNfts.length === 0 && (
          <div className="text-center py-8 text-textSecondary bg-surface rounded-lg">
            <p>Henüz hiç NFT'ye sahip değilsin.</p>
            <p className="text-sm mt-2">Galeri'ye giderek NFT'leri keşfedebilirsin!</p>
          </div>
        )}
        
        {!nftsLoading && ownedNfts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ownedNfts.map((nft) => (
              <NFTKarti 
                key={nft.id} 
                nft={nft}
                isOwned={true}
                showPrice={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet; 