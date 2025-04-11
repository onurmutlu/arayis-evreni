import React, { useState, useEffect } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import NFTKarti from '../components/NFTKarti';
import { Gem, Loader2, AlertCircle, Lock, Star, Info, CheckCircle, Crown } from 'lucide-react';
import { mockNFTData, convertToNftType } from '../data/nftData';
import { Nft, NFTCategory, UserProfile } from '../types';
import { fetchUserWallet, fetchUserProfile, fetchAllNfts, buyNft, fetchOwnedNfts, mintNft } from '../utils/api';
import { useTelegram } from '../contexts/TelegramContext';
import { triggerHapticFeedback, showNotification } from '../utils/hapticFeedback';

// Galeride gösterilecek minimum seviye
const MIN_LEVEL_FOR_SORA_COLLECTION = 5;

// Kullanıcı profili arayüzü
interface UserProfileData {
  level: number;
  username: string;
}

const Galeri: React.FC = () => {
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [ownedNfts, setOwnedNfts] = useState<Nft[]>([]);
  const [mintingId, setMintingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStars, setUserStars] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { getTelegramUserId } = useTelegram();

  // Başlangıçta NFT verilerini ve kullanıcı bilgilerini getir
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setIsUserDataLoading(true);
      setError(null);
      
      try {
        // API çağrılarını paralel olarak yap
        const [walletData, profileData, nftsData, userOwnedNfts] = await Promise.all([
          fetchUserWallet(),
          fetchUserProfile(),
          fetchAllNfts(),
          fetchOwnedNfts()
        ]);
        
        // Kullanıcı cüzdanı verilerini ayarla
        if (walletData) {
          setUserStars(walletData.stars);
        }
        
        // Kullanıcı profili verilerini ayarla
        if (profileData) {
          setUserProfile(profileData);
        }
        
        // NFT verilerini ayarla
        if (nftsData && nftsData.length > 0) {
          setNfts(nftsData);
          triggerHapticFeedback('success');
        } else {
          // API'den veri alınamazsa mock veri kullanılıyor
          console.warn("API'den NFT verileri alınamadı, mock veri kullanılıyor.");
          const convertedNfts: Nft[] = mockNFTData.map(convertToNftType);
          setNfts(convertedNfts);
          showNotification('warning', 'NFT verileri yüklenemedi, demo veriler gösteriliyor.');
        }
        
        // Sahip olunan NFT'leri ayarla
        setOwnedNfts(userOwnedNfts);
      } catch (err: any) {
        console.error('Veri yüklenirken hata:', err);
        setError("Veriler yüklenemedi. Lütfen sayfayı yenileyin.");
        triggerHapticFeedback('error');
        showNotification('error', 'Veriler yüklenemedi. Lütfen sayfayı yenileyin.');
        
        // API çağrıları başarısız olsa bile mock veriyi göster
        const convertedNfts: Nft[] = mockNFTData.map(convertToNftType);
        setNfts(convertedNfts);
      } finally {
        setLoading(false);
        setIsUserDataLoading(false);
      }
    };

    loadData();
  }, []);

  // Normal NFT'ler ve Sora özel koleksiyonunu ayır
  const standardNfts = nfts.filter(nft => !nft.is_elite);
  const soraNfts = nfts.filter(nft => nft.is_elite);
  
  // Sora koleksiyonuna erişimi olup olmadığını kontrol et
  const canAccessSoraCollection = userProfile && userProfile.level >= MIN_LEVEL_FOR_SORA_COLLECTION;

  // NFT'leri mint etme fonksiyonu
  const handleMint = async (nftId: number) => {
    if (mintingId) return; // Zaten bir mint işlemi sürüyorsa engelle

    setMintingId(nftId);
    setError(null);

    try {
      triggerHapticFeedback('medium');
      const result = await mintNft(nftId);
      
      // Mint başarılı, sahip olunan NFT'leri güncelle
      const updatedOwnedNfts = await fetchOwnedNfts();
      setOwnedNfts(updatedOwnedNfts);
      
      // Kullanıcının kalan yıldızlarını güncelle (varsa)
      if (result && result.remaining_stars) {
        setUserStars(result.remaining_stars);
      }
      
      triggerHapticFeedback('success');
      showNotification('success', 'NFT başarıyla mint edildi!');
      
    } catch (err: any) {
      console.error('NFT mint edilirken hata:', err);
      setError(err.message || 'NFT mint edilirken bir hata oluştu.');
      triggerHapticFeedback('error');
      showNotification('error', err.message || 'NFT mint edilirken bir hata oluştu.');
    } finally {
      setMintingId(null);
    }
  };

  // Mevcut NFT'yi kullanıcının sahip olup olmadığını kontrol et
  const isNftOwned = (nftId: number) => {
    return ownedNfts.some(nft => nft.id === nftId);
  };

  // NFT'leri kategorilerine göre gruplandır
  const categories = React.useMemo(() => {
    if (!nfts.length) return [];
    
    // Benzersiz kategorileri al
    const uniqueCategories = Array.from(new Set(nfts.map(nft => nft.category)));
    
    // Kategorileri kullanıcı dostu adlara çevir
    return uniqueCategories.map(category => {
      const displayName = 
        category === NFTCategory.GENERAL ? 'Genel' :
        category === NFTCategory.SORA_VIDEO ? 'Sora Koleksiyonu' :
        category === NFTCategory.VOTE_BASIC ? 'Temel Oylama' :
        category === NFTCategory.VOTE_PREMIUM ? 'Premium Oylama' :
        category === NFTCategory.VOTE_SORA ? 'Sora Oylama' : 
        category;
      
      return { 
        value: category, 
        displayName 
      };
    }).sort((a, b) => {
      // Sora Koleksiyonu en sona gelsin
      if (a.value === NFTCategory.SORA_VIDEO) return 1;
      if (b.value === NFTCategory.SORA_VIDEO) return -1;
      return a.displayName.localeCompare(b.displayName);
    });
  }, [nfts]);

  // Görüntülenecek NFT'leri filtrele
  const filteredNfts = React.useMemo(() => {
    // Hiç NFT yoksa boş dizi döndür
    if (!nfts.length) return [];
    
    // Aktif bir kategori filtresi varsa, sadece o kategorideki NFT'leri göster
    let filtered = activeCategory 
      ? nfts.filter(nft => nft.category === activeCategory)
      : nfts;
    
    // Sora koleksiyonu için seviye kontrolü (eğer Sora kategorisi seçildiyse)
    if (activeCategory === NFTCategory.SORA_VIDEO && !canAccessSoraCollection) {
      // Erişim yoksa boş dizi döndür
      return [];
    }
    
    // Varsayılan filtrede, Sora kategorisini gösterme (kullanıcının seviyesi yeterli değilse)
    if (!activeCategory && !canAccessSoraCollection) {
      filtered = filtered.filter(nft => nft.category !== NFTCategory.SORA_VIDEO);
    }
    
    return filtered;
  }, [nfts, activeCategory, canAccessSoraCollection]);

  // Sora koleksiyonu erişim kontrolü
  const hasSoraAccess = userProfile ? userProfile.level >= 5 : false;

  return (
    <div className="p-4 max-w-6xl mx-auto pb-20">
      <SayfaBasligi title="NFT Galerisi" icon={Gem} />

      {error && (
        <div className="mb-4 p-3 bg-error/10 text-error rounded-md text-center flex items-center justify-center">
          <AlertCircle size={18} className="mr-2" />
          {error}
        </div>
      )}

      {/* Kullanıcı bilgileri */}
      {!isUserDataLoading && userProfile && (
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div className="flex items-center bg-surface px-4 py-2 rounded-lg shadow-sm border border-border">
            <span className="font-medium mr-2">@{userProfile.username}</span>
            <span className="text-primary font-bold">Seviye {userProfile.level}</span>
          </div>
          
          <div className="flex items-center bg-surface px-3 py-1.5 rounded-lg shadow-sm border border-border mt-2 sm:mt-0">
            <span className="text-amber-400 font-bold mr-1">⭐</span>
            <span className="font-medium">{userStars}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={36} className="animate-spin text-primary" />
          <span className="ml-3 text-textSecondary">NFT'ler yükleniyor...</span>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center mt-8 text-textSecondary">
          Gösterilecek NFT bulunamadı.
        </div>
      ) : (
        <>
          {/* Kategori filtreleri */}
          {!loading && categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => {
                  setActiveCategory(null);
                  triggerHapticFeedback('selection');
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !activeCategory 
                    ? 'bg-primary text-white' 
                    : 'bg-muted hover:bg-muted/80 text-textSecondary'
                }`}
              >
                Tümü
              </button>
              
              {categories.map(category => {
                // Sora Koleksiyonu için erişim kontrolü
                if (category.value === NFTCategory.SORA_VIDEO && !canAccessSoraCollection) {
                  return (
                    <button
                      key={category.value}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-muted/50 text-textMuted flex items-center cursor-not-allowed"
                      title="Bu koleksiyonu görmek için seviye 5 olmalısınız"
                      onClick={() => {
                        triggerHapticFeedback('error');
                        showNotification('warning', 'Bu koleksiyonu görmek için seviye 5 olmalısınız');
                      }}
                    >
                      <Lock size={14} className="mr-1.5" />
                      {category.displayName}
                    </button>
                  );
                }
                
                return (
                  <button
                    key={category.value}
                    onClick={() => {
                      setActiveCategory(category.value);
                      triggerHapticFeedback('selection');
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === category.value
                        ? 'bg-primary text-white'
                        : 'bg-muted hover:bg-muted/80 text-textSecondary'
                    }`}
                  >
                    {category.displayName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Sora Koleksiyonu kilidi */}
          {activeCategory === NFTCategory.SORA_VIDEO && !canAccessSoraCollection && (
            <div className="bg-muted/40 border border-border rounded-lg p-6 text-center my-8">
              <Crown size={40} className="mx-auto mb-4 text-textSecondary" />
              <h3 className="text-lg font-semibold mb-1">Sora Koleksiyonu Kilitli</h3>
              <p className="text-textSecondary mb-4">
                Bu özel koleksiyonu görmek için seviye 5'e ulaşmanız gerekiyor. Şu anki seviyeniz: {userProfile?.level || 0}
              </p>
              <div className="text-xs inline-block bg-background px-3 py-1.5 rounded text-textSecondary">
                Görevleri tamamlayarak seviye atlayabilirsiniz
              </div>
            </div>
          )}

          {/* NFT'leri göster */}
          {!loading && filteredNfts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredNfts.map((nft) => (
                <NFTKarti
                  key={nft.id}
                  nft={nft}
                  isOwned={isNftOwned(nft.id)}
                  isMinting={mintingId === nft.id}
                  onMint={() => handleMint(nft.id)}
                  userStars={userStars}
                />
              ))}
            </div>
          )}
          
          {/* Hiç NFT yoksa */}
          {!loading && !error && filteredNfts.length === 0 && !activeCategory && (
            <p className="text-center text-textSecondary mt-8">Henüz NFT bulunamadı.</p>
          )}
          
          {/* Seçili kategoride NFT yoksa */}
          {!loading && !error && filteredNfts.length === 0 && activeCategory && (
            <p className="text-center text-textSecondary mt-8">
              Bu kategoride NFT bulunamadı.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default Galeri; 