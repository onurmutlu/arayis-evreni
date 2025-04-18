import React, { useState } from 'react';
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

  const imageUrl = fixNftFilePath(nft.image_url);
  const videoUrl = fixNftFilePath(nft.video_url);
  
  // Video modalı açma işlevi
  const openVideoModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowVideoModal(true);
  };
  
  // Video modalı kapatma işlevi
  const closeVideoModal = () => {
    setShowVideoModal(false);
  };

  return (
    <>
      <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 hover:shadow-xl transition-all">
        <div className="h-48 relative overflow-hidden cursor-pointer" onClick={openVideoModal}>
          {videoUrl && videoUrl !== '/placeholder-image.png' ? (
            <video 
              src={videoUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              onError={(e) => {
                const target = e.target as HTMLVideoElement;
                target.style.display = 'none';
                // Video yüklenemezse, resmi göster
                const imgElement = document.createElement('img');
                imgElement.src = '/placeholder-image.png';
                imgElement.className = 'w-full h-full object-cover';
                target.parentNode?.appendChild(imgElement);
              }}
            />
          ) : (
            <img 
              src={imageUrl} 
              alt={nft.name} 
              className="w-full h-full object-cover"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/placeholder-image.png';
              }}
            />
          )}
          
          {isOwned && (
            <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md">
              Sahipsin
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <div className="text-white font-bold truncate">{nft.name}</div>
          </div>
          
          {/* Play butonu ekle */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-black/60 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="text-sm text-gray-300 h-12 overflow-hidden">{nft.description}</div>
          
          <div className="flex justify-between items-center mt-3">
            <div className="text-yellow-400 font-bold">{nft.price_stars} ⭐</div>
            <div className="text-xs text-gray-400">{nft.category}</div>
          </div>
          
          <div className="mt-4 flex gap-2">
            {!isOwned && onBuy && (
              <button
                onClick={() => onBuy(nft)}
                disabled={buyLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {buyLoading ? 'Satın Alınıyor...' : 'Satın Al'}
              </button>
            )}
            
            {isOwned && nft.mintable && onMint && (
              <button
                onClick={() => onMint(nft)}
                disabled={mintLoading}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {mintLoading ? 'Mint Ediliyor...' : 'Mint Et'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={closeVideoModal}>
          <div className="bg-gray-900 rounded-xl overflow-hidden max-w-4xl w-full max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-2 right-2 z-10">
              <button 
                onClick={closeVideoModal} 
                className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <video 
              src={videoUrl} 
              className="w-full max-h-[calc(80vh-6rem)] object-contain"
              controls 
              autoPlay 
              loop
              onError={() => {
                closeVideoModal();
                alert('Video yüklenirken bir hata oluştu.');
              }}
            />
            
            <div className="p-4 bg-gray-900">
              <h3 className="text-xl font-bold text-white mb-2">{nft.name}</h3>
              <p className="text-gray-300">{nft.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NftCard; 