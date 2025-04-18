import React from 'react';
import { Mission } from '../types';
import Buton from './Buton';
import { Lock, Gem, Nfc, Clock, CheckCircle, ArrowRight, Star, Award, Badge, Heart, ShieldCheck, Building, Swords, Zap, AlertTriangle, Info } from 'lucide-react';

interface GorevKartiProps {
  mission: Mission;
  onComplete: (missionId: number) => void;
  isCompleting: boolean;
}

// Görev kategorilerine göre simgeler
const categoryIcons: Record<string, React.ElementType> = {
  flört: Heart,
  analiz: Info,
  mesaj: ArrowRight,
  davet: Award,
  diğer: Zap,
  general: Info,
  default: Zap,
};

// Zaman biçimlendirme yardımcı işlevi
const formatCooldown = (endTimeISOString: string): string => {
  const endTime = new Date(endTimeISOString);
  const now = new Date();
  
  // Kalan süre (milisaniye)
  const diffMs = endTime.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Hazır';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours} saat${diffMinutes > 0 ? ` ${diffMinutes} dk` : ''}`;
  } else {
    return `${diffMinutes} dakika`;
  }
};

const GorevKarti: React.FC<GorevKartiProps> = ({ mission, onComplete, isCompleting }) => {
  // Görevin kilitli olup olmadığını belirle
  // Kilitli: Cooldown'da VEYA tamamlanmış ve tek seferlik (cooldown 0 saat)
  const isLocked = mission.is_on_cooldown || (mission.is_completed && mission.cooldown_hours === 0);

  // Cooldown bitiş zamanını hesapla (formatCooldown için)
  const cooldownEndTime = mission.is_on_cooldown && mission.last_completed_at
      ? new Date(new Date(mission.last_completed_at).getTime() + (mission.cooldown_hours || 0) * 3600 * 1000).toISOString()
      : undefined;
      
  // Kategori ikonunu belirle
  const CategoryIcon = categoryIcons[mission.category || mission.mission_type || 'default'] || Zap;

  const handleCompleteClick = () => {
    if (!isLocked && !isCompleting) {
      onComplete(mission.id);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-surface to-surface/60 border border-white/5">
      {/* Başlık Kısmı */}
      <div className="p-4 relative">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg bg-primary/15 ${isLocked ? 'opacity-50' : ''}`}>
            <CategoryIcon size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-md font-semibold text-white truncate" title={mission.title}>
                {mission.title}
              </h3>
              <div className="flex items-center gap-1.5 flex-shrink-0"> 
                {mission.is_vip && <Gem size={16} className="text-amber-400" aria-label="VIP Görev"/>} 
                {mission.required_nft_id && <Nfc size={16} className="text-cyan-400" aria-label="NFT Gerekli"/>} 
              </div>
            </div>
            <p className="text-sm text-gray-300 line-clamp-2 mt-1.5">{mission.description}</p>
          </div>
        </div>

        {/* Durum Göstergesi - Kilitli, Süre, vb. */}
        {isLocked && mission.is_completed && mission.cooldown_hours === 0 && (
          <div className="absolute top-3 right-3 bg-success/80 text-white px-2 py-1 rounded-full text-xs font-medium shadow-md backdrop-blur-sm flex items-center">
            <CheckCircle size={12} className="mr-1" />
            Tamamlandı
          </div>
        )}
        
        {isLocked && mission.is_on_cooldown && cooldownEndTime && (
          <div className="absolute top-3 right-3 bg-primary/80 text-white px-2 py-1 rounded-full text-xs font-medium shadow-md backdrop-blur-sm flex items-center">
            <Clock size={12} className="mr-1" />
            {formatCooldown(cooldownEndTime)}
          </div>
        )}
      </div>
      
      {/* Alt bilgi ve ödüller */}
      <div className="px-4 py-3 bg-black/30 border-t border-white/5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            {/* XP ödülü */}
            <div className="flex items-center text-yellow-400 font-bold">
              <Star size={16} className="fill-yellow-400 mr-1" />
              {mission.xp_reward} XP
            </div>
            
            {/* Rozet ödülü (varsa) */}
            {mission.badge_reward && (
              <div className="flex items-center text-amber-400 font-medium">
                <Award size={16} className="mr-1" />
                Rozet
              </div>
            )}
          </div>
          
          {/* Tamamlanabilirlik durumu */}
          {!isLocked && (
            <div className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
              <Badge size={12} className="inline mr-1" />
              Yapılabilir
            </div>
          )}
        </div>
        
        {/* Tamamlama Butonu */}
        <button
          onClick={handleCompleteClick}
          disabled={isLocked || isCompleting}
          className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center
            ${isLocked 
              ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' 
              : 'bg-primary text-white hover:bg-primary-dark'
            } ${isCompleting ? 'animate-pulse' : ''}`}
        >
          {isCompleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Tamamlanıyor...
            </>
          ) : isLocked ? (
            <>
              <Lock size={16} className="mr-2" />
              {mission.is_on_cooldown ? "Bekleme Süresi" : "Tamamlandı"}
            </>
          ) : (
            <>
              <Swords size={16} className="mr-2" />
              Görevi Tamamla
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GorevKarti; 