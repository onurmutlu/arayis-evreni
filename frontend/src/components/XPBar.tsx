import React from 'react';

interface XPBarProps {
  // Eski arayüz
  currentXp?: number;
  xpForNextLevel?: number;
  level?: number;
  
  // Yeni özellik: Doğrudan ilerleme yüzdesi (0-100 arası)
  progress?: number;
  
  // Diğer seçenekler
  className?: string;
}

// Seviyeye göre renk geçişi (örnek)
const levelColors = [
  'from-gray-500 to-gray-400',       // Level 1-5
  'from-blue-500 to-blue-400',       // Level 6-10
  'from-purple-500 to-purple-400',   // Level 11-15 (primary)
  'from-amber-500 to-amber-400',     // Level 16-20 (xpBar)
  'from-red-500 to-red-400',         // Level 21+ (error)
];

const getLevelColor = (level: number) => {
  if (level <= 5) return levelColors[0];
  if (level <= 10) return levelColors[1];
  if (level <= 15) return levelColors[2];
  if (level <= 20) return levelColors[3];
  return levelColors[4];
};

const XPBar: React.FC<XPBarProps> = ({ 
  currentXp, 
  xpForNextLevel, 
  level = 1, 
  progress: directProgress, 
  className = '' 
}) => {
  // İki modda da çalışabilir: doğrudan progress ya da XP hesaplamalı
  let progress = 0;
  let barColor = 'from-primary to-secondary';
  
  if (directProgress !== undefined) {
    // Doğrudan progress değeri gelirse onu kullan
    progress = Math.min(Math.max(0, directProgress), 100);
  } else if (currentXp !== undefined && xpForNextLevel !== undefined) {
    // XP değerlerinden progress hesapla
    progress = xpForNextLevel > 0 ? Math.min((currentXp / xpForNextLevel) * 100, 100) : 0;
  }
  
  // Seviye varsa renk değiştir
  if (level !== undefined) {
    barColor = getLevelColor(level);
  }

  return (
    <div className={`w-full ${className}`}>
      {/* XP bilgisi verilmişse seviye göstergesini göster */}
      {currentXp !== undefined && xpForNextLevel !== undefined && level !== undefined && (
        <div className="flex justify-between items-center mb-1 text-sm font-medium text-textSecondary">
          <span>Seviye {level}</span>
          <span>{currentXp} / {xpForNextLevel} XP</span>
        </div>
      )}
      
      <div className="w-full bg-surface rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${barColor} transition-all duration-500 ease-out shadow-md`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default XPBar; 