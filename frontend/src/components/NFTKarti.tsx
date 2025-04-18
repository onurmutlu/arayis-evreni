import React, { useState } from 'react';
import { Star, Lock, Gem, CheckCircle, Loader2, Share, X } from 'lucide-react';
import { Nft } from '../types';
import { triggerHapticFeedback } from '../utils/hapticFeedback';

interface NFTKartiProps {
  nft: Nft;
  isOwned: boolean;
  onMint: () => void;
  isMinting: boolean;
  userStars: number;
}

const NFTKarti: React.FC<NFTKartiProps> = ({ nft, isOwned, onMint, isMinting, userStars }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const canAfford = userStars >= (nft.price_stars || 0);
  
  const openVideoModal = () => {
    if (nft.video_url) {
      setShowVideoModal(true);
      setVideoError(false);
      triggerHapticFeedback('medium');
    }
  };
  
  const closeVideoModal = () => {
    setShowVideoModal(false);
    triggerHapticFeedback('light');
  };

  const renderVideo = () => {
    if (nft.image_url && nft.image_url.endsWith('.mp4')) {
      return (
        <video 
          className="rounded-t-xl w-full h-48 object-cover transform transition-transform duration-500 hover:scale-105"
          src={nft.image_url} 
          autoPlay={isHovered}
          loop 
          muted 
          playsInline
        />
      );
    } else {
      return (
        <img 
          className="rounded-t-xl w-full h-48 object-cover transform transition-transform duration-500 hover:scale-105"
          src={nft.image_url || '/placeholder-image.png'} 
          alt={nft.name}
        />
      );
    }
  };
  
  return (
    <div 
      className="bg-surface rounded-xl overflow-hidden shadow-lg border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative" onClick={nft.video_url ? openVideoModal : undefined} 
           style={nft.video_url ? {cursor: 'pointer'} : undefined}>
        {renderVideo()}
        
        {nft.video_url && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-primary rounded-full p-2 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
          </div>
        )}
        
        {/* Rozet göster - Owned */}
        {isOwned && (
          <div className="absolute top-2 right-2 bg-success/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow-md backdrop-blur-sm flex items-center">
            <CheckCircle size={12} className="mr-1" />
            Sahipsin
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{nft.name}</h3>
          <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
            #{nft.id}
          </div>
        </div>
        
        <p className="text-textSecondary text-sm mb-4 line-clamp-2 h-10">
          {nft.description}
        </p>
        
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center text-amber-400 font-medium">
            <Star className="fill-amber-400 stroke-amber-400 mr-1" size={16} />
            <span>{nft.price_stars || '-'}</span>
          </div>
          
          {isOwned ? (
            <button 
              onClick={(e) => {
                e.preventDefault();
                triggerHapticFeedback('success');
              }}
              className="bg-success/20 text-success border border-success/30 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center"
            >
              <CheckCircle size={16} className="mr-1.5" />
              Sahipsin
            </button>
          ) : isMinting ? (
            <button className="bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center cursor-wait">
              <Loader2 size={16} className="mr-1.5 animate-spin" />
              İşleniyor...
            </button>
          ) : !canAfford ? (
            <button 
              disabled
              className="bg-muted/50 text-textSecondary px-3 py-1.5 rounded-lg text-sm font-medium flex items-center cursor-not-allowed border border-border"
            >
              <Lock size={16} className="mr-1.5" />
              Yetersiz Stars
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.preventDefault();
                onMint();
                triggerHapticFeedback('medium');
              }}
              className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm"
            >
              <Gem size={16} className="mr-1.5" />
              Satın Al
            </button>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
          <div className="text-xs text-textSecondary">
            {nft.category}
          </div>
          <button 
            onClick={() => {
              triggerHapticFeedback('light');
              // Paylaşma işlemi
            }}
            className="text-textSecondary hover:text-primary p-1 rounded transition-colors"
          >
            <Share size={16} />
          </button>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative bg-surface rounded-xl overflow-hidden shadow-2xl w-full max-w-3xl">
            <button 
              onClick={closeVideoModal}
              className="absolute top-3 right-3 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 transition-all z-10"
            >
              <X size={24} />
            </button>
            
            <div className="w-full">
              {videoError ? (
                <div className="w-full h-72 sm:h-96 flex items-center justify-center bg-surface-dark">
                  <div className="text-center p-4">
                    <div className="text-error mb-2">Video yüklenemedi</div>
                    <div className="text-textSecondary text-sm">Video dosyası şu anda mevcut değil veya yüklenirken bir hata oluştu.</div>
                  </div>
                </div>
              ) : (
                <video 
                  className="w-full h-auto"
                  src={nft.video_url}
                  controls
                  autoPlay
                  onError={() => setVideoError(true)}
                />
              )}
            </div>
            
            <div className="p-4 border-t border-border">
              <h3 className="font-semibold text-lg">{nft.name}</h3>
              <p className="text-textSecondary mt-2">{nft.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTKarti; 