import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SayfaBasligi from '../components/SayfaBasligi';
import XPBar from '../components/XPBar';
import StarsBalance from '../components/StarsBalance';
import RozetKarti from '../components/RozetKarti';
import { useTelegram } from '../contexts/TelegramContext';
import { UserProfile, InviteInfoResponse, MissionStory, UserBadgeSchema } from '../types';
import { fetchUserProfile, fetchInviteInfo } from '../utils/api';
import { Clipboard, Check, Gift, Gem, Swords, User, Star, Activity, Share2, Copy, ShieldAlert, Loader2, Users, Award, RefreshCcw, AlertCircle, Badge, CheckCircle, LucideInfo, Clock } from 'lucide-react';
import Buton from '../components/Buton';
import { triggerHapticFeedback, showNotification } from '../utils/hapticFeedback';

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

const Profil: React.FC = () => {
  const { user, getTelegramUserId, isTelegramContext } = useTelegram();
  
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
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
    
    try {
      // Kullanıcı profil bilgilerini al
      const profileData = await fetchUserProfile(getTelegramUserId()?.toString() || "");
      setProfileData(profileData);
      triggerHapticFeedback('success');
      
      // Davet bilgilerini al (sadece Telegram bağlamında)
      if (isTelegramContext) {
        try {
          const inviteInfo = await fetchInviteInfo();
          setInviteInfo(inviteInfo);
        } catch (err: any) {
          console.error("Davet bilgisi yüklenirken hata:", err);
          // Davet hatası critical değil, sadece log et
        }
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

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto pb-20">
        <SayfaBasligi title="Profil" icon={User} />
        <div className="flex justify-center items-center py-10">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="ml-3 text-lg text-textSecondary">Profil yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto pb-20">
        <SayfaBasligi title="Profil" icon={User} />
        <div className="p-4 bg-error/10 text-error text-center rounded-lg mb-4 border border-error/30">
          <AlertCircle size={20} className="inline-block mr-2" />
          <span>{error}</span>
        </div>
        <Buton 
          onClick={() => window.location.reload()} 
          variant="secondary" 
          className="mx-auto block"
        >
          <RefreshCcw size={16} className="mr-2" />
          Yeniden Dene
        </Buton>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-4 max-w-4xl mx-auto pb-20">
        <SayfaBasligi title="Profil" icon={User} />
        <div className="text-center py-10 text-textSecondary">
          Profil bilgisi bulunamadı.
        </div>
      </div>
    );
  }

  const { nextLevelXp, progress } = calculateXpProgress(profileData.xp, profileData.level);
  
  return (
    <div className="p-4 max-w-4xl mx-auto pb-20">
      <SayfaBasligi title="Profil" icon={User} />
      
      {/* Profil kartı */}
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="p-6">
          {/* Kullanıcı adı ve avatar */}
          <div className="flex items-center mb-6">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center text-primary">
              {user?.photo_url ? (
                <img 
                  src={user.photo_url} 
                  alt={user.first_name || "Kullanıcı"} 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-text">
                {profileData.username || user?.first_name || "Misafir"}
              </h2>
              <div className="flex items-center">
                <span className={`text-sm ${getUserRole(profileData.level).color}`}>
                  {getUserRole(profileData.level).name}
                </span>
                <span className="mx-2 text-textMuted">•</span>
                <span className="text-sm text-textSecondary">
                  Seviye {profileData.level}
                </span>
              </div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-textSecondary">XP: {profileData.xp}</span>
              <span className="text-sm text-textSecondary">Sonraki seviye: {nextLevelXp}</span>
            </div>
            <XPBar progress={progress} />
          </div>
          
          {/* Stars Balance */}
          {profileData.stars_enabled && (
            <div className="mb-6">
              <StarsBalance balance={profileData.stars} className="justify-start" />
            </div>
          )}
          
          {/* İstatistikler */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-surface border border-border/20 rounded-lg p-3 text-center">
              <Activity size={18} className="text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-textSecondary mb-1">Görev Serisi</p>
              <p className="text-lg font-semibold text-text">{profileData.mission_streak || 0}</p>
            </div>
            
            <div className="bg-surface border border-border/20 rounded-lg p-3 text-center">
              <Users size={18} className="text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-textSecondary mb-1">Davet Ettiğin</p>
              <p className="text-lg font-semibold text-text">{profileData.invited_users_count || 0}</p>
            </div>
            
            <div className="bg-surface border border-border/20 rounded-lg p-3 text-center">
              <Award size={18} className="text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-textSecondary mb-1">Rozetler</p>
              <p className="text-lg font-semibold text-text">{profileData.badges?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rozetler */}
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-text flex items-center">
              <Badge size={18} className="text-primary mr-2" />
              Kazanılan Rozetler
            </h3>
            {profileData.badges && profileData.badges.length > 0 && (
              <span className="text-sm text-textSecondary">{profileData.badges.length} rozet</span>
            )}
          </div>
          
          {profileData.badges && profileData.badges.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 justify-items-center">
              {profileData.badges.map((badge) => (
                <RozetKarti key={badge.badge_id} badge={badge} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-textSecondary border border-dashed border-border rounded-lg">
              <Badge size={32} className="mx-auto mb-2 opacity-30" />
              <p>Henüz rozet kazanmadın</p>
              <p className="text-sm mt-1">Görevleri tamamlayarak rozetler kazanabilirsin</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Davet linki (sadece Telegram bağlamında) */}
      {isTelegramContext && (
        <div className="bg-surface rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text flex items-center mb-4">
              <Share2 size={18} className="text-primary mr-2" />
              Arkadaşlarını Davet Et
            </h3>
            
            {inviteLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : inviteInfo ? (
              <div>
                <p className="text-sm text-textSecondary mb-3">
                  Davet ettiğin her arkadaş için {inviteInfo.reward_per_invite_stars} Stars kazanırsın.
                </p>
                
                {/* Davet linki */}
                <div className="flex items-center bg-background rounded-lg border border-border p-2 mb-4 overflow-hidden">
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
                      <Check size={16} className="text-success" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </Buton>
                </div>
                
                {/* Davet bilgisi */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-textSecondary">Toplam başarılı davet: {inviteInfo.successful_invites}</span>
                  <Buton onClick={refreshInviteInfo} size="sm" variant="ghost" className="text-primary">
                    <RefreshCcw size={14} className="mr-1"/>
                    Yenile
                  </Buton>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-textSecondary">
                <p>Davet bilgisi yüklenemedi.</p>
                <Buton onClick={refreshInviteInfo} size="sm" variant="ghost" className="mt-2">
                  <RefreshCcw size={14} className="mr-1"/>
                  Tekrar Dene
                </Buton>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Tamamlanan görevlerin hikayesi - Yakında */}
      <div className="bg-surface/50 border border-primary/10 rounded-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 m-4">
          <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
            Yakında
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-text flex items-center mb-4">
          <Swords size={18} className="text-primary mr-2" />
          Görev Hikayen
        </h3>
        
        <p className="text-sm text-textSecondary">
          Tamamladığın görevler burada bir hikaye olarak görüntülenecek.
        </p>
      </div>
    </div>
  );
};

export default Profil; 