import React from 'react';
import { Mission } from '../types';
import Buton from './Buton';
import { Lock, Gem, Nfc, Clock, CheckCircle, ArrowRight, Star } from 'lucide-react'; // İkonlar (Star eklendi)

interface GorevKartiProps {
  mission: Mission;
  onComplete: (missionId: number) => void;
  isCompleting: boolean;
}

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
        <h3 className="text-lg font-semibold text-text mb-2 flex items-center justify-between"> 
           <span className="truncate mr-2">{mission.title}</span> 
           <div className="flex items-center space-x-1.5 flex-shrink-0"> 
              {mission.is_vip && <Gem size={16} className="text-amber-400" aria-label="VIP Görev"/>} 
              {mission.required_nft_id && <Nfc size={16} className="text-cyan-400" aria-label={`Gereken NFT: ${mission.required_nft_name || mission.required_nft_id}`}/>} 
           </div> 
        </h3> 
        <p className="text-sm text-textSecondary mb-3 line-clamp-2 min-h-[40px]">{mission.description}</p> {/* Min yükseklik */}
      </div>

      {/* Ödül ve Durum */} 
      <div className="mt-auto pt-3 border-t border-white/5"> {/* Üst çizgi */} 
          <div className="flex justify-between items-center text-sm mb-4"> 
            {/* Ödül */} 
            <span className="font-semibold text-primary flex items-center"> 
                <Star size={14} className="mr-1 fill-primary text-primary"/> 
                +{mission.xp_reward} XP 
            </span> 
            {/* Durum Göstergesi */} 
            {isLocked && mission.is_completed && mission.cooldown_hours === 0 && ( 
                <span className="text-xs text-success flex items-center"><CheckCircle size={14} className="mr-1"/>Tamamlandı</span> 
            )} 
            {isLocked && mission.is_on_cooldown && cooldownEndTime && ( 
                 <span className="text-xs text-textSecondary flex items-center"><Clock size={14} className="mr-1"/>{formatCooldown(cooldownEndTime)}</span> 
            )} 
             {/* Kilitli değilse ve tamamlanmamışsa boşluk bırak veya başka bir şey göster */} 
            {!isLocked && (
                 <span className="text-xs text-gray-500">Yapılabilir</span>
            )}
          </div> 

          {/* Tamamlama Butonu */} 
          <Buton 
            fullWidth 
            variant="primary" 
            onClick={handleCompleteClick} 
            isLoading={isCompleting} 
            disabled={isLocked || isCompleting} 
            size="sm" 
            className={`transition-opacity ${isLocked ? 'opacity-50 cursor-not-allowed bg-gray-600 hover:bg-gray-600' : 'hover:brightness-110'}`} // Kilitli stil
          > 
            {isCompleting ? 'Doğrulanıyor...' : (isLocked ? 'Beklemede' : 'Görevi Tamamla')} {/* Metin güncellendi */} 
             {!isLocked && !isCompleting && <ArrowRight size={16} className="ml-1"/>} 
          </Buton> 
      </div>
    </div>
  );
};

export default GorevKarti; 