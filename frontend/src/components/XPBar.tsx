import React from 'react';

interface XPBarProps {
  currentXp: number;
  xpForNextLevel: number;
  level: number;
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

const XPBar: React.FC<XPBarProps> = ({ currentXp, xpForNextLevel, level, className = '' }) => {
  // Geçerli bir değer olduğundan emin ol, 0'a bölmeyi engelle
  const progress = xpForNextLevel > 0 ? Math.min((currentXp / xpForNextLevel) * 100, 100) : 0;
  const barColor = getLevelColor(level);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1 text-sm font-medium text-textSecondary">
        <span>Seviye {level}</span>
        <span>{currentXp} / {xpForNextLevel} XP</span>
      </div>
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