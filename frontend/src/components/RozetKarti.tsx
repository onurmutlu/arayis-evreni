import React, { useState } from 'react';
import { UserBadge } from '../types'; // Gerekli tipi import et

interface RozetKartiProps {
  badge: UserBadge;
  className?: string;
}

const RozetKarti: React.FC<RozetKartiProps> = ({ badge, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Açıklama backend'den gelmiyorsa UserBadge yerine Badge tipi gerekebilir
  // veya UserBadge'e açıklama eklenmeli. Şimdilik sadece isim gösteriliyor.
  const description = badge.badge_name; // Varsayılan olarak ismi tooltip yapalım

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)} // Mobil için dokunma
      onTouchEnd={() => setShowTooltip(false)}   // Mobil için bırakma
    >
      <img
        src={badge.badge_image_url}
        alt={badge.badge_name}
        className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover bg-surface shadow-lg border-2 border-secondary
                   transition-transform duration-200 hover:scale-110 cursor-pointer"
      />
      {/* Tooltip: UnoCSS transition ile */}
      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5
                    bg-surface text-text text-xs font-medium rounded-md shadow-lg z-10 whitespace-nowrap
                    transition-opacity duration-200 ease-in-out ${showTooltip ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {description}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0
                      border-l-4 border-l-transparent border-r-4 border-r-transparent
                      border-t-4 border-t-surface"></div> {/* Tooltip oku */}
      </div>
    </div>
  );
};

export default RozetKarti; 