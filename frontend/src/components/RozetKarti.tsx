import React, { useState } from 'react';
import { UserBadge } from '../types'; // Gerekli tipi import et

interface RozetKartiProps {
  badge: UserBadge;
  className?: string;
}

const RozetKarti: React.FC<RozetKartiProps> = ({ badge, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Açıklama backend'den gelmiyorsa UserBadge yerine Badge tipi gerekebilir
  // veya UserBadge'e açıklama eklenmeli. Şimdilik sadece isim gösteriliyor.
  const description = badge.badge_name; // Varsayılan olarak ismi tooltip yapalım
  
  const openModal = () => {
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
  };

  // Görsel hata işleme
  const handleImageError = () => {
    console.error(`Rozet resmi yüklenemedi: ${badge.badge_image_url} (${badge.badge_name})`);
    setImageError(true);
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)} // Mobil için dokunma
      onTouchEnd={() => setShowTooltip(false)}   // Mobil için bırakma
      onClick={openModal}
    >
      {imageError ? (
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-surface flex items-center justify-center border-2 border-secondary
                text-2xl shadow-lg transition-transform duration-200 hover:scale-110 cursor-pointer">
          🏆
        </div>
      ) : (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full opacity-75 group-hover:opacity-100 blur-sm group-hover:blur transition-all duration-500"></div>
          <img
            src={badge.badge_image_url}
            alt={badge.badge_name}
            className="relative w-12 h-12 md:w-16 md:h-16 rounded-full object-contain bg-surface/20 backdrop-blur-sm shadow-lg border-2 border-secondary/50
                     transition-all duration-300 hover:scale-110 cursor-pointer z-10"
            onError={handleImageError}
          />
        </div>
      )}
      
      {/* Tooltip: UnoCSS transition ile */}
      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5
                    bg-surface/80 backdrop-blur-sm text-text text-xs font-medium rounded-md shadow-lg z-10 whitespace-nowrap
                    transition-all duration-200 ease-in-out ${showTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}>
        {description}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0
                      border-l-4 border-l-transparent border-r-4 border-r-transparent
                      border-t-4 border-t-surface/80"></div> {/* Tooltip oku */}
      </div>
      
      {/* Rozet Detay Modalı */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4 backdrop-blur-sm" 
             onClick={closeModal}>
          <div className="relative bg-surface/90 backdrop-blur-xl rounded-xl max-w-md w-full p-6 shadow-xl border border-primary/20" 
               onClick={(e) => e.stopPropagation()}>
            {/* Dekoratif elementler */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-xl pointer-events-none"></div>
            
            {/* Kapat düğmesi */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className="flex flex-col items-center text-center z-10 relative">
              {imageError ? (
                <div className="w-32 h-32 rounded-full bg-surface flex items-center justify-center border-4 border-secondary mb-4 text-4xl">
                  🏆
                </div>
              ) : (
                <div className="relative mb-4 group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full opacity-75 blur-md animate-pulse"></div>
                  <img 
                    src={badge.badge_image_url} 
                    alt={badge.badge_name}
                    className="relative w-32 h-32 rounded-full object-contain bg-surface/20 backdrop-blur-sm shadow-lg border-2 border-secondary/50 z-10"
                    onError={handleImageError}
                  />
                </div>
              )}
              
              <h3 className="text-xl font-bold text-text mb-2">{badge.badge_name}</h3>
              
              <div className="text-text-secondary text-sm mb-4">
                {"Bu rozetin açıklaması henüz eklenmemiş."}
              </div>
              
              <div className="w-full bg-background/40 backdrop-blur-sm rounded-lg p-4 mt-2 border border-primary/10">
                <h4 className="text-text font-semibold mb-2">Rozet Bilgileri</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-text-secondary">Kazanıldı:</div>
                  <div className="text-right">{new Date(badge.earned_at || Date.now()).toLocaleDateString('tr-TR')}</div>
                  
                  <div className="text-text-secondary">Özel Rozet:</div>
                  <div className="text-right">{"Bilgi yok"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RozetKarti; 