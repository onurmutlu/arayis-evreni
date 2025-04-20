import React, { useState, useRef, useEffect } from 'react';
import { Nft } from '../types';

interface NftCardProps {
  nft: Nft;
  isOwned?: boolean;
  onBuy?: (nft: Nft) => void;
  onMint?: (nft: Nft) => void;
  buyLoading?: boolean;
  mintLoading?: boolean;
}

const NftCard: React.FC<NftCardProps> = ({ 
  nft, 
  isOwned = false, 
  onBuy, 
  onMint, 
  buyLoading = false,
  mintLoading = false
}) => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // NFT dosya adı düzeltmesi - varyasyon numarası eklemesi
  const fixNftFilePath = (path: string | undefined): string => {
    if (!path) return '/placeholder-image.png';
    
    if (path.startsWith('http')) return path;
    
    if (path.startsWith('/assets/nft/')) {
      // Zaten varyasyon numarası var mı kontrol et
      if (path.match(/NFT-[a-zA-Z]+-\d+\.mp4$/)) {
        return `${import.meta.env.BASE_URL}${path.substring(1)}`;
      }
      
      // Varyasyon numarası yoksa, rastgele 1-4 arası ekle
      const variantNum = Math.floor(Math.random() * 4) + 1;
      const pathWithoutExt = path.replace('.mp4', '');
      return `${import.meta.env.BASE_URL}${pathWithoutExt.substring(1)}-${variantNum}.mp4`;
    }
    
    return '/placeholder-image.png';
  };

  // Video URL'sinden image URL'sini temizle (.mp4 uzantısı olmadan)
  const cleanImageUrl = (videoUrl: string | undefined): string => {
    if (!videoUrl) return '/placeholder-image.png';
    if (videoUrl.includes('arayis-evreni.siyahkare.com')) {
      // Video URL'si varsa thumbnail oluştur (mp4 uzantısını jpg ile değiştir)
      return videoUrl.replace('.mp4', '.jpg');
    }
    return videoUrl.replace('.mp4', '');
  };

  // Videodan küçük resim oluştur
  const generateThumbnail = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        
        // Video yüklendiğinde ilk kareyi al
        const handleVideoLoad = () => {
          if (video) {
            // Video zaman damgasını ilk kareye ayarla
            video.currentTime = 0.1;
            
            // Zaman damgası ayarlandığında canvas'a çiz
            video.addEventListener('seeked', function handleSeeked() {
              try {
                // Canvas oluştur
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // Canvas'a videoyu çiz
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  
                  // Canvas'ı data URL'ye dönüştür
                  const dataUrl = canvas.toDataURL('image/jpeg');
                  setThumbnailUrl(dataUrl);
                }
                
                // Event listener'ı temizle
                video.removeEventListener('seeked', handleSeeked);
              } catch (error) {
                console.error('Küçük resim oluşturulurken hata:', error);
              }
            });
          }
        };
        
        if (video.readyState >= 2) {
          // Video zaten yüklendiyse
          handleVideoLoad();
        } else {
          // Video henüz yüklenmediyse
          video.addEventListener('loadeddata', handleVideoLoad);
        }
      } catch (error) {
        console.error('Video işlenirken hata:', error);
      }
    }
  };

  // Video yüklendiğinde küçük resim oluştur
  useEffect(() => {
    if (nft.video_url && nft.video_url !== '/placeholder-image.png') {
      const timeoutId = setTimeout(generateThumbnail, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [nft.video_url]);

  // Sideeffect: Video modalı kapandığında videoyu durdur
  useEffect(() => {
    if (!showVideoModal && videoRef.current) {
      videoRef.current.pause();
    }
  }, [showVideoModal]);

  const imageUrl = nft.image_url || (nft.video_url ? cleanImageUrl(nft.video_url) : '/placeholder-image.png');
  const videoUrl = fixNftFilePath(nft.video_url);
  
  // Video modalı aç
  const openVideoModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoError(false);  // Hata durumunu sıfırla
    setShowVideoModal(true);
  };
  
  // Video modalı kapat
  const closeVideoModal = () => {
    setShowVideoModal(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };
  
  // Video hata kontrol
  const handleVideoError = () => {
    console.error("Video yüklenirken hata oluştu:", videoUrl);
    setVideoError(true);
  };

  // Sınıfları birleştiren yardımcı fonksiyon
  const classNames = (...classes: (string | undefined)[]) => {
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div className={classNames("relative group overflow-hidden rounded-lg", nft.className)}>
      {/* NFT Thumbnail */}
      <div 
        className="relative cursor-pointer"
        onClick={openVideoModal}
      >
        <div style={{ position: 'relative', paddingBottom: '100%', width: '100%' }}>
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={nft.name}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              className="rounded-lg hover:scale-105 transition-transform duration-300"
            />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={nft.name}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              className="rounded-lg hover:scale-105 transition-transform duration-300"
              onError={() => console.error("Resim yüklenirken hata oluştu:", imageUrl)}
            />
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                 className="bg-gray-200 flex items-center justify-center rounded-lg">
              <span className="text-gray-500">NFT Görseli</span>
            </div>
          )}
          
          {/* Play button göster */}
          {nft.video_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-purple-600">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Rarity Badge */}
        {nft.rarity && (
          <div className={classNames("absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold", nft.rarityClass)}>
            {nft.rarity}
          </div>
        )}

        {/* Owned Badge */}
        {isOwned && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold bg-blue-500 text-white">
            Sahipsin
          </div>
        )}

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2 text-white">
          <h3 className="text-sm font-semibold truncate">{nft.name}</h3>
        </div>
      </div>
      
      {/* Video Modal - Tam Ekran */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" 
             onClick={closeVideoModal}>
          <div className="relative w-full max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Kapat düğmesi */}
            <button 
              onClick={closeVideoModal}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black bg-opacity-70 text-white hover:bg-opacity-90 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            {videoUrl && !videoError ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[90vh] w-full"
                onError={handleVideoError}
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gray-900 text-white">
                <p>Video yüklenirken bir hata oluştu.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buy Button */}
      {!isOwned && onBuy && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBuy(nft);
          }}
          disabled={buyLoading}
          className="mt-2 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
        >
          {buyLoading ? "Satın Alınıyor..." : `${nft.price_stars} ✦ ile Satın Al`}
        </button>
      )}

      {/* Mint Button - TON'a çevirme */}
      {isOwned && nft.is_owned && !nft.is_minted && onMint && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMint(nft);
          }}
          disabled={mintLoading}
          className="mt-2 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-2 rounded-md hover:from-amber-600 hover:to-yellow-600 transition-all duration-300"
        >
          {mintLoading ? "TON'a Çevriliyor..." : "TON'a Çevir"}
        </button>
      )}
    </div>
  );
};

export default NftCard; 