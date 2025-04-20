import React, { useState, useEffect, useCallback } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import Buton from '../components/Buton';
import {
  Swords, Heart, ShieldCheck, Rocket, Zap,
  AlertCircle, Loader2, Lock, CheckCircle, Info, RefreshCw, Hourglass, Star, Globe, Sparkles, GraduationCap, Flame
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTelegram } from '../contexts/TelegramContext';
import { fetchMissions, completeMission } from '../utils/api';
import { Mission, CompleteMissionResponse } from '../types';
import { triggerHapticFeedback, showNotification } from '../utils/hapticFeedback';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// Kategori ikonları - kozmik temaya daha uygun simgeler
const categoryIcons: Record<string, React.ElementType> = {
  flirt: Heart,
  dao: ShieldCheck,
  guardian: Swords,
  city: Globe,
  analysis: GraduationCap,
  basics: Sparkles,
  social: Flame,
  general: Rocket,
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
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [activeFilter, setActiveFilter] = useState<string | 'all'>('all');

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
      
      // Konfeti animasyonu göster
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
      
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
        message: `Görev tamamlandı! +${result.xp_gained || result.new_xp} XP kazandın!${result.level_up ? ' ✨ Seviye atladın!' : ''}${result.earned_badge ? ' 🏆 Yeni rozet kazandın!' : ''}`, 
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
          general: "Genel",
          basics: "Temel",
          social: "Sosyal",
          analysis: "Analiz"
      };
      return names[category] || category;
  }

  // Benzersiz kategorileri al
  const uniqueCategories = React.useMemo(() => {
    const categories = new Set<string>();
    missions.forEach(mission => {
      if (mission.category) categories.add(mission.category);
      else if (mission.mission_type) categories.add(mission.mission_type);
    });
    return Array.from(categories);
  }, [missions]);

  // Filtrelenmiş görevleri al
  const filteredMissions = React.useMemo(() => {
    if (activeFilter === 'all') return missions;
    return missions.filter(mission => 
      mission.category === activeFilter || mission.mission_type === activeFilter
    );
  }, [missions, activeFilter]);

  return (
    <div className="relative min-h-screen pb-20">
      {/* Kozmik arka plan */}
      <div 
        className="fixed inset-0 z-0 bg-gradient-to-b from-background to-black" 
        style={{
          backgroundImage: `url('/assets/images/cosmic-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15
        }}
      ></div>
      
      {/* Parlayan yıldızlar */}
      <div className="fixed inset-0 z-0 overflow-hidden opacity-30">
        {Array.from({length: 25}).map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 7}s`
            }}
          ></div>
        ))}
      </div>

      {/* Ana içerik */}
      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <SayfaBasligi title="Kozmik Görevler" icon={Swords} />

        {/* Konfeti Animasyonu */}
        {showConfetti && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.2}
          />
        )}

        {/* XP Animasyonu */}
        {xpAnimation.visible && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="text-5xl font-bold text-gradient-to-r from-primary to-secondary animate-bounce-up-and-fade flex items-center">
              <Sparkles className="mr-2 text-yellow-400" />
              +{xpAnimation.amount} XP
            </div>
          </div>
        )}

        {/* Görev kategorileri filtreleme */}
        {!isLoading && !error && uniqueCategories.length > 0 && (
          <div className="bg-card/30 backdrop-blur-sm rounded-xl p-4 mb-6 border border-primary/10 overflow-x-auto">
            <div className="flex space-x-2">
              <Buton 
                size="sm" 
                variant={activeFilter === 'all' ? 'primary' : 'secondary'}
                onClick={() => setActiveFilter('all')}
                className={activeFilter === 'all' ? 'bg-gradient-to-r from-primary to-secondary text-white border-0' : 'bg-surface/50'}
              >
                Tümü
              </Buton>
              
              {uniqueCategories.map(category => (
                <Buton
                  key={category}
                  size="sm"
                  variant={activeFilter === category ? 'primary' : 'secondary'}
                  onClick={() => setActiveFilter(category)}
                  className={`whitespace-nowrap ${activeFilter === category ? 'bg-gradient-to-r from-primary to-secondary text-white border-0' : 'bg-surface/50'}`}
                >
                  {categoryIcons[category] && React.createElement(categoryIcons[category], { size: 14, className: "mr-1" })}
                  {getReadableCategoryName(category)}
                </Buton>
              ))}
            </div>
          </div>
        )}

        {/* Yükleme durumu */} 
        {isLoading && (
          <div className="flex flex-col justify-center items-center py-14 bg-card/20 backdrop-blur-md rounded-xl border border-primary/10">
            <div className="relative">
              <Loader2 size={40} className="animate-spin text-primary z-10" />
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-md animate-pulse"></div>
            </div>
            <span className="mt-4 text-lg text-text/80">Kozmik görevlerin yükleniyor...</span>
          </div>
        )} 

        {/* Hata durumu */} 
        {!isLoading && error && ( 
          <div className="bg-card/30 backdrop-blur-md text-error text-center rounded-xl p-6 border border-error/30 shadow-lg">
            <div className="bg-error/10 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-3">
              <AlertCircle size={28} className="text-error" />
            </div>
            <p className="text-lg font-medium mb-2">Görevler Alınamadı</p>
            <p className="text-textSecondary mb-4">{error}</p>
            <Buton variant="secondary" size="sm" onClick={fetchUserMissions}>
              <RefreshCw size={14} className="mr-1.5" />
              Tekrar Dene
            </Buton>
          </div>
        )} 

        {/* Görev yoksa */} 
        {!isLoading && !error && filteredMissions.length === 0 && ( 
          <div className="flex flex-col items-center py-10 text-center bg-card/30 backdrop-blur-sm rounded-lg border border-primary/20 mt-4">
            <div className="bg-primary/10 w-16 h-16 flex items-center justify-center rounded-full mb-4">
              <Rocket size={28} className="text-primary opacity-70" />
            </div>
            <p className="text-lg font-medium mb-2">Bu kategoride aktif görev bulunamadı</p>
            <p className="text-sm text-textSecondary max-w-md mx-auto">
              Farklı bir kategori seçebilir veya yeni NFT'ler kazanarak daha fazla göreve erişebilirsin
            </p>
            {activeFilter !== 'all' && (
              <Buton variant="secondary" size="sm" onClick={() => setActiveFilter('all')} className="mt-4">
                Tüm görevleri göster
              </Buton>
            )}
          </div>
        )} 

        {/* Görev Tamamlama Durum Mesajı */} 
        {completionStatus && (
          <div className={`bg-card/40 backdrop-blur-md p-4 mb-4 rounded-xl text-center shadow-md transition-all duration-300 transform hover:scale-[1.01] border ${completionStatus.type === 'success' ? 'border-success/30 text-success' : 'border-error/30 text-error'}`}> 
            <div className="flex items-center justify-center">
              {completionStatus.type === 'success' ? 
                <CheckCircle size={20} className="mr-2" /> : 
                <AlertCircle size={20} className="mr-2" />
              }
              <span className="font-medium">{completionStatus.message}</span>
            </div>
          </div>
        )}

        {/* Görev listesi */} 
        {!isLoading && !error && filteredMissions.length > 0 && ( 
          <div className="space-y-4 mt-6"> 
            {filteredMissions.map((gorev) => {
                // Kategoriye göre ikon belirle
                const categoryKey = gorev.category || gorev.mission_type || 'default';
                const Icon = categoryIcons[categoryKey] || Zap;
                const isLocked = !gorev.unlocked;
                const isCompletingThis = completingMissionId === gorev.id;
                const isCompleted = gorev.is_completed;
                const cooldownText = getCooldownTimeLeft(gorev.last_completed_at ?? null, gorev.cooldown_hours);
                const isOnCooldown = !!cooldownText;

                return (
                  <div 
                    key={gorev.id} 
                    className={`bg-card/40 backdrop-blur-md rounded-xl shadow-lg p-5 border transition-all duration-300 ${
                      isLocked 
                        ? 'border-surface/50 opacity-70' 
                        : isCompleted && isOnCooldown
                          ? 'border-yellow-500/30 hover:border-yellow-500/50'
                          : isCompleted
                            ? 'border-green-500/30 hover:border-green-500/50'
                            : 'border-primary/20 hover:border-primary/40 hover:shadow-xl'
                    }`}
                  > 
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Sol taraf: Kategori ikonu */}
                      <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${
                        isLocked 
                          ? 'bg-surface/50'
                          : isCompleted && isOnCooldown
                            ? 'bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30'
                            : isCompleted
                              ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30'
                              : 'bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30'
                      }`}>
                        <Icon size={28} className={`${
                          isLocked 
                            ? 'text-text-secondary' 
                            : isCompleted && isOnCooldown
                              ? 'text-yellow-500'
                              : isCompleted
                                ? 'text-green-500'
                                : 'text-primary'
                        }`}/>
                      </div>
                      
                      {/* Orta: Görev detayları */}
                      <div className="flex-grow"> 
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className={`text-md font-semibold ${isLocked ? 'text-text-secondary' : 'text-text'}`}>
                            {gorev.title}
                          </h3>
                          
                          {/* Görev durumu badge'i */}
                          {isLocked ? (
                            <span className="text-xs bg-surface/60 text-textSecondary px-2 py-0.5 rounded-full flex items-center">
                              <Lock size={12} className="mr-1" />
                              Kilitli
                            </span>
                          ) : isCompleted && isOnCooldown ? (
                            <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full flex items-center">
                              <Hourglass size={12} className="mr-1" />
                              Bekleme Süresi
                            </span>
                          ) : isCompleted ? (
                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full flex items-center">
                              <CheckCircle size={12} className="mr-1" />
                              Tamamlandı
                            </span>
                          ) : (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center">
                              <Sparkles size={12} className="mr-1" />
                              Aktif
                            </span>
                          )}
                        </div>
                        
                        {/* Görev açıklaması */}
                        <p className={`text-sm ${isLocked ? 'text-text-secondary/70' : 'text-text-secondary'}`}>
                          {gorev.description}
                        </p>
                        
                        {/* Cooldown bilgisi */}
                        {isCompleted && isOnCooldown && (
                          <p className="text-xs text-yellow-500 mt-1 flex items-center">
                            <Hourglass size={12} className="mr-1 inline" />
                            Tekrar yapılabilir: {cooldownText}
                          </p>
                        )}
                      </div> 

                      {/* Sağ taraf: XP ve buton */}
                      <div className="flex flex-col items-end gap-2 ml-auto sm:ml-0 flex-shrink-0"> 
                        <div className={`flex items-center gap-1 font-bold text-lg ${
                          isLocked ? 'text-text-secondary/50' : 'text-primary'
                        }`}>
                          <Star size={16} className={isLocked ? 'text-text-secondary/50' : 'text-amber-400'} />
                          +{gorev.xp_reward} XP
                        </div>
                        
                        {isLocked ? (
                          <div className="flex items-center text-xs text-text-secondary px-3 py-1.5 bg-surface/40 rounded-full border border-surface/60">
                            <Lock size={14} className="mr-1.5" />
                            {gorev.required_nft_id 
                              ? `${getReadableCategoryName(gorev.category || null)} NFT Gerekli` 
                              : 'Seviye Yetersiz'} 
                          </div>
                        ) : isCompleted && isOnCooldown ? (
                          <Buton 
                            size="sm" 
                            variant="secondary"
                            disabled={true}
                            className="bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                          >
                            <Hourglass size={16} className="mr-1.5" />
                            Bekleme Süresi
                          </Buton>
                        ) : (
                          <Buton 
                            size="sm" 
                            variant={isCompleted ? "secondary" : "primary"}
                            onClick={() => handleCompleteMission(gorev.id)} 
                            disabled={isCompletingThis || !!completingMissionId || isCompleted}
                            className={isCompleted ? "bg-green-500/10 border-green-500/30 text-green-500" : ""}
                          >
                            {isCompletingThis ? (
                              <>
                                <Loader2 size={16} className="animate-spin mr-1.5" />
                                İşleniyor...
                              </>
                            ) : isCompleted ? (
                              <>
                                <CheckCircle size={16} className="mr-1.5" />
                                Tamamlandı
                              </>
                            ) : (
                              <>
                                <Swords size={16} className="mr-1.5" />
                                Tamamla
                              </>
                            )}
                          </Buton>
                        )}
                      </div> 
                    </div> 
                  </div>
                );
            })}
          </div>
        )} 
      </div>
    </div>
  );
};

export default Gorevler; 