import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SayfaBasligi from '../components/SayfaBasligi';
import XPBar from '../components/XPBar';
import StarsBalance from '../components/StarsBalance';
import RozetKarti from '../components/RozetKarti';
import { useTelegram } from '../contexts/TelegramContext';
import { UserProfile, InviteInfoResponse, MissionStory, UserBadgeSchema } from '../types';
import { fetchUserProfile, fetchInviteInfo, fetchUserStats } from '../utils/api';
import { Clipboard, Check, Gift, Gem, Swords, User, Star, Activity, Share2, Copy, ShieldAlert, Loader2, Users, Award, RefreshCcw, AlertCircle, CheckCircle, LucideInfo, Clock, Target, Trophy, Calendar } from 'lucide-react';
import Buton from '../components/Buton';
import { triggerHapticFeedback, showNotification } from '../utils/hapticFeedback';
import { INotification } from "../types/notification";
import { formatDate } from "../utils/dateUtils";
import { setProfilePhoto } from "../utils/api";

// Level eşikleri (XP miktarları)
const LEVEL_THRESHOLDS: Record<number, number> = {
    1: 0,
    2: 100,
    3: 250,
    4: 500,
    5: 1000,
    6: 2000,
    7: 3500,
    8: 5500,
    9: 8000,
    10: 11000,
    11: 14500,
    12: 18500,
    13: 23000,
    14: 28000,
    15: 33500,
    16: 39500,
    17: 46000,
    18: 53000,
    19: 60500,
    20: 68500,
    // Daha yüksek seviyeler için devam edebilir...
};

// Rol tanımları
const USER_ROLES: Record<number, { name: string, color: string }> = {
   1: { name: "Yeni Yolcu", color: "text-gray-400" },
   3: { name: "Araştırmacı", color: "text-blue-400" },
   5: { name: "Kaşif", color: "text-green-400" },
   8: { name: "Rehber", color: "text-yellow-400" },
   10: { name: "Efsane", color: "text-purple-400" },
   15: { name: "Uzman", color: "text-red-400" },
   20: { name: "Üstat", color: "text-amber-400" },
};

const MAX_LEVEL = Math.max(...Object.keys(LEVEL_THRESHOLDS).map(Number));

// Kullanıcı seviyesine göre rol bulma fonksiyonu
const getUserRole = (level: number) => {
    const roleThresholds = Object.keys(USER_ROLES).map(Number).sort((a, b) => b - a);
    
    for (const threshold of roleThresholds) {
        if (level >= threshold) {
            return USER_ROLES[threshold];
        }
    }
    
    return USER_ROLES[1]; // Default rol
};

// Badge tipini tanımlayalım
type Badge = UserBadgeSchema;

// Rozet bileşeni için modern ve kozmik tasarımlı bir komponent
const BadgeCard: React.FC<{ badge: Badge }> = ({ badge }) => {
  const [imageError, setImageError] = useState(false);
  
  // Görsel hata kontrolü
  const handleImageError = () => {
    console.error(`Rozet resmi yüklenemedi: ${badge.badge_image_url}`);
    setImageError(true);
  };
  
  // Badge image URL'ini kontrol edelim
  const badgeImageUrl = badge.badge_image_url || '/assets/images/cosmic-badge-placeholder.png';
  console.log('Yüklenen rozet:', badge);
  console.log('Rozet resim URL:', badgeImageUrl);
  
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-80 transition duration-1000"></div>
      <div className="relative bg-card backdrop-blur-sm border border-primary/20 rounded-lg p-3 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] overflow-hidden">
        <div className="relative rounded-lg overflow-hidden bg-black/20 aspect-square mb-2 flex items-center justify-center">
          {/* Glow efekti ve rozet görseli */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center group-hover:opacity-30 transition-opacity"></div>
          
          {imageError ? (
            <div className="w-16 h-16 flex items-center justify-center text-2xl">
              🏆
              <span className="sr-only">{badge.badge_name}</span>
            </div>
          ) : (
            <img
              src={badgeImageUrl}
              alt={badge.badge_name || 'Rozet'}
              className="w-16 h-16 object-contain z-10 transform group-hover:scale-110 transition-transform"
              onError={handleImageError}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <h4 className="text-center text-sm font-medium mb-1 truncate text-primary">{badge.badge_name}</h4>
        <p className="text-center text-xs text-textSecondary truncate">{badge.description || ''}</p>
      </div>
    </div>
  );
};

const Profil: React.FC = () => {
  const { user, getTelegramUserId, isTelegramContext } = useTelegram();
  
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Kullanıcı başarıları ve görevleri için state
  const [userStats, setUserStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // XP bilgisinden sonraki seviyeyi ve ilerlemeyi hesapla
  const calculateXpProgress = (xp: number, level: number): { nextLevelXp: number; progress: number } => {
    const xpThresholds: { [key: number]: number } = {
      1: 0,
      2: 100,
      3: 250,
      4: 500,
      5: 1000,
      6: 2000,
      7: 4000,
      8: 7500,
      9: 12000,
      10: 20000
    };
    
    const currentLevelXp = xpThresholds[level] || 0;
    const nextLevelXp = xpThresholds[level + 1] || currentLevelXp * 2;
    const xpForNextLevel = nextLevelXp - currentLevelXp;
    const userXpInCurrentLevel = xp - currentLevelXp;
    const progress = Math.min(100, Math.floor((userXpInCurrentLevel / xpForNextLevel) * 100)) || 0;
    
    return { nextLevelXp, progress };
  };
  
  // Profil bilgilerini yükle
  const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    setStatsLoading(true);
    setStatsError(null);
    
    try {
      // Telegram ID'si veya default demo123 ID kullan
      const userId = getTelegramUserId()?.toString() || "demo123";
      console.log("Profil sayfası yükleniyor, userId:", userId);
      
      // Kullanıcı profil bilgilerini al
      const profileData = await fetchUserProfile(userId);
      console.log("Profil bilgileri alındı:", profileData);
      
      // Rozet bilgilerini loglayalım
      if (profileData.badges && profileData.badges.length > 0) {
        console.log("Alınan rozetler:", profileData.badges);
        profileData.badges.forEach((badge, index) => {
          console.log(`Rozet ${index + 1}:`, badge);
          console.log(`Rozet ${index + 1} resim URL:`, badge.badge_image_url);
        });
      } else {
        console.log("Kullanıcının rozeti bulunmuyor veya rozet verileri alınamadı.");
      }
      
      setProfileData(profileData);
      triggerHapticFeedback('success');
      
      // Davet bilgilerini al (sadece Telegram bağlamında)
      if (isTelegramContext) {
        try {
          const inviteInfo = await fetchInviteInfo(userId);
          console.log("Davet bilgileri:", inviteInfo);
          setInviteInfo(inviteInfo);
        } catch (err: any) {
          console.error("Davet bilgisi yüklenirken hata:", err);
          // Davet hatası critical değil, sadece log et
        }
      }
      
      // Kullanıcı istatistiklerini al
      try {
        const stats = await fetchUserStats(userId);
        console.log("Kullanıcı istatistikleri:", stats);
        setUserStats(stats);
      } catch (err: any) {
        console.error("İstatistik bilgileri yüklenirken hata:", err);
        setStatsError("İstatistikler yüklenemedi");
      } finally {
        setStatsLoading(false);
      }
    } catch (err: any) {
      console.error("Profil bilgisi yüklenirken hata:", err);
      setError(err.message || "Profil bilgileri yüklenemedi");
      triggerHapticFeedback("error");
      showNotification("error");
    } finally {
      setLoading(false);
    }
  };
  
  // İlk yükleme
  useEffect(() => {
    loadProfileData();
  }, []);
  
  // Davet linkini kopyala
  const copyInviteLink = async () => {
    if (!inviteInfo?.invite_link) return;
    
    try {
      // Modern clipboard API
      await navigator.clipboard.writeText(inviteInfo.invite_link);
      setLinkCopied(true);
      triggerHapticFeedback('medium');
      showNotification('success', 'Davet linki kopyalandı!');
      
      // 3 saniye sonra mesajı kaldır
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      // Fallback yöntemi
      const textArea = document.createElement('textarea');
      textArea.value = inviteInfo.invite_link;
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setLinkCopied(true);
        triggerHapticFeedback('medium');
        showNotification('success', 'Davet linki kopyalandı!');
        
        // 3 saniye sonra mesajı kaldır
        setTimeout(() => setLinkCopied(false), 3000);
      } catch (err) {
        showNotification('error', 'Link kopyalanamadı!');
      }
      
      document.body.removeChild(textArea);
    }
  };
  
  // Davet bilgilerini yenile
  const refreshInviteInfo = async () => {
    if (!isTelegramContext) return;
    
    try {
      const inviteData = await fetchInviteInfo();
      setInviteInfo(inviteData);
      triggerHapticFeedback('light');
      showNotification('success', 'Davet bilgileri güncellendi!');
    } catch (err) {
      triggerHapticFeedback('error');
      showNotification('error', 'Bilgiler güncellenemedi!');
    }
  };

  // Görev tamamlama oranını hesaplayan fonksiyon
  const calculateTaskProgress = (progress: number, target: number): number => {
    return Math.min(100, Math.round((progress / target) * 100));
  };

  // Ödül tipine göre ikon döndüren fonksiyon
  const getRewardIcon = (rewardType: string) => {
    switch(rewardType) {
      case 'xp':
        return <Activity size={14} className="text-blue-400" />;
      case 'stars':
        return <Star size={14} className="text-amber-400" />;
      case 'badge':
        return <Award size={14} className="text-purple-400" />;
      case 'nft':
        return <Gift size={14} className="text-green-400" />;
      default:
        return <Gift size={14} className="text-primary" />;
    }
  };

  if (loading) {
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

        <div className="relative z-10 p-4 max-w-4xl mx-auto">
          <SayfaBasligi title="Kozmik Profil" icon={User} />
          <div className="flex flex-col justify-center items-center py-14 bg-card/20 backdrop-blur-md rounded-xl border border-primary/10">
            <div className="relative">
              <Loader2 size={40} className="animate-spin text-primary z-10" />
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-md animate-pulse"></div>
            </div>
            <span className="mt-4 text-lg text-text/80">Astral kimliğin yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
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
        
        <div className="relative z-10 p-4 max-w-4xl mx-auto">
          <SayfaBasligi title="Kozmik Profil" icon={User} />
          <div className="bg-card/30 backdrop-blur-md text-error text-center rounded-xl p-6 border border-error/30 shadow-lg">
            <div className="bg-error/10 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-3">
              <AlertCircle size={28} className="text-error" />
            </div>
            <p className="text-lg font-medium mb-2">Profil Bilgileri Alınamadı</p>
            <p className="text-textSecondary mb-4">{error}</p>
            <Buton variant="secondary" size="sm" onClick={loadProfileData}>
              <RefreshCcw size={14} className="mr-1.5" />
              Tekrar Dene
            </Buton>
          </div>
        </div>
      </div>
    );
  }
  
  const userRole = getUserRole(profileData?.level || 1);
  const { nextLevelXp, progress } = calculateXpProgress(profileData?.xp || 0, profileData?.level || 1);

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
        <SayfaBasligi title="Kozmik Profil" icon={User} />
        
        {/* Ana profil kartı */}
        <div className="bg-card/40 backdrop-blur-md rounded-xl shadow-lg p-6 mb-6 border border-primary/20 relative overflow-hidden transition-all duration-500 hover:shadow-xl">
          {/* Dekoratif elementler */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-secondary/5 rounded-full blur-xl"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar ve seviye */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center border-2 border-primary/30 shadow-lg">
                <User size={48} className="text-text" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                Lvl {profileData?.level || 1}
              </div>
            </div>
            
            {/* Kullanıcı bilgileri */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2">
                <h2 className="text-2xl font-bold mb-1">{profileData?.first_name || "Yolcu"}</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${userRole.color} bg-surface/60`}>
                  {userRole.name}
                </div>
              </div>
              <p className="text-textSecondary text-sm mb-4">@{profileData?.username || "kozmik_yolcu"}</p>
              
              {/* XP ve ilerleme */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-textSecondary">Deneyim Puanı</span>
                  <span className="text-sm text-primary font-medium">{profileData?.xp || 0} XP</span>
                </div>
                <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-textSecondary">Mevcut Seviye: {profileData?.level || 1}</span>
                  <span className="text-xs text-textSecondary">Sonraki Seviye: {(profileData?.level || 1) + 1}</span>
                </div>
              </div>
              
              {/* Stars gösterimi */}
              <div className="flex items-center justify-center md:justify-start mb-2">
                <div className="flex items-center bg-amber-500/10 px-3 py-1.5 rounded-full">
                  <Star size={18} className="text-amber-400 mr-1.5" />
                  <span className="font-semibold text-amber-400">{profileData?.stars || 0} Stars</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* İstatistikler */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-3 text-center border border-primary/10 transform transition-all hover:scale-[1.02] hover:shadow-lg">
              <Activity size={18} className="text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-textSecondary mb-1">Giriş Serisi</p>
              <p className="text-lg font-semibold text-text">{profileData?.consecutive_login_days || 0} Gün</p>
            </div>
            
            <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-3 text-center border border-primary/10 transform transition-all hover:scale-[1.02] hover:shadow-lg">
              <Swords size={18} className="text-green-400 mx-auto mb-1" />
              <p className="text-xs text-textSecondary mb-1">Görev Serisi</p>
              <p className="text-lg font-semibold text-text">{profileData?.mission_streak || 0} Görev</p>
            </div>
            
            <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-3 text-center border border-primary/10 transform transition-all hover:scale-[1.02] hover:shadow-lg">
              <Users size={18} className="text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-textSecondary mb-1">Davet Ettiğin</p>
              <p className="text-lg font-semibold text-text">{profileData?.invited_users_count || 0}</p>
            </div>
          </div>
        </div>
      
        {/* Kullanıcı Rozetleri Bölümü */}
        {profileData?.badges && profileData.badges.length > 0 && (
          <div className="bg-card/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-primary/10">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Award className="mr-2 text-primary" />
              <span>Kazanılan Rozetler</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {profileData.badges.map((badge, index) => (
                <BadgeCard key={badge.badge_id || index} badge={badge} />
              ))}
            </div>
          </div>
        )}
        
        {/* Görevler ve Başarılar Bölümü */}
        {userStats && (
          <div className="bg-card/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-primary/10">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Target className="mr-2 text-primary" />
              <span>Görevler ve Başarılar</span>
            </h2>
            
            {/* İstatistik kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-3 text-center border border-primary/10">
                <div className="flex items-center justify-center mb-1">
                  <Swords size={18} className="text-green-400 mr-1.5" />
                  <span className="text-sm text-textSecondary">Tamamlanan Görevler</span>
                </div>
                <p className="text-lg font-semibold text-text">{userStats.total_missions_completed || 0}</p>
              </div>
              
              <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-3 text-center border border-primary/10">
                <div className="flex items-center justify-center mb-1">
                  <Award size={18} className="text-purple-400 mr-1.5" />
                  <span className="text-sm text-textSecondary">Kazanılan Rozetler</span>
                </div>
                <p className="text-lg font-semibold text-text">{userStats.total_badges_earned || 0}</p>
              </div>
              
              <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-3 text-center border border-primary/10">
                <div className="flex items-center justify-center mb-1">
                  <Trophy size={18} className="text-amber-400 mr-1.5" />
                  <span className="text-sm text-textSecondary">XP Sıralaması</span>
                </div>
                <p className="text-lg font-semibold text-text">{userStats.leaderboard_rank?.xp || '-'}</p>
              </div>
              
              <div className="bg-surface/50 backdrop-blur-sm rounded-lg p-3 text-center border border-primary/10">
                <div className="flex items-center justify-center mb-1">
                  <Calendar size={18} className="text-blue-400 mr-1.5" />
                  <span className="text-sm text-textSecondary">Katılım Günü</span>
                </div>
                <p className="text-lg font-semibold text-text">{profileData?.consecutive_login_days || 0}</p>
              </div>
            </div>
            
            {/* Günlük Görevler */}
            {userStats.tasks && userStats.tasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-text">Günlük Görevler</h3>
                <div className="space-y-3">
                  {userStats.tasks.map((task: any, index: number) => (
                    <div key={task.id || index} className="bg-surface/30 backdrop-blur-sm rounded-lg p-3 border border-primary/10">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-text">{task.title}</h4>
                        <div className="flex items-center text-sm">
                          {getRewardIcon(task.rewardType)}
                          <span className="ml-1 text-textSecondary">{task.reward}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-textSecondary mb-1">
                        <span>İlerleme</span>
                        <span>{task.progress} / {task.target}</span>
                      </div>
                      
                      <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${calculateTaskProgress(task.progress, task.target)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Başarılar */}
            {userStats.achievements && userStats.achievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-text">Başarılar</h3>
                <div className="space-y-3">
                  {userStats.achievements.map((achievement: any, index: number) => (
                    <div key={index} className="bg-surface/30 backdrop-blur-sm rounded-lg p-3 border border-primary/10">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-text">{achievement.name}</h4>
                        <div className="text-sm text-textSecondary">{achievement.reward}</div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-textSecondary mb-1">
                        <span>İlerleme</span>
                        <span>{achievement.progress} / {achievement.target}</span>
                      </div>
                      
                      <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${calculateTaskProgress(achievement.progress, achievement.target)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Davet linki */}
        <div className="bg-card/40 backdrop-blur-md rounded-xl shadow-lg mb-6 border border-primary/20 relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-xl"></div>
          
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text flex items-center mb-4">
              <Share2 size={18} className="text-blue-400 mr-2" />
              Galaktik Arkadaşları Davet Et
            </h3>
            
            {inviteLoading ? (
              <div className="flex justify-center py-6">
                <div className="relative">
                  <Loader2 size={24} className="animate-spin text-primary z-10" />
                  <div className="absolute -inset-1 rounded-full bg-primary/20 blur-sm animate-pulse"></div>
                </div>
              </div>
            ) : inviteInfo ? (
              <div className="bg-surface/30 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                <p className="text-sm text-textSecondary mb-3 flex items-center">
                  <Star size={16} className="text-amber-400 mr-1.5" />
                  Davet ettiğin her arkadaş için <span className="text-amber-400 font-medium ml-1">{inviteInfo.reward_per_invite_stars} Stars</span> kazanırsın.
                </p>
                
                {/* Davet linki */}
                <div className="flex items-center bg-background/60 rounded-lg border border-primary/20 p-2 mb-4 overflow-hidden">
                  <input 
                    type="text" 
                    value={inviteInfo.invite_link}
                    readOnly
                    className="bg-transparent border-none outline-none text-sm flex-grow text-textSecondary px-2 truncate"
                  />
                  <Buton 
                    onClick={copyInviteLink} 
                    variant="ghost" 
                    size="sm"
                    className="flex-shrink-0 ml-2 relative"
                  >
                    {linkCopied ? (
                      <div className="flex items-center text-success">
                        <Check size={16} className="mr-1" />
                        <span className="text-xs">Kopyalandı</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Copy size={16} className="mr-1" />
                        <span className="text-xs">Kopyala</span>
                      </div>
                    )}
                  </Buton>
                </div>
                
                {/* Davet bilgisi */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-textSecondary">
                    <Users size={14} className="mr-1 text-blue-400" />
                    <span>Toplam davet: {inviteInfo.successful_invites}</span>
                  </div>
                  <Buton onClick={refreshInviteInfo} size="sm" variant="ghost" className="text-primary">
                    <RefreshCcw size={14} className="mr-1"/>
                    Yenile
                  </Buton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center bg-surface/30 backdrop-blur-sm rounded-lg border border-primary/10">
                <div className="bg-blue-400/10 w-16 h-16 flex items-center justify-center rounded-full mb-3">
                  <Share2 size={24} className="text-blue-400" />
                </div>
                <p className="mb-2 font-medium">Davet bilgisi alınamıyor</p>
                <p className="text-xs mb-3 text-textSecondary">Telegram üzerinden giriş yapmış olmalısın</p>
                <Buton onClick={() => window.Telegram?.WebApp?.expand()} size="sm" variant="primary" className="mx-auto">
                  <RefreshCcw size={14} className="mr-1"/>
                  Telegram'da Aç
                </Buton>
              </div>
            )}
          </div>
        </div>
        
        {/* Tamamlanan görevlerin hikayesi */}
        <div className="bg-card/40 backdrop-blur-md rounded-xl shadow-lg relative overflow-hidden border border-primary/20">
          <div className="absolute top-0 left-0 w-40 h-40 bg-green-500/5 rounded-full blur-xl"></div>
          
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text flex items-center mb-4">
              <Swords size={18} className="text-green-400 mr-2" />
              Kozmik Yolculuk Hikayen
            </h3>

            {profileData?.mission_stories && profileData.mission_stories.length > 0 ? (
              <div className="space-y-4">
                {profileData.mission_stories.map((story) => (
                  <div 
                    key={story.id} 
                    className="bg-surface/30 backdrop-blur-sm rounded-lg p-4 border border-primary/10 transform transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start">
                      <div className="bg-green-400/10 p-2 rounded-full mr-3 flex-shrink-0">
                        <Swords size={18} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-primary mb-1">
                          {new Date(story.timestamp).toLocaleDateString('tr-TR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-text">{story.story_text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center bg-surface/30 backdrop-blur-sm rounded-lg border border-primary/10">
                <div className="bg-green-400/10 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                  <Clock size={24} className="text-green-400" />
                </div>
                <p className="text-lg font-medium mb-2">Henüz görev hikayen oluşmadı</p>
                <p className="text-sm text-textSecondary max-w-md mx-auto">
                  Görevleri tamamladıkça burada hikaye oluşacak. Daha fazla görev tamamlamak için görevler sayfasını ziyaret et.
                </p>
                <Link to="/gorevler">
                  <Buton variant="primary" className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 border-0">
                    Görevlere Git
                  </Buton>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil; 