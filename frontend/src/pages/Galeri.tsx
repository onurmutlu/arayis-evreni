import React, { useState, useEffect } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import NFTKarti from '../components/NFTKarti';
import { Gem, Loader2, AlertCircle, Lock, Star, Info, CheckCircle } from 'lucide-react';
import { mockNFTData, convertToNftType } from '../data/nftData';
import { Nft } from '../types';
import { fetchUserWallet, fetchUserProfile, fetchAllNfts, buyNft } from '../utils/api';

// Galeride gösterilecek minimum seviye
const MIN_LEVEL_FOR_SORA_COLLECTION = 5;

// Kullanıcı profili arayüzü
interface UserProfileData {
  level: number;
  username: string;
}

const Galeri: React.FC = () => {
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [mintingId, setMintingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStars, setUserStars] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);

  // Başlangıçta NFT verilerini ve kullanıcı bilgilerini getir
  useEffect(() => {
    // Tüm verileri paralel olarak yükle
    const loadData = async () => {
      setLoading(true);
      setIsUserDataLoading(true);
      setError(null);
      
      try {
        // API çağrılarını paralel olarak yap
        const [walletData, profileData, nftsData] = await Promise.all([
          fetchUserWallet(),
          fetchUserProfile(),
          fetchAllNfts()
        ]);
        
        // Kullanıcı cüzdanı verilerini ayarla
        if (walletData) {
          setUserStars(walletData.stars);
        }
        
        // Kullanıcı profili verilerini ayarla
        if (profileData) {
          setUserProfile({
            level: profileData.level,
            username: profileData.username || "kullanıcı"
          });
        }
        
        // NFT verilerini ayarla
        if (nftsData && nftsData.length > 0) {
          setNfts(nftsData);
        } else {
          // API'den veri alınamazsa mock veri kullanılıyor
          console.warn("API'den NFT verileri alınamadı, mock veri kullanılıyor.");
          const convertedNfts: Nft[] = mockNFTData.map(convertToNftType);
          setNfts(convertedNfts);
        }
      } catch (err: any) {
        console.error('Veri yüklenirken hata:', err);
        setError("Veriler yüklenemedi. Lütfen sayfayı yenileyin.");
        
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

  // NFT satın alma işlemi
  const handleMint = async (nftId: number) => {
    if (mintingId) return; // Zaten bir satın alma işlemi varsa yenisini başlatma

    setMintingId(nftId);
    setError(null);

    // Seçilen NFT'nin fiyatını bul
    const selectedNft = nfts.find(nft => nft.id === nftId);
    if (!selectedNft) {
      setError('NFT bulunamadı.');
      setMintingId(null);
      return;
    }

    // Sora koleksiyonu için seviye kontrolü
    if (selectedNft.is_elite && !canAccessSoraCollection) {
      setError(`Bu elit NFT'yi almak için en az Seviye ${MIN_LEVEL_FOR_SORA_COLLECTION} olmalısınız.`);
      setMintingId(null);
      return;
    }

    // Yeterli yıldız var mı kontrol et
    if (userStars < selectedNft.price_stars) {
      setError(`Bu NFT'yi almak için yeterli yıldızınız yok. Gereken: ${selectedNft.price_stars} ⭐`);
      setMintingId(null);
      return;
    }

    // API çağrısı yap
    try {
      const result = await buyNft(nftId);
      
      // NFT'yi güncelle (satın alındı olarak işaretle)
      setNfts(prevNfts =>
        prevNfts.map(nft =>
          nft.id === nftId ? { ...nft, is_owned: true } : nft
        )
      );
      
      // Yıldızları güncelle (API'den dönen değer)
      setUserStars(result.remaining_stars);
      
      // Başarı mesajı göster
      // setSuccessMessage(result.message);
    } catch (err: any) {
      console.error(`NFT satın alınırken hata:`, err);
      setError(err.message || `NFT #${nftId} alınamadı. Lütfen tekrar deneyin.`);
    } finally {
      setMintingId(null); // Satın alma işlemi tamamlandı
    }
  };

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
          {/* Standart NFT'ler */}
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-text flex items-center">
              <Gem className="mr-2" size={20} />
              Standart Koleksiyon
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {standardNfts.map((nft) => (
                <NFTKarti
                  key={nft.id}
                  nft={nft}
                  onBuy={handleMint}
                  isBuying={mintingId === nft.id}
                  showPrice={true}
                  showActions={true}
                  userStars={userStars}
                />
              ))}
            </div>
          </div>

          {/* Sora Özel Koleksiyonu */}
          <div className="pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div className="mb-2 sm:mb-0">
                <h2 className="text-xl font-bold text-text flex items-center">
                  <Star className="mr-2 text-yellow-500" size={20} />
                  Sora Koleksiyonu (Elit)
                </h2>
                <p className="text-textSecondary text-sm mt-1">
                  Özel yapay zeka tarafından oluşturulmuş nadir NFT'ler
                </p>
              </div>
              
              <div className="flex items-center text-sm px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                {canAccessSoraCollection ? (
                  <>
                    <CheckCircle size={14} className="mr-1.5" />
                    <span>Erişiminiz var</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} className="mr-1.5" />
                    <span>Seviye {MIN_LEVEL_FOR_SORA_COLLECTION}'te açılır</span>
                  </>
                )}
              </div>
            </div>

            {/* Bilgi Kartı */}
            {!canAccessSoraCollection && (
              <div className="mb-6 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-center text-sm text-amber-600">
                <Info size={18} className="mr-2 flex-shrink-0" />
                <p>
                  Bu elit NFT'lere şu anda sadece göz atabilirsiniz. 
                  <strong className="ml-1">Seviye {MIN_LEVEL_FOR_SORA_COLLECTION}'e</strong> ulaştığınızda satın alabilirsiniz. 
                  Görevleri tamamlayarak seviyenizi yükseltebilirsiniz!
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {soraNfts.map((nft) => (
                <div key={nft.id} className="relative group">
                  {/* Elit NFT için parlayan çerçeve (Seviyesi yeterliyse daha parlak) */}
                  <div 
                    className={`absolute -inset-1 rounded-lg blur-sm opacity-50 group-hover:opacity-80 transition duration-500 group-hover:duration-200 ${
                      canAccessSoraCollection 
                        ? 'bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500' 
                        : 'bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400'
                    }`}
                  ></div>
                  
                  <div className="relative">
                    {/* Yıldız rozeti */}
                    <div className="absolute -top-3 -right-3 z-10">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full shadow-lg ${
                        canAccessSoraCollection 
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-400' 
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}>
                        <Star size={12} className="text-white" />
                      </span>
                    </div>
                    
                    {/* Seviye kilidi (eğer gerekli seviyede değilse) */}
                    {!canAccessSoraCollection && (
                      <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center rounded-lg text-white backdrop-blur-[1px]">
                        <Lock size={28} className="mb-2 text-amber-400" />
                        <p className="text-center font-semibold text-sm px-2">
                          Seviye {MIN_LEVEL_FOR_SORA_COLLECTION}'te kilit açılır
                        </p>
                      </div>
                    )}
                    
                    <NFTKarti
                      nft={nft}
                      onBuy={handleMint}
                      isBuying={mintingId === nft.id}
                      showPrice={true}
                      showActions={true}
                      userStars={userStars}
                      disabled={!canAccessSoraCollection} // Seviyesi yeterli değilse buton devre dışı
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Galeri; 