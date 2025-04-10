import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SayfaBasligi from '../components/SayfaBasligi';
import XPBar from '../components/XPBar';
import StarsBalance from '../components/StarsBalance';
import RozetKarti from '../components/RozetKarti';
import { useTelegram } from '../contexts/TelegramContext';
import { UserProfile, InviteInfoResponse, MissionStory, UserBadgeSchema } from '../types';
import { fetchUserProfile, fetchInviteInfo } from '../utils/api';
import { Clipboard, Check, Gift, Gem, Swords, User, Star, Activity, Share2, Copy, ShieldAlert, Loader2, Users, Award } from 'lucide-react';

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
  const { user: telegramUser, isTelegramContext } = useTelegram();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [referralInfo, setReferralInfo] = useState<ReferralInfoResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingReferral, setIsLoadingReferral] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Telegram User
  const telegramId = telegramUser?.id || 0;
  const telegramName = telegramUser?.first_name || "İsimsiz Yolcu";
  const telegramUsername = telegramUser?.username ? `@${telegramUser.username}` : null;
  const telegramProfilePhoto = telegramUser?.photo_url;
  
  // Ödev için sabit profil verisi
  const [profileStats] = useState({
    level: 7,
    xp: 3800,
    xpToNextLevel: 5500 - 3800,
    nextLevel: 8,
    stars: 240,
    badge_count: 3,
    nft_count: 2,
    streak: 5,
    role: getUserRole(7)
  });
  
  // Davet linki kopyalama fonksiyonu
  const copyInviteLink = () => {
    if (referralInfo && referralInfo.invite_link) {
      navigator.clipboard.writeText(referralInfo.invite_link).then(() => {}) .catch(e => {});
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  // Ödev için sabit değerlerle "davet et" butonu
  const [mockInviteLink] = useState('https://t.me/arayis_evreni_bot?start=invite_12345');

  // Gerçekte profil verisi çekme fonksiyonu (şu an aktif değil)
  const fetchData = async () => {
    setIsLoadingProfile(true);
    setIsLoadingReferral(true);
    setError(null);

    try {
      // const profile = await fetchUserProfile();
      // setProfileData(profile);
      // const referral = await fetchInviteInfo();
      // setReferralInfo(referral);
    } catch (err) {
      setError('Profil bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsLoadingProfile(false);
      setIsLoadingReferral(false);
    }
  };

  /* Yerel API bağlantısı aktif olmadığı için şu an kullanılmıyor
  useEffect(() => {
    fetchData();
  }, []);*/

  return (
    <div className="p-4 max-w-3xl mx-auto pb-20">
      <SayfaBasligi title="Profilim" icon={User} />

      {isLoadingProfile && !error && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-error/10 text-error text-center rounded-lg mb-4 border border-error/30 flex items-center justify-center">
          <ShieldAlert size={20} className="mr-2" /> {error}
        </div>
      )}

      {!isLoadingProfile && !error && (
        <div className="space-y-6">
          {/* Profil Özeti */}
          <div className="bg-surface rounded-xl p-5 shadow-md border border-white/5">
            <div className="flex items-center space-x-4">
              {/* Profil Resmi */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gray-300 overflow-hidden border-4 border-primary flex items-center justify-center text-white font-bold text-2xl">
                  {telegramProfilePhoto ? (
                    <img src={telegramProfilePhoto} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    telegramName?.charAt(0)
                  )}
                </div>
                {/* Seviye Rozeti */}
                <div className="absolute -bottom-2 -right-2 bg-primary text-white text-xs rounded-full w-8 h-8 flex items-center justify-center border-2 border-surface">
                  Lv{profileStats.level}
                </div>
              </div>

              {/* Kullanıcı Bilgileri */}
              <div className="flex-grow">
                <h3 className="font-bold text-lg text-text">{telegramName}</h3>
                {telegramUsername && (
                  <p className="text-sm text-textSecondary">{telegramUsername}</p>
                )}
                <div className="mt-1 flex items-center">
                  <span className={`text-xs ${profileStats.role.color} font-medium`}>
                    {profileStats.role.name}
                  </span>
                </div>
              </div>

              {/* Telegram ID Görüntüleme */}
              {telegramId && (
                <div className="text-right">
                  <div className="text-xs text-textSecondary mb-1">Telegram ID</div>
                  <div className="text-xs font-mono bg-background p-1 rounded">
                    {telegramId}
                  </div>
                </div>
              )}
            </div>

            {/* XP Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-textSecondary mb-1">
                <span>Seviye {profileStats.level}</span>
                <span>Seviye {profileStats.nextLevel}</span>
              </div>
              <div className="w-full bg-background rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full"
                  style={{
                    width: `${
                      ((profileStats.xp - LEVEL_THRESHOLDS[profileStats.level]) /
                        (LEVEL_THRESHOLDS[profileStats.nextLevel] -
                          LEVEL_THRESHOLDS[profileStats.level])) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-textSecondary mt-1">
                {profileStats.xpToNextLevel} XP sonraki seviyeye
              </div>
            </div>
          </div>

          {/* Stars ve İstatistikler */}
          <div className="bg-surface rounded-xl p-5 shadow-md border border-white/5">
            <h3 className="font-semibold text-lg mb-4 text-textSecondary">Stars Bakiyesi</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="text-2xl font-bold text-amber-400 flex items-center">
                <Star size={24} className="mr-2 fill-amber-400 text-amber-400" /> {profileStats.stars}
              </div>
            </div>

            {/* İstatistikler Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-background rounded-lg p-3 text-center">
                <div className="text-textSecondary text-xs mb-1">Görev Serisi</div>
                <div className="font-semibold text-text flex items-center justify-center">
                  <Activity size={16} className="mr-1 text-success" /> {profileStats.streak} gün
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 text-center">
                <div className="text-textSecondary text-xs mb-1">Toplam XP</div>
                <div className="font-semibold text-text">
                  {profileStats.xp} XP
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 text-center">
                <div className="text-textSecondary text-xs mb-1">Rozetler</div>
                <div className="font-semibold text-text flex items-center justify-center">
                  <Award size={16} className="mr-1 text-primary" /> {profileStats.badge_count}
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 text-center">
                <div className="text-textSecondary text-xs mb-1">NFT'ler</div>
                <div className="font-semibold text-text flex items-center justify-center">
                  <Gift size={16} className="mr-1 text-secondary" /> {profileStats.nft_count}
                </div>
              </div>
            </div>
          </div>

          {/* Arkadaşları Davet Et */}
          <div className="bg-surface rounded-xl p-5 shadow-md border border-white/5">
            <h3 className="font-semibold text-lg mb-3 text-textSecondary flex items-center">
              <Users size={20} className="mr-2" /> Arkadaşlarını Davet Et
            </h3>
            <p className="text-sm text-textSecondary mb-4">
              Her davet ettiğin arkadaş için <b>50 stars</b> kazanırsın!
            </p>

            <div className="relative">
              <div className="bg-background p-3 rounded-lg text-sm font-mono text-textSecondary break-all">
                {mockInviteLink}
              </div>
              <button
                onClick={copyInviteLink}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-primary text-white rounded-md"
              >
                {inviteCopied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-textSecondary">Başarılı Davetler</div>
                <div className="font-semibold">0 kişi</div>
              </div>
              <div>
                <div className="text-xs text-textSecondary">Kazanılan Stars</div>
                <div className="font-semibold text-amber-400">0 ⭐</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tip tanımları
interface ProfileData {
  telegram_id: number;
  username: string;
  xp: number;
  level: number;
  stars: number;
  consecutive_login_days: number;
  mission_streak: number;
  // Diğer profil alanları...
}

interface ReferralInfoResponse {
  invite_link: string;
  successful_invites: number;
  reward_per_invite_stars: number;
}

export default Profil; 