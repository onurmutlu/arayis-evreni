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
                <User size={32} />
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold">
                {user?.first_name || profileData.username || "Kullanıcı"}
              </h2>
              <p className="text-textSecondary text-sm">
                UID: {profileData.telegram_id || getTelegramUserId()}
              </p>
            </div>
          </div>
          
          {/* XP Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-lg font-semibold flex items-center">
                Seviye {profileData.level}
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                  {profileData.xp} XP
                </span>
              </span>
              <span className="text-sm text-textSecondary">
                Sonraki seviye: {nextLevelXp} XP
              </span>
            </div>
            <XPBar progress={progress} />
          </div>
          
          {/* Streak ve rozetler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
            {/* Streak bilgisi */}
            <div className="bg-muted/40 p-4 rounded-lg flex items-center">
              <div className="bg-secondary/10 rounded-full w-10 h-10 flex items-center justify-center text-secondary mr-4">
                <Star size={20} />
              </div>
              <div>
                <h3 className="font-medium">Görev Serisi</h3>
                <p className="text-2xl font-bold">{profileData.mission_streak || 0} gün</p>
              </div>
            </div>
            
            {/* Rozet sayısı */}
            <div className="bg-muted/40 p-4 rounded-lg flex items-center">
              <div className="bg-amber-500/10 rounded-full w-10 h-10 flex items-center justify-center text-amber-500 mr-4">
                <Award size={20} />
              </div>
              <div>
                <h3 className="font-medium">Rozetler</h3>
                <p className="text-2xl font-bold">{profileData.badges?.length || 0} adet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rozetler */}
      {profileData.badges && profileData.badges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Award size={18} className="mr-2 text-amber-500" />
            Kazanılan Rozetler
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profileData.badges.map((badge, index) => (
              <div key={index} className="bg-surface p-3 rounded-lg flex flex-col items-center text-center">
                <div className="w-14 h-14 mb-2">
                  {badge.badge_image_url ? (
                    <img 
                      src={badge.badge_image_url} 
                      alt={badge.badge_name} 
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <div className="w-full h-full bg-amber-500/10 rounded-full flex items-center justify-center">
                      <Award size={24} className="text-amber-500" />
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-sm mb-1">{badge.badge_name}</h4>
                <p className="text-textSecondary text-xs">
                  {new Date(badge.earned_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Davet kartı */}
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Users size={20} className="mr-2" />
              Davet Sistemi
            </h3>
            <Buton
              onClick={refreshInviteInfo}
              variant="ghost"
              size="sm"
              disabled={inviteLoading}
            >
              {inviteLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCcw size={16} />
              )}
            </Buton>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-textSecondary">Başarılı Davetler</span>
              <span className="font-semibold">{inviteInfo?.successful_invites || 0}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inviteInfo?.invite_link || ''}
                readOnly
                className="flex-1 p-2 bg-background border border-border rounded text-sm"
              />
              <Buton
                onClick={copyInviteLink}
                variant="primary"
                size="sm"
                className="min-w-[100px]"
              >
                {linkCopied ? (
                  <>
                    <CheckCircle size={16} className="mr-1" />
                    Kopyalandı
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-1" />
                    Kopyala
                  </>
                )}
              </Buton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil; 