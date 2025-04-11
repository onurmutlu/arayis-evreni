import React, { useState, useEffect, useCallback } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import Buton from '../components/Buton';
import {
  Swords, Heart, ShieldCheck, Building, Zap,
  AlertCircle, Loader2, Lock, CheckCircle, Info, RefreshCw, Hourglass
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTelegram } from '../contexts/TelegramContext';
import { fetchMissions, completeMission } from '../utils/api';
import { Mission, CompleteMissionResponse } from '../types';
import { triggerHapticFeedback, showNotification } from '../utils/hapticFeedback';

// Kategori ikonları
const categoryIcons: Record<string, React.ElementType> = {
  flirt: Heart,
  dao: ShieldCheck,
  guardian: Swords,
  city: Building,
  general: Info,
  default: Zap
};

const Gorevler: React.FC = () => {
  const { getTelegramUserId } = useTelegram();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingMissionId, setCompletingMissionId] = useState<number | null>(null);
  const [completionStatus, setCompletionStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [xpAnimation, setXpAnimation] = useState<{ amount: number, visible: boolean }>({ amount: 0, visible: false });

  // Görevleri fetch eden fonksiyon
  const fetchUserMissions = async () => {
    try {
      setIsLoading(true);
      const missions = await fetchMissions();
      setMissions(missions);
    } catch (error) {
      console.error("Görevler yüklenirken hata:", error);
      triggerHapticFeedback('error');
      showNotification('error');
      setError("Görevler yüklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    fetchUserMissions();
  }, []);

  // Görevi tamamlama fonksiyonu
  const handleCompleteMission = async (missionId: number) => {
    if (completingMissionId) return; // Zaten bir işlem varsa engelle

    setCompletingMissionId(missionId);
    setCompletionStatus(null);
    setError(null);

    try {
      triggerHapticFeedback('medium');
      const result = await completeMission(missionId);
      
      // XP animasyonu göster
      if (result.xp_gained && result.xp_gained > 0) {
        setXpAnimation({ 
          amount: result.xp_gained || 0, 
          visible: true 
        });
        setTimeout(() => {
          setXpAnimation(prev => ({ ...prev, visible: false }));
        }, 3000);
      }
      
      // Başarı feedback'i
      triggerHapticFeedback('success');
      showNotification('success');
      
      setCompletionStatus({ 
        message: `Görev tamamlandı! +${result.xp_gained || result.new_xp} XP kazandın!${result.level_up ? ' ✨ Seviye atladın!' : ''}`, 
        type: 'success' 
      });

      // Görev listesini yenile
      await fetchUserMissions();
    } catch (err: any) {
      console.error(`Görev ${missionId} tamamlanırken hata:`, err);
      triggerHapticFeedback('error');
      showNotification('error');
      
      setCompletionStatus({ 
        message: err.message || "Görev tamamlanırken bir hata oluştu.", 
        type: 'error' 
      });
    } finally {
      setCompletingMissionId(null);
      // Başarı/hata mesajını birkaç saniye sonra kaldır
      setTimeout(() => setCompletionStatus(null), 5000);
    }
  };

  // Kalan cooldown süresini hesapla ve formatla
  const getCooldownTimeLeft = (lastCompletedStr: string | null, cooldownHours: number): string | null => {
    if (!lastCompletedStr) return null;
    try {
      const lastCompletedDate = new Date(lastCompletedStr);
      const cooldownEndDate = new Date(lastCompletedDate.getTime() + cooldownHours * 60 * 60 * 1000);
      const now = new Date();

      if (now >= cooldownEndDate) return null; // Cooldown bitti

      // Kalan süreyi formatla
      return formatDistanceToNowStrict(cooldownEndDate, { addSuffix: true, locale: tr });
    } catch (e) {
      console.error("Error parsing date for cooldown:", e);
      return null;
    }
  };

  // Kategori adını daha okunabilir hale getir
  const getReadableCategoryName = (category: string | null): string => {
      if (!category) return '';
      const names: { [key: string]: string } = {
          guardian: "Muhafız",
          flirt: "Flört",
          dao: "DAO",
          city: "Şehir",
          general: "Genel"
      };
      return names[category] || category;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto pb-20">
      <SayfaBasligi title="Aktif Görevler" icon={Swords} />

      {/* XP Animasyonu */}
      {xpAnimation.visible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-3xl font-bold text-primary animate-bounce-up-and-fade">
            +{xpAnimation.amount} XP
          </div>
        </div>
      )}

      {/* Yükleme durumu */} 
      {isLoading && (
         <div className="flex justify-center items-center py-10"> 
              <Loader2 size={32} className="animate-spin text-primary"/> 
              <span className="ml-3 text-lg text-textSecondary">Görevler yükleniyor...</span> 
         </div> 
      )} 

      {/* Hata durumu */} 
      {!isLoading && error && ( 
        <div className="p-4 bg-error/10 text-error text-center rounded-lg mb-4 border border-error/30 flex flex-col sm:flex-row items-center justify-center"> 
            <div className="flex items-center mb-2 sm:mb-0">
                <AlertCircle size={20} className="mr-2 flex-shrink-0"/> 
                <span>{error}</span> 
            </div>
            <Buton onClick={fetchUserMissions} size="sm" variant="ghost" className="ml-0 mt-2 sm:mt-0 sm:ml-4 text-error hover:bg-error/20"> 
                 <RefreshCw size={14} className="mr-1"/> Yeniden Dene 
            </Buton> 
        </div> 
      )} 

      {/* Görev yoksa */} 
      {!isLoading && !error && missions.length === 0 && ( 
        <p className="text-center text-textSecondary mt-8">Şu anda sana uygun aktif görev bulunmamaktadır. Farklı NFT'ler kazanarak yeni görevler açabilirsin!</p> 
      )} 

      {/* Görev Tamamlama Durum Mesajı */} 
      {completionStatus && (
          <div className={`p-3 mb-4 rounded-md text-center text-sm font-medium ${completionStatus.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}> 
            {completionStatus.message}
          </div>
      )}

      {/* Görev listesi */} 
      {!isLoading && !error && missions.length > 0 && ( 
        <div className="space-y-4 mt-6"> 
          {missions.map((gorev) => {
              // Kategoriye göre ikon belirle
              const Icon = categoryIcons[gorev.mission_type || gorev.category || 'default'] || Zap;
              const isLocked = !gorev.unlocked;
              const isCompletingThis = completingMissionId === gorev.id;

              return (
                <div 
                  key={gorev.id} 
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg shadow-sm transition-all ${isLocked ? 'bg-muted/50 border-border/50 opacity-70' : 'bg-card border-border hover:shadow-md'}`}
                > 
                  <div className="flex items-center mr-4 overflow-hidden flex-grow mb-3 sm:mb-0"> 
                      <Icon size={24} className={`mr-4 flex-shrink-0 ${isLocked ? 'text-textMuted' : 'text-primary'}`}/> 
                      <div className="flex-grow"> 
                          <h3 className={`text-md font-semibold ${isLocked ? 'text-textMuted' : 'text-text'} truncate`} title={gorev.title}>{gorev.title}</h3> 
                          <p className={`text-sm ${isLocked ? 'text-textMuted' : 'text-textSecondary'} whitespace-normal`}>{gorev.description}</p> 
                      </div> 
                  </div> 

                  <div className="text-right ml-auto flex-shrink-0 flex flex-col sm:flex-row items-end sm:items-center w-full sm:w-auto"> 
                      <p className={`text-lg font-bold ${isLocked ? 'text-textMuted' : 'text-primary'} mr-0 sm:mr-4 mb-2 sm:mb-0`}>+{gorev.xp_reward} XP</p> 
                      {isLocked ? (
                          <div className="flex items-center text-xs text-textMuted px-2 py-1 bg-background rounded border border-border">
                              <Lock size={14} className="mr-1.5" />
                              {gorev.required_nft_id 
                                ? `${getReadableCategoryName(gorev.category || null)} NFT Gerekli` 
                                : 'Kilitli'} 
                          </div>
                      ) : (
                          <Buton 
                              size="sm" 
                              variant="primary"
                              onClick={() => handleCompleteMission(gorev.id)} 
                              disabled={isCompletingThis || !!completingMissionId} 
                              className="w-full sm:w-auto min-w-[140px] flex items-center justify-center"
                          >
                              {isCompletingThis ? (
                                  <Loader2 size={16} className="animate-spin mr-1.5" />
                              ) : (
                                  <Swords size={16} className="mr-1.5" />
                              )}
                              Tamamla
                          </Buton>
                      )}
                  </div> 
                </div>
              );
          })}
        </div> 
      )} 
    </div>
  );
};

export default Gorevler; 