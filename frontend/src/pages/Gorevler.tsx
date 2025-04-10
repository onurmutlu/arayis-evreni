import React, { useState, useEffect, useCallback } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import Buton from '../components/Buton';
import {
  Swords, Heart, ShieldCheck, Building, Zap,
  AlertCircle, Loader2, Lock, CheckCircle, Info, RefreshCw, Hourglass // Hourglass ikonu eklendi
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns'; // Kalan süre için
import { tr } from 'date-fns/locale';
// import { mockNFTData, NFT } from '../data/nftData'; // Lokal veri kaldırıldı

// Backend'deki MissionState modeline uygun arayüz
interface MissionState {
  id: string; // Görev ID'si artık string (JSON'dan geldiği için)
  category: string; // JSON'dan gelen genel görev kategorisi (ikon için vb.) - EKLENDİ
  title: string;
  description: string;
  required_nft_category: string | null;
  xp_reward: number; // Backend'den gelen isimle eşleşiyor
  unlocked: boolean;
  can_complete: boolean;
  last_completed: string | null; // Datetime string olarak gelebilir
  cooldown_hours: number; // Cooldown süresi (JSON'dan)
}

// Backend'den gelen CompletedMissionInfo modeline uygun arayüz
interface CompletedMissionInfo {
    message: string;
    xp_earned: number;
    streak_bonus_xp?: number;
    streak_bonus_nft_earned?: string;
    new_level?: number;
}

// Bildirim kategorisine göre ikon eşleştirmesi (Bildirimler.tsx'den alınabilir veya burada tanımlanabilir)
// Şimdilik görev tiplerine göre ikonları manuel eşleştirelim (API yanıtında ikon bilgisi yoksa)
const categoryIcons: Record<string, React.ElementType> = {
  flirt: Heart,
  dao: ShieldCheck,
  guardian: Swords,
  city: Building,
  general: Info, // Genel kategori için
  default: Zap // Eğer kategori yoksa veya eşleşmiyorsa
};

// Örnek API base URL (yapılandırmadan gelmeli)
const API_BASE_URL = 'http://127.0.0.1:8000'; // Veya environment variable

const Gorevler: React.FC = () => {
  const [missions, setMissions] = useState<MissionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingMissionId, setCompletingMissionId] = useState<string | null>(null);
  const [completionStatus, setCompletionStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  // Simüle edilmiş kullanıcı ID'si
  const userId = 'user123'; 

  // Görevleri fetch eden fonksiyon
  const fetchUserMissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Completion status'u temizle
    setCompletionStatus(null); 
    try {
      const response = await fetch(`${API_BASE_URL}/missions/${userId}`);
      if (!response.ok) {
        let errorMsg = `Görevler alınamadı: ${response.status}`;
        try { const errData = await response.json(); errorMsg = errData.detail || errorMsg; } catch(e){}
        throw new Error(errorMsg);
      }
      const data: MissionState[] = await response.json();
      setMissions(data);
    } catch (err: any) {
      console.error("Görevler API'den çekilirken hata:", err);
      setError(err.message || "Görevler yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]); // useCallback ile fonksiyonu memoize et

  // İlk yükleme ve görev tamamlama sonrası için useEffect
  useEffect(() => {
    fetchUserMissions();
  }, [fetchUserMissions]); // fetchUserMissions değiştiğinde çalışır

  // Görevi tamamlama fonksiyonu
  const handleCompleteMission = async (missionId: string) => {
    if (completingMissionId) return; // Zaten bir işlem varsa engelle

    setCompletingMissionId(missionId);
    setCompletionStatus(null);
    setError(null); // Önceki genel hataları temizle

    try {
      const response = await fetch(`${API_BASE_URL}/complete_mission/${userId}/${missionId}`, {
        method: 'POST'
      });

      const resultData = await response.json(); // Yanıtı her zaman oku

      if (!response.ok) {
        throw new Error(resultData.detail || `Görev ${missionId} tamamlanamadı: ${response.status}`);
      }

      const result: CompletedMissionInfo = resultData;
      
      // Başarı mesajı göster (Bonusları içerebilir)
      let successMessage = `${result.message} +${result.xp_earned} XP kazandın!`;
      if (result.streak_bonus_xp) {
          successMessage += ` 🔥 +${result.streak_bonus_xp} XP zincir bonusu!`;
      }
      if (result.streak_bonus_nft_earned) {
          successMessage += ` 🎁 Yeni bir mini-NFT kazandın! (${result.streak_bonus_nft_earned})`;
      }
       if (result.new_level) {
          successMessage += ` ✨ Tebrikler! Seviye ${result.new_level}'e yükseldin!`;
      }
      setCompletionStatus({ message: successMessage, type: 'success' });

      // Görev listesini yenile (cooldown durumunu güncellemek için)
      await fetchUserMissions(); 
      // TODO: Profildeki XP/Level/Streak bilgisini de güncellemek için global state veya context kullanılabilir.

    } catch (err: any) {
      console.error(`Görev ${missionId} tamamlanırken hata:`, err);
      setCompletionStatus({ message: err.message || "Görev tamamlanırken bir hata oluştu.", type: 'error' });
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
      return null; // Tarih parse edilemezse cooldown yokmuş gibi davran
    }
  };

  // Kategori adını daha okunabilir hale getir (opsiyonel)
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
            {/* Basit yeniden deneme butonu */} 
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
              // Kategoriye veya ID'ye göre ikon belirle
              const Icon = categoryIcons[gorev.required_nft_category || gorev.category || 'default'] || Zap;
              const isLocked = !gorev.unlocked; // API'den gelen değere bak
              const isInCooldown = gorev.unlocked && !gorev.can_complete;
              const cooldownTimeLeft = isInCooldown ? getCooldownTimeLeft(gorev.last_completed, gorev.cooldown_hours) : null;
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
                      <p className={`text-lg font-bold ${isLocked || isInCooldown ? 'text-textMuted' : 'text-primary'} mr-0 sm:mr-4 mb-2 sm:mb-0`}>+{gorev.xp_reward} XP</p> 
                      {isLocked ? (
                          <div className="flex items-center text-xs text-textMuted px-2 py-1 bg-background rounded border border-border">
                              <Lock size={14} className="mr-1.5" />
                              {gorev.required_nft_category 
                                ? `${getReadableCategoryName(gorev.required_nft_category)} NFT Gerekli` 
                                : 'Kilitli'} 
                          </div>
                      ) : isInCooldown ? (
                         <div className="flex items-center text-xs text-textMuted px-2 py-1 bg-background rounded border border-border" title={`Son Tamamlama: ${gorev.last_completed ? new Date(gorev.last_completed).toLocaleString() : 'N/A'}`}>
                              <Hourglass size={14} className="mr-1.5" />
                              {cooldownTimeLeft ? `${cooldownTimeLeft} kaldı` : 'Cooldown'} 
                          </div>
                      ) : (
                          <Buton 
                              size="sm" 
                              variant="primary"
                              onClick={() => handleCompleteMission(gorev.id)} 
                              disabled={isCompletingThis || !!completingMissionId} // Kendi işlemi veya başka bir işlem sürüyorsa
                              className="w-full sm:w-auto min-w-[140px] flex items-center justify-center"
                          >
                              {isCompletingThis ? (
                                  <Loader2 size={16} className="animate-spin mr-1.5" />
                              ) : (
                                  <CheckCircle size={16} className="mr-1.5" />
                              )}
                              {isCompletingThis ? 'Tamamlanıyor...' : 'Görevi Tamamla'}
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