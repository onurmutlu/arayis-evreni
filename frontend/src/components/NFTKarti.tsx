import React from 'react';
import { Nft, NFTCategory } from '../types';
import Buton from './Buton';

interface NFTKartiProps {
  nft: Nft;
  onBuy?: (nftId: number) => Promise<void>; // Satın alma fonksiyonu (opsiyonel, market için)
  onClaim?: (nftId: number) => Promise<void>; // Claim etme fonksiyonu (opsiyonel, NftClaim sayfası için)
  onMint?: (nftId: number) => Promise<void>; // Mint fonksiyonu (opsiyonel)
  isBuying?: boolean;
  isClaiming?: boolean;
  isMinting?: boolean;
  showPrice?: boolean; // Fiyatı göster/gizle (Galeri vs Market)
  showActions?: boolean; // Butonları göster/gizle
  userStars?: number; // Kullanıcının yıldız sayısı (satın alma/claim kontrolü için)
  disabled?: boolean; // Tüm eylemleri devre dışı bırakmak için (örn: elit NFT'lere erişim kısıtlaması)
}

const NFTKarti: React.FC<NFTKartiProps> = ({
  nft,
  onBuy,
  onClaim,
  onMint,
  isBuying,
  isClaiming,
  isMinting,
  showPrice = true,
  showActions = true,
  userStars = 0,
  disabled = false
}) => {
  const isLoading = isBuying || isClaiming || isMinting;
  // Claim etme maliyeti 0 olabilir veya NFT'nin kendi fiyatı olabilir.
  // Şimdilik NFT fiyatını baz alalım.
  const canAfford = userStars >= (nft.price_stars ?? 0); // price_stars null ise 0 kabul et

  const handleBuy = () => onBuy && !isLoading && !disabled && onBuy(nft.id);
  const handleClaim = () => onClaim && !isLoading && !disabled && canAfford && onClaim(nft.id);
  const handleMint = () => onMint && !isLoading && !disabled && onMint(nft.id);

  const renderMedia = () => {
    if (nft.video_url && nft.category === NFTCategory.SORA_VIDEO) {
      return (
        <video
          src={nft.video_url}
          className="w-full h-40 object-cover rounded-t-lg bg-black"
          autoPlay
          muted
          loop
          playsInline // iOS için önemli
        />
      );
    }
    if (nft.image_url) {
      return (
        <img
          src={nft.image_url}
          alt={nft.name}
          className="w-full h-40 object-cover rounded-t-lg bg-surface"
          loading="lazy" // Lazy loading
        />
      );
    }
    // Placeholder eğer medya yoksa
    return <div className="w-full h-40 bg-surface rounded-t-lg flex items-center justify-center text-textSecondary text-sm">Medya Yok</div>;
  };

  const renderActionButtons = () => {
      if (!showActions) return null;

      // Claim edilebilir durumda mı? (NftClaim sayfasında)
      if (nft.is_claimable && onClaim) {
          const claimPrice = nft.price_stars ?? 0; // Claim maliyeti (0 veya NFT fiyatı olabilir)
          const userCanAffordClaim = userStars >= claimPrice;
          return (
              <Buton
                  size="sm"
                  fullWidth
                  onClick={handleClaim}
                  disabled={isLoading || !userCanAffordClaim || disabled}
                  isLoading={isClaiming}
                  variant={userCanAffordClaim && !disabled ? 'secondary' : 'ghost'}
              >
                  {isClaiming ? 'Claim Ediliyor...' : userCanAffordClaim ? `Claim Et ${claimPrice > 0 ? `(${claimPrice} ⭐)`: ''}` : `Yetersiz Yıldız ${claimPrice > 0 ? `(${claimPrice} ⭐)`: ''}`}
              </Buton>
          );
      }

      // Satın alınabilir durumda mı? (Market sayfasında - henüz yok)
      if (nft.is_active && !nft.is_owned && onBuy) {
           return (
               <Buton
                   size="sm"
                   fullWidth
                   onClick={handleBuy}
                   disabled={isLoading || !canAfford || disabled}
                   isLoading={isBuying}
                   variant={canAfford && !disabled ? 'primary' : 'ghost'}
               >
                   {isBuying ? 'Alınıyor...' : canAfford ? `Satın Al (${nft.price_stars} ⭐)` : `Yetersiz Yıldız (${nft.price_stars} ⭐)`}
               </Buton>
           );
      }

       // Sahip olunan ve TON'da mint edilebilir durumda mı? (TonWallet sayfasında)
       if (nft.is_owned && nft.mintable && !nft.is_minted && onMint) {
           return (
               <Buton
                   size="sm"
                   fullWidth
                   onClick={handleMint}
                   disabled={isLoading || disabled}
                   isLoading={isMinting}
                   variant="secondary"
               >
                   {/* Apostrof sorununu önlemek için template literal kullanıldı */}
                   {isMinting ? 'Mint Ediliyor...' : `TON'da Mint Et`}
               </Buton>
           );
       }

       // Sahip olunan ve zaten TON'da mint edilmiş (TonWallet içinde gösterilir)
       if (nft.is_owned && nft.is_minted && onMint) {
            return <p className="text-xs text-success text-center font-medium py-1">✅ TON'da Mint Edildi</p>
       }

       // Sahip olunan ve claim edilmiş/satın alınmış (ama TON'da mint edilemez veya mint butonu bu context'te gösterilmiyor)
        if (nft.is_owned && !onMint) {
             // Mint edilmişse farklı, edilmemişse farklı etiket gösterilebilir.
             if(nft.is_minted) {
                return <p className="text-xs text-success text-center font-medium py-1">✅ Mint Edildi</p>
             } else if (nft.mintable) {
                 return <p className="text-xs text-amber-400 text-center font-medium py-1">Mint Edilebilir</p>
             } else {
                return <p className="text-xs text-secondary text-center font-medium py-1">Galeride</p>
             }
        }


      return null; // Başka durum yoksa buton gösterme
  }

  return (
    <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-transparent hover:border-secondary transition-all duration-300 group transform hover:-translate-y-1 hover:shadow-secondary/30 flex flex-col">
      {renderMedia()}
      <div className="p-3 flex flex-col gap-2 flex-grow">
        <h4 className="font-semibold text-base text-text truncate" title={nft.name}>
          {nft.name}
        </h4>

        {showPrice && !nft.is_owned && (
             <div className="text-sm font-medium text-amber-400 mt-1">
               Fiyat: {nft.price_stars} ⭐
             </div>
        )}

        <div className="mt-auto pt-2">
            {renderActionButtons()}
        </div>
      </div>
    </div>
  );
};

export default NFTKarti; 