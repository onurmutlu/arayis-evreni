import React, { useState, useEffect, useCallback } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import Buton from '../components/Buton';
import { Gift, Star, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { NFT, mockNFTData, convertToNftType } from '../data/nftData';
import { triggerHapticFeedback, showNotification } from '../utils/hapticFeedback';
import { claimNft, fetchClaimableNfts, fetchUserWallet } from '../utils/api';
import { Nft } from '../types';

// API yanıtı için arayüz
interface ClaimResult {
    message: string;
    new_stars_balance: number;
}
interface WalletData {
    stars: number;
    // Diğer alanlar olabilir ama burada sadece stars lazım
}

// API base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

const NftClaim: React.FC = () => {
  const [userStars, setUserStars] = useState<number | null>(null); // Başlangıçta null
  const [claimableNfts, setClaimableNfts] = useState<NFT[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const userId = 'user123'; // Simüle edilmiş kullanıcı ID'si
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  // Başlangıçta claim edilmemiş NFT'leri ve kullanıcı yıldızını yükle
  const loadInitialData = useCallback(async () => {
      setIsLoadingWallet(true);
      setError(null);
      try {
        // Cüzdan bilgisini (yıldız) çek
        const walletResponse = await fetch(`${API_BASE_URL}/wallet/${userId}`);
        if (!walletResponse.ok) {
            throw new Error("Kullanıcı verisi alınamadı.");
        }
        const walletData: WalletData = await walletResponse.json();
        setUserStars(walletData.stars);

        // Lokal NFT verisinden claim edilebilirleri filtrele
        // TODO: İdealde bu liste de API'dan gelmeli (kullanıcının sahip OLMADIĞI NFT'ler)
        setClaimableNfts(mockNFTData.filter(nft => !nft.minted)); // Şimdilik mint durumuna göre

      } catch (err: any) {
          console.error("Başlangıç verileri yüklenirken hata:", err);
          setError(err.message || "Veriler yüklenemedi.");
      } finally {
          setIsLoadingWallet(false);
      }
  }, [userId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Claim işlemi (API isteği ile)
  const handleClaim = async (nftToClaim: NFT) => {
    // Yıldız yüklenmediyse veya yetersizse veya işlem varsa çık
    if (claimingId || userStars === null || userStars < nftToClaim.claim_cost) return;

    setClaimingId(nftToClaim.id);
    setError(null);
    setSuccessMessage(null);

    try {
      triggerHapticFeedback('medium');
      const response = await fetch(`${API_BASE_URL}/claim_nft/${userId}/${nftToClaim.id}`, {
        method: 'POST'
      });
      
      const resultData = await response.json(); // Yanıtı her zaman oku

      if (!response.ok) {
        triggerHapticFeedback('error');
        showNotification('error');
        throw new Error(resultData.detail || `NFT claim edilemedi: ${response.status}`);
      }
      
      const result: ClaimResult = resultData;

      // Başarı durumunu güncelle
      setUserStars(result.new_stars_balance); // Yeni yıldız bakiyesini güncelle
      setClaimableNfts(prevNfts => prevNfts.filter(nft => nft.id !== nftToClaim.id)); // Claim edilen NFT'yi listeden çıkar
      setSuccessMessage(result.message); // Başarı mesajını göster

      // Başarı feedback'i
      triggerHapticFeedback('success');
      showNotification('success');

      // Mesajı birkaç saniye sonra kaldır
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err: any) {
      console.error(`NFT ${nftToClaim.id} claim edilirken hata:`, err);
      setError(err.message || "NFT claim edilirken bir sorun oluştu.");
      // Hata mesajını da kaldırabiliriz
      setTimeout(() => setError(null), 5000);
    } finally {
      setClaimingId(null);
    }
  };

  // NFT talep etme fonksiyonu
  const handleClaimNft = async (nftId: number) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setSelectedNftId(nftId.toString());
    
    try {
      triggerHapticFeedback('medium');
      const result = await claimNft(nftId);
      
      if (result.message) {
        triggerHapticFeedback('success');
        showNotification('success');
        setToast({
          message: "NFT başarıyla hesabınıza eklendi!",
          type: 'success'
        });
        
        // NFT listesini güncelle
        const claimableNfts = await fetchClaimableNfts();
        // Nft tipini NFT tipine dönüştür
        const convertedNfts = claimableNfts.map(nft => {
          const mockNft = mockNFTData.find(mock => mock.id === `nft-${nft.category}-${nft.id}`);
          return mockNft || {
            id: `nft-${nft.category}-${nft.id}`,
            title: nft.name,
            description: nft.description,
            category: nft.category as any,
            video_url: nft.video_url || '',
            claim_cost: nft.price_stars,
            minted: false
          };
        });
        setClaimableNfts(convertedNfts);
        
        // Yıldız bakiyesini güncelle
        const wallet = await fetchUserWallet();
        setUserStars(wallet.stars);
      } else {
        triggerHapticFeedback('error');
        setToast({
          message: result.message || "NFT talep edilemedi!",
          type: 'error'
        });
      }
    } catch (error: any) {
      console.error("NFT talep edilirken hata:", error);
      triggerHapticFeedback('error');
      showNotification('error');
      
      setToast({
        message: error.message || "NFT talep edilirken bir hata oluştu.",
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      setSelectedNftId(null);
      
      // Toast mesajını birkaç saniye sonra kaldır
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-20">
      <SayfaBasligi title="NFT Claim" icon={Gift} />

      {/* Kullanıcı Yıldız Bakiyesi */} 
      <div className="mb-6 p-4 bg-card border border-border rounded-lg flex justify-between items-center shadow-sm">
          <span className="text-lg font-medium text-textSecondary">Yıldız Bakiyeniz:</span>
          {isLoadingWallet ? (
              <Loader2 size={20} className="animate-spin text-primary"/>
          ) : userStars !== null ? (
              <div className="flex items-center text-xl font-bold text-primary">
                  <Star size={20} className="mr-1.5 fill-yellow-400 text-yellow-500"/>
                  {userStars}
              </div>
          ) : (
              <span className="text-sm text-error">Bakiye yüklenemedi</span>
          )}
      </div>

      {/* Hata Mesajı */} 
      {error && (
        <div className="mb-4 p-3 bg-error/10 text-error rounded-md text-center flex items-center justify-center">
          <AlertTriangle size={18} className="mr-2" />
          {error}
        </div>
      )}

      {/* Başarı Mesajı */} 
      {successMessage && (
        <div className="mb-4 p-3 bg-success/10 text-success rounded-md text-center flex items-center justify-center">
          <CheckCircle size={18} className="mr-2" />
          {successMessage}
        </div>
      )}

      {/* Claim Edilebilir NFT Listesi */} 
       {isLoadingWallet && claimableNfts.length === 0 ? (
            <div className="text-center mt-8 text-textSecondary">NFT listesi yükleniyor...</div>
        ) : !isLoadingWallet && claimableNfts.length === 0 && !error ? (
          <p className="text-center text-textSecondary mt-8">Claim edilecek NFT bulunmamaktadır.</p>
        ) : (
           <div className="space-y-4">
               {claimableNfts.map((nft) => {
                 // Yıldızlar null değilse kontrol yap, null ise veya yetersizse false
                 const canAfford = userStars !== null && userStars >= nft.claim_cost;
                 const isClaimingThis = claimingId === nft.id;
     
                 return (
                   <div key={nft.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card shadow-sm">
                     <div className="flex items-center">
                         <div>
                             <h3 className="text-md font-semibold text-text">{nft.title}</h3>
                             <p className="text-sm text-primary flex items-center">
                                 <Star size={14} className="mr-1 fill-yellow-400 text-yellow-500" />
                                 {nft.claim_cost} Yıldız
                             </p>
                         </div>
                     </div>
     
                     <div>
                         {!canAfford && userStars !== null && (
                             <div className="text-xs text-warning flex items-center">
                                 <AlertTriangle size={14} className="mr-1" />
                                 Yetersiz Yıldız
                             </div>
                         )}
                         <Buton
                             onClick={() => handleClaim(nft)}
                             disabled={!canAfford || !!claimingId || isLoadingWallet}
                             variant={canAfford ? "primary" : "secondary"}
                             size="sm"
                             className={`mt-1 min-w-[110px] flex items-center justify-center ${!canAfford || isLoadingWallet ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                             {isClaimingThis ? (
                                 <>
                                     <Loader2 size={16} className="animate-spin mr-1.5" />
                                     Claim Ediliyor...
                                 </>
                             ) : (
                                 'Claim Et'
                             )}
                         </Buton>
                     </div>
                   </div>
                 );
               })}
            </div>
        )}
    </div>
  );
};

export default NftClaim; 