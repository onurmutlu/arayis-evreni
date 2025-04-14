import React from 'react';
import { Mission } from '../types';
import Buton from './Buton';
import { Lock, Gem, Nfc, Clock, CheckCircle, ArrowRight, Star, Award, Badge, Heart, ShieldCheck, Building, Swords, Zap, AlertTriangle, Info } from 'lucide-react';

interface GorevKartiProps {
  mission: Mission;
  onComplete: (missionId: number) => void;
  isCompleting: boolean;
}

// Görev kategorilerine göre ikon belirle
const categoryIcons: Record<string, React.ElementType> = {
  flirt: Heart,
  dao: ShieldCheck,
  guardian: Swords,
  city: Building,
  general: Info,
  default: Zap
};

// Cooldown süresini okunabilir formata çeviren yardımcı fonksiyon
const formatCooldown = (endDateStr?: string): string => {
  if (!endDateStr) return '';
  const endDate = new Date(endDateStr);
  const now = new Date();
  const diffSeconds = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000));

  if (diffSeconds === 0) return 'Hazır!';

  const days = Math.floor(diffSeconds / (3600 * 24));
  const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  let remaining = '';
  if (days > 0) remaining += `${days}g `;
  if (hours > 0) remaining += `${hours}s `;
  if (minutes > 0 && days === 0) remaining += `${minutes}d `; // Gün yoksa dakika göster
  // Saniye göstermek yerine en az 1d diyelim?
  if (remaining.trim() === '' && diffSeconds > 0) remaining = '~1d';
  // if (seconds > 0 && days === 0 && hours === 0) remaining += `${seconds}sn`; // Sadece saniye kaldıysa

  return remaining.trim() + ' kaldı';
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
    <div
      className={`bg-surface rounded-xl shadow-lg border p-4 flex flex-col justify-between transition-all duration-200
                 ${isLocked ? 'opacity-60 border-white/5' : 'border-white/10 hover:shadow-primary/20 hover:border-primary/30'}
                 ${isCompleting ? 'animate-pulse' : ''}`}
    >
      <div>
        {/* Görev Başlığı ve Özel Durum İkonları */} 
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-primary/10 ${isLocked ? 'opacity-50' : ''}`}>
            <CategoryIcon size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-md font-semibold text-text truncate" title={mission.title}>{mission.title}</h3>
              <div className="flex items-center gap-1.5 flex-shrink-0"> 
                {mission.is_vip && <Gem size={16} className="text-amber-400" aria-label="VIP Görev"/>} 
                {mission.required_nft_id && <Nfc size={16} className="text-cyan-400" aria-label="NFT Gerekli"/>} 
              </div>
            </div>
            <p className="text-sm text-textSecondary line-clamp-2 mt-1">{mission.description}</p>
          </div>
        </div>
      </div>

      {/* Ödül ve Durum */} 
      <div className="mt-auto pt-3 border-t border-white/5"> {/* Üst çizgi */} 
          <div className="flex justify-between items-center text-sm mb-4"> 
            {/* Ödüller */}
            <div className="flex items-center gap-3">
              {/* XP ödülü */}
              <span className="font-semibold text-primary flex items-center"> 
                <Star size={16} className="mr-1 fill-primary text-primary"/> 
                <span>{mission.xp_reward} XP</span>
              </span> 
              
              {/* Rozet ödülü (varsa) */}
              {mission.badge_reward && (
                <span className="font-semibold text-amber-400 flex items-center"> 
                  <Award size={16} className="mr-1"/> 
                  <span>Rozet</span>
                </span>
              )}
            </div>
            
            {/* Durum Göstergesi */} 
            {isLocked && mission.is_completed && mission.cooldown_hours === 0 && ( 
                <span className="text-xs text-success flex items-center"><CheckCircle size={14} className="mr-1"/>Tamamlandı</span> 
            )} 
            {isLocked && mission.is_on_cooldown && cooldownEndTime && ( 
                 <span className="text-xs text-textSecondary flex items-center"><Clock size={14} className="mr-1"/>{formatCooldown(cooldownEndTime)}</span> 
            )} 
             {/* Kilitli değilse ve tamamlanmamışsa boşluk bırak veya başka bir şey göster */} 
            {!isLocked && (
                 <span className="text-xs text-success flex items-center"><Badge size={14} className="mr-1" />Yapılabilir</span>
            )}
          </div> 

          {/* Tamamlama Butonu */} 
          <Buton 
            fullWidth 
            variant={isLocked ? "secondary" : "primary"}
            onClick={handleCompleteClick} 
            isLoading={isCompleting} 
            disabled={isLocked || isCompleting} 
            size="sm" 
            className={`transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`} // Kilitli stil
          > 
            {isCompleting ? 'Doğrulanıyor...' : (isLocked ? 'Beklemede' : 'Görevi Tamamla')} {/* Metin güncellendi */} 
             {!isLocked && !isCompleting && <ArrowRight size={16} className="ml-1"/>} 
          </Buton> 
      </div>
    </div>
  );
};

export default GorevKarti; 