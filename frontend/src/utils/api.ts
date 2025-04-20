// src/utils/api.ts
// Placeholder API fonksiyonları
// Gerçek uygulamada fetch veya axios ile backend endpoint'lerine bağlanacak

import {
    UserProfile, Mission, Nft, DAOProposal, CompleteMissionResponse, BuyNFTResponse, UseStarsResponse, VoteResponse, UserWallet, TonWalletInfo, Notification,
    DailyBonusStatus, ClaimDailyBonusResponse, InviteInfoResponse, LeaderboardResponse, UnlockVipResponse, TokenResponse, // Yeni tipler
    NFTCategory, ProposalStatus, StarTransactionHistoryResponse, Badge // Enums needed for placeholders
} from "../types";

// .env'den API_URL alınıyor, en sonda / olmamalı, ona göre endpoint çağrılarda düzeltme yapılacak
const API_BASE_URL = 'http://localhost:8000';

// --- Token Management ---
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
    // Kalıcılık için localStorage'a kaydet
    if (token) { 
        localStorage.setItem('authToken', token); 
    } else { 
        localStorage.removeItem('authToken'); 
    }
}

export function getAuthToken(): string | null {
    // localStorage'dan al, yoksa memory'den al
    return authToken || localStorage.getItem('authToken');
}

// --- API Call Helper ---
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    // Endpoint / ile başlıyorsa, o şekilde kullan
    const url = endpoint.startsWith('/') 
        ? `${API_BASE_URL}${endpoint}`  // /profile/123 -> http://api.com/profile/123
        : `${API_BASE_URL}/${endpoint}`; // profile/123 -> http://api.com/profile/123
    
    // Headers objesi oluştur
    const headers = new Headers(options.headers || {});
    // Content-Type'ı sadece body varsa veya belirtilmemişse ekle
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`); // Set ile ekle
    }

    const config: RequestInit = {
        ...options,
        headers, // Headers objesini kullan
    };

    try {
        console.log(`API Call: ${options.method || 'GET'} ${url}`); // Log the call
        const response = await fetch(url, config);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: `HTTP error! Status: ${response.status}` }));
            console.error(`API Error ${response.status} for ${endpoint}:`, errorData.detail);
            throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
        }
        if (response.status === 204) {
            return undefined as T;
        }
        const responseData = await response.json();
        console.log(`API Response for ${endpoint}:`, responseData);
        return responseData as T;
    } catch (error: any) {
        console.error(`API call failed for endpoint ${endpoint}:`, error);
        throw new Error(error.message || "Bir şeyler ters gitti. Lütfen tekrar deneyin.");
    }
}

// --- Auth API ---
export const loginWithInitData = async (initData: string): Promise<TokenResponse> => {
    // console.log("API CALL: loginWithInitData");
    const response = await apiCall<TokenResponse>(`/api/token`, {
        method: 'POST',
        body: JSON.stringify({ initData: initData })
    });
    if (response.access_token) {
        setAuthToken(response.access_token);
        console.log("Auth token set.");
    }
    return response;
};

// --- USER API ---
export const fetchUserProfile = async (uid?: string): Promise<UserProfile> => {
    console.log(`API CALL: fetchUserProfile(${uid})`);
    try {
        uid = uid || getTelegramUserIdForApi();
        
        // Demo kullanıcısı için fallback
        if (uid === 'demo123' || uid === '123456') {
            console.log("📌 Demo kullanıcısı için yerel profil verileri kullanılıyor");
            // Demo kullanıcısı için statik veriler
            return {
                id: 12345,
                telegram_id: parseInt(uid) || 12345,
                username: "demo123",
                first_name: "Demo Kullanıcı",
                xp: 750,
                level: 3,
                stars: 500,
                stars_enabled: true,
                has_vip_access: false,
                created_at: new Date().toISOString(),
                consecutive_login_days: 5,
                mission_streak: 3,
                invited_users_count: 2,
                badges: [
                    {
                        badge_id: 1,
                        badge_name: "Hoş Geldin",
                        badge_image_url: "/badges/welcome-badge.png",
                        earned_at: new Date().toISOString()
                    },
                    {
                        badge_id: 2,
                        badge_name: "Görev Kahramanı",
                        badge_image_url: "/badges/mission-badge.png",
                        earned_at: new Date().toISOString()
                    },
                    {
                        badge_id: 3,
                        badge_name: "Flört Ustası",
                        badge_image_url: "/badges/flirt-badge.png",
                        earned_at: new Date().toISOString()
                    }
                ],
                completed_missions: [
                    {
                        mission_id: 1,
                        completed_at: new Date().toISOString()
                    },
                    {
                        mission_id: 2,
                        completed_at: new Date().toISOString()
                    }
                ],
                mission_stories: [
                    {
                        id: 1,
                        mission_id: 1,
                        story_text: "İlk görevini başarıyla tamamladın!",
                        timestamp: new Date().toISOString()
                    }
                ],
                nft_count: 2
            };
        }
        
        return await apiCall<UserProfile>(`/profile/${uid}`);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        
        // Fallback to default demo profile when the API fails
        console.log("📌 API başarısız, demo profili kullanılıyor");
        return {
            id: 12345,
            telegram_id: 0,
            username: "demo123",
            first_name: "Demo",
            xp: 750,
            level: 3,
            stars: 500,
            stars_enabled: true,
            has_vip_access: false,
            created_at: new Date().toISOString(),
            consecutive_login_days: 5,
            mission_streak: 3,
            invited_users_count: 2,
            badges: [
                {
                    badge_id: 1,
                    badge_name: "Hoş Geldin",
                    badge_image_url: "/badges/welcome-badge.png",
                    earned_at: new Date().toISOString()
                },
                {
                    badge_id: 2,
                    badge_name: "Görev Kahramanı",
                    badge_image_url: "/badges/mission-badge.png",
                    earned_at: new Date().toISOString()
                },
                {
                    badge_id: 4,
                    badge_name: "Analiz Uzmanı",
                    badge_image_url: "/badges/analyst-badge.png",
                    earned_at: new Date().toISOString()
                }
            ],
            completed_missions: [
                {
                    mission_id: 1,
                    completed_at: new Date().toISOString()
                }
            ],
            mission_stories: [
                {
                    id: 1,
                    mission_id: 1,
                    story_text: "Demo kullanıcısı ilk görevini tamamladı!",
                    timestamp: new Date().toISOString()
                }
            ],
            nft_count: 2
        };
    }
};

export const fetchUserWallet = async (uid?: string): Promise<any> => {
    const userId = uid || getTelegramUserIdForApi();
    console.log(`API CALL: fetchUserWallet for ${userId}`);
    return apiCall<any>(`/wallet/${userId}`);
};

export const useStars = async (amount: number, reason: string): Promise<UseStarsResponse> => {
    // console.warn(`API CALL: useStars ${amount} for ${reason}`);
    return apiCall<UseStarsResponse>(`/api/users/use-stars`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason })
    });
}

// --- Daily Bonus API ---
export const fetchDailyBonusStatus = async (): Promise<DailyBonusStatus> => {
    //  console.warn(`API CALL: fetchDailyBonusStatus`);
     return apiCall<DailyBonusStatus>('/api/users/daily-bonus');
};

export const claimDailyBonus = async (): Promise<ClaimDailyBonusResponse> => {
    //  console.warn(`API CALL: claimDailyBonus`);
     return apiCall<ClaimDailyBonusResponse>('/api/users/claim-daily-bonus', { method: 'POST' });
};

// --- Invite API ---
export const fetchInviteInfo = async (userId?: string): Promise<InviteInfoResponse> => {
  console.log(`API CALL: fetchInviteInfo`);
  try {
    const uid = userId || getTelegramUserIdForApi();
    
    // Demo kullanıcısı için mock veri döndür
    if (uid === 'demo123' || uid === '123456') {
      console.log("📌 Demo kullanıcısı için davet bilgileri simülasyonu kullanılıyor");
      await new Promise(resolve => setTimeout(resolve, 300)); // Gerçekçi gecikme
      return {
        invite_link: "https://t.me/ArayisEvreniBot?start=invite_" + uid,
        successful_invites: 2,
        reward_per_invite_stars: 50
      };
    }
    
    // API'ye istek at - Kullanıcı kimliğiyle
    try {
      // İlk olarak user/${uid}/invite-info endpoint'ini dene
      const response = await apiCall<InviteInfoResponse>(`/user/${uid}/invite-info`);
      return response;
    } catch (error) {
      console.log("Kullanıcı ID'li endpoint çalışmadı, alternatif endpoint deneniyor");
      // Alternatif endpoint'i dene
      return await apiCall<InviteInfoResponse>('/api/users/invite-info');
    }
  } catch (error) {
    console.error("Error fetching invite info:", error);
    // Fallback veri
    return {
      invite_link: "https://t.me/ArayisEvreniBot?start=invite_demo",
      successful_invites: 0,
      reward_per_invite_stars: 50
    };
  }
};

// --- MISSIONS API ---
export const fetchMissions = async (): Promise<Mission[]> => {
    console.log(`API CALL: fetchMissions`);
    try {
        const demoUserId = getTelegramUserIdForApi();
        const response = await apiCall<Mission[]>(`/missions/${demoUserId}`);
        return response;
    } catch (error) {
        console.error("Error fetching missions:", error);
        // Hata durumunda boş liste döndür
        return [];
    }
};

export const completeMission = async (missionId: number): Promise<CompleteMissionResponse> => {
    console.log(`API CALL: completeMission ${missionId}`);
    try {
        const uid = getTelegramUserIdForApi();
        const response = await apiCall<CompleteMissionResponse>(`/api/missions/gorev-tamamla`, {
            method: 'POST',
            body: JSON.stringify({ uid, gorev_id: missionId })
        });
        return response;
    } catch (error) {
        console.error("Error completing mission:", error);
        throw error;
    }
};

// Kullanıcı istatistiklerini getir
export const fetchUserStats = async (uid?: string): Promise<any> => {
  console.log(`API CALL: fetchUserStats`);
  try {
    uid = uid || getTelegramUserIdForApi();
    
    // Demo kullanıcısı için mock veri
    if (uid === 'demo123' || uid === '123456') {
      console.log("📌 Demo kullanıcısı için istatistik verileri kullanılıyor");
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        total_missions_completed: 12,
        total_badges_earned: 4,
        leaderboard_rank: {
          xp: 24,
          missions: 18,
          badges: 15
        },
        stars_spent: 350,
        stars_earned: 850,
        achievements: [
          { name: "Görev Tamamlayıcı", progress: 12, target: 20, reward: "50 Stars" },
          { name: "Rozet Koleksiyoncusu", progress: 4, target: 10, reward: "Özel NFT" },
          { name: "Etkinlik Katılımcısı", progress: 2, target: 5, reward: "100 XP" }
        ],
        tasks: [
          { id: 1, title: "3 Görev Tamamla", progress: 1, target: 3, reward: "25 XP", rewardType: "xp" },
          { id: 2, title: "2 Arkadaşını Davet Et", progress: 1, target: 2, reward: "50 Stars", rewardType: "stars" },
          { id: 3, title: "5 Gün Arka Arkaya Giriş Yap", progress: 2, target: 5, reward: "Özel Rozet", rewardType: "badge" }
        ]
      };
    }
    
    // API'den kullanıcı istatistiklerini al
    try {
      return await apiCall<any>(`/user/${uid}/stats`);
    } catch (error) {
      console.log("Ana endpoint çalışmadı, alternatif endpoint deneniyor");
      return await apiCall<any>(`/api/users/${uid}/stats`);
    }
  } catch (error) {
    console.error("Error fetching user stats:", error);
    // Fallback to default stats
    return {
      total_missions_completed: 0,
      total_badges_earned: 0,
      leaderboard_rank: {
        xp: 0,
        missions: 0,
        badges: 0
      },
      stars_spent: 0,
      stars_earned: 0,
      achievements: [],
      tasks: []
    };
  }
};

// API istekleri için Telegram User ID'yi al
// Context'ten veya environment'tan fallback değeri al
function getTelegramUserIdForApi(): string {
    // window.Telegram var mı kontrol et
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        const userId = window.Telegram.WebApp.initDataUnsafe.user.id;
        // NaN kontrolü
        if (!isNaN(userId)) {
            return userId.toString();
        }
    }
    
    // Fallback user ID'yi kontrol et
    const fallbackId = import.meta.env.VITE_FALLBACK_USER_ID;
    if (fallbackId && !isNaN(Number(fallbackId))) {
        return fallbackId;
    }
    
    // Sabit demo ID döndür
    console.log("⚠️ Geçerli bir user ID bulunamadı, demo123 kullanılıyor");
    return "demo123";
}

// --- VIP API ---
export const fetchVipStatus = async (): Promise<boolean> => {
  console.log(`API CALL: fetchVipStatus`);
  try {
    const uid = getTelegramUserIdForApi();
    const response = await apiCall<{ has_vip_access: boolean }>(`/vip/status/${uid}`);
    return response.has_vip_access;
  } catch (error) {
    console.error("Error fetching VIP status:", error);
    return false;
  }
};

export const purchaseVip = async (): Promise<UnlockVipResponse> => {
  console.log(`API CALL: purchaseVip`);
  try {
    const uid = getTelegramUserIdForApi();
    return await apiCall<UnlockVipResponse>(`/vip/purchase`, {
      method: 'POST',
      body: JSON.stringify({ uid })
    });
  } catch (error) {
    console.error("Error purchasing VIP:", error);
    throw error;
  }
};

// --- Leaderboard API ---
export const fetchLeaderboard = async (category: string, limit: number = 50, timeFrame: string = 'all'): Promise<LeaderboardResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard?category=${category}&limit=${limit}&time_frame=${timeFrame}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Liderlik tablosu yüklenirken bir hata oluştu: ${response.status}`);
    }

    const data = await response.json();

    // API yanıtını frontend yapısına dönüştür
    const leaderboardResponse: LeaderboardResponse = {
      users: data.entries.map((entry: any, index: number) => ({
        id: entry.user_id.toString(),
        username: entry.username,
        avatar: entry.avatar,
        xp: entry.value,
        level: entry.level || 1,
        stars: entry.stars || 0,
        badges: entry.badges || 0,
        rank: entry.rank || index + 1,
        delta: entry.delta
      })),
      stats: data.stats ? {
        totalParticipants: data.stats.total_participants || 0,
        competitionEndDate: data.stats.competition_end_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        prizePool: data.stats.prize_pool || "5000 TON"
      } : undefined
    };

    return leaderboardResponse;
  } catch (error) {
    console.error("Liderlik tablosu yüklenirken hata oluştu:", error);
    return null;
  }
};

// --- NFTs API ---
export const fetchAllNfts = async (): Promise<Nft[]> => {
    console.log(`API CALL: fetchAllNfts`);
    try {
        const response = await apiCall<Nft[]>(`/nfts`);
        return response;
    } catch (error) {
        console.error("Error fetching all NFTs:", error);
        throw error;
    }
};

export const fetchOwnedNfts = async (): Promise<Nft[]> => {
    console.log(`API CALL: fetchOwnedNfts`);
    try {
        const uid = getTelegramUserIdForApi();
        const wallet = await apiCall<any>(`/wallet/${uid}`);
        
        // Wallet API'den NFT ID'lerini aldık, şimdi detaylı NFT'leri alalım
        if (!wallet || !wallet.nft_ids || wallet.nft_ids.length === 0) {
            return [];
        }
        
        // Normalde burası tüm NFT'leri alır, sonra filtrelerdi
        // Ancak backend API değiştiğinden direkt olarak nft_ids ile döndürelim
        const allNfts = await fetchAllNfts();
        return allNfts.filter(nft => wallet.nft_ids.includes(nft.id.toString()));
    } catch (error) {
        console.error("Error fetching owned NFTs:", error);
        // Fallback to fetching all NFTs and marking owned
        return []; // Boş liste döndür
    }
};

export const fetchClaimableNfts = async (): Promise<Nft[]> => {
    console.log(`API CALL: fetchClaimableNfts`);
    try {
        return await apiCall<Nft[]>(`/me/nfts/claimable`);
    } catch (error) {
        console.error("Error fetching claimable NFTs:", error);
        // Fallback to placeholder
        await new Promise(resolve => setTimeout(resolve, 400));
        return [{ 
            id: 103, 
            name: 'Görev Ödülü NFT', 
            description: 'Zorlu görevi tamamladın!', 
            image_url: 'https://via.placeholder.com/300/22c55e/ffffff?text=NFT103', 
            category: NFTCategory.GENERAL, 
            price_stars: 10, 
            mintable: true, 
            is_active: false, 
            created_at: new Date().toISOString(), 
            is_owned: false, 
            is_minted: false, 
            is_claimable: true 
        }];
    }
};

export const claimNft = async (nftId: number): Promise<BuyNFTResponse> => {
    console.log(`API CALL: claimNft ${nftId}`);
    try {
        return await apiCall<BuyNFTResponse>(`/me/nfts/claim/${nftId}`, { method: 'POST' });
    } catch (error) {
        console.error("Error claiming NFT:", error);
        // Fallback to placeholder
        await new Promise(resolve => setTimeout(resolve, 800));
        const cost = 10;
        const wallet = await fetchUserWallet();
        if (cost > wallet.stars) throw new Error("Claim için yetersiz Stars");
        return { message: "NFT başarıyla claim edildi!", remaining_stars: wallet.stars - cost };
    }
};

export const buyNft = async (nftId: number): Promise<BuyNFTResponse> => {
    console.log(`API CALL: buyNft ${nftId}`);
    try {
        return await apiCall<BuyNFTResponse>(`/nfts/buy`, {
            method: 'POST',
            body: JSON.stringify({ nft_id: nftId })
        });
    } catch (error) {
        console.error("Error buying NFT:", error);
        // Fallback to placeholder
        await new Promise(resolve => setTimeout(resolve, 800));
        const nftPrice = nftId === 201 ? 50 : nftId === 202 ? 150 : 200;
        const wallet = await fetchUserWallet();
        if (nftPrice > wallet.stars) throw new Error("Satın almak için yetersiz Stars");
        return { message: "NFT başarıyla satın alındı!", remaining_stars: wallet.stars - nftPrice };
    }
}


// --- DAO API ---
// TODO: Implement real DAO API calls
export const fetchDaoProposals = async (): Promise<DAOProposal[]> => {
    console.warn(`API CALL (Placeholder): fetchDaoProposals()`);
    // return apiCall<DAOProposal[]>('/dao/proposals/');
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
        { id: 1, title: "Yeni Görev Kategorisi: Yaratıcılık", description: "Kullanıcıların yaratıcı içerik üreteceği görevler eklenmeli mi?", status: ProposalStatus.ACTIVE, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), end_date: new Date(Date.now() + 86400000 * 5).toISOString(), total_yes_power: 15, total_no_power: 3, user_voted: false, user_choice: undefined },
        { id: 2, title: "Stars ile Profil Çerçevesi Satışı", description: "Profil resimleri için özel çerçeveler Stars karşılığı satılmalı mı?", status: ProposalStatus.ACTIVE, created_at: new Date(Date.now() - 86400000).toISOString(), end_date: new Date(Date.now() + 86400000 * 10).toISOString(), total_yes_power: 8, total_no_power: 12, user_voted: true, user_choice: false },
    ];
};
export const castVote = async (proposalId: number, choice: boolean): Promise<VoteResponse> => {
    console.warn(`API CALL (Placeholder): castVote ${proposalId} ${choice}`);
    // return apiCall<VoteResponse>(`/dao/vote`, { method: 'POST', body: JSON.stringify({ proposal_id: proposalId, choice }) });
    await new Promise(resolve => setTimeout(resolve, 500));
    return { message: "Oyunuz başarıyla kaydedildi! (Placeholder)" };
};


// --- TON Wallet API --- 
// Bu bölüm yayında geçici olarak simüle ediliyor, yakında gerçek TON entegrasyonu eklenecek
export const fetchTonWalletInfo = async (): Promise<TonWalletInfo> => { 
  // Simüle edilmiş TON cüzdanı bilgisi - ilk sürümde kullanıcılara bağlantı yok olarak gösteriliyor
  return { is_connected: false }; 
}

export const mintNftOnTon = async (nftId: number): Promise<{ message: string; transaction_hash?: string }> => { 
  // Mint işlemi simülasyonu - gerçek TON ağına mint işlemi yakında eklenecek
  await new Promise(resolve => setTimeout(resolve, 1500)); 
  return { 
    message: "NFT mint işlemi başarılı! TON entegrasyonu yakında aktif olacak.", 
    transaction_hash: "0x" + Math.random().toString(16).slice(2) 
  }; 
}

// --- Notifications API --- 
// Bildirim sistemi ilk sürümde boş döndürülüyor, yakında aktif olacak
export const fetchNotifications = async (): Promise<Notification[]> => {
  await new Promise(resolve => setTimeout(resolve, 400)); 
  return []; 
}


// Remove old placeholder functions if any
// export const fetchUserProfile = async (userId: number): Promise<UserProfile> => { ... }; // Old version removed

export const useStarsResponse = async (_userId: number, amount: number, reason: string): Promise<UseStarsResponse> => {
    console.warn(`API CALL (Placeholder): useStars ${amount}, ${reason}`);
    await new Promise(resolve => setTimeout(resolve, 400));
    const currentStars = 50;
    if(amount > currentStars) throw new Error("Yetersiz Stars (placeholder)");
    return { message: `${amount} Stars başarıyla kullanıldı.`, remaining_stars: currentStars - amount };
}

/**
 * Kullanıcının yıldız işlem geçmişini getirir
 */
export const fetchStarTransactions = async (_userId: string): Promise<StarTransactionHistoryResponse> => {
  // API çağrısı - Daha sonra gerçek API'ye bağlanacak
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        transactions: [
          {
            id: 1,
            amount: 50,
            type: 'credit',
            reason: 'signup_bonus',
            description: 'Kayıt olma bonusu',
            created_at: '2023-08-15T14:30:00Z'
          },
          {
            id: 2,
            amount: 25,
            type: 'credit',
            reason: 'daily_login',
            description: 'Günlük giriş ödülü',
            created_at: '2023-08-16T10:15:00Z'
          },
          {
            id: 3,
            amount: 100,
            type: 'credit',
            reason: 'ton_purchase',
            description: 'TON satın alımı',
            created_at: '2023-08-17T15:45:00Z'
          },
          {
            id: 4,
            amount: 200,
            type: 'debit',
            reason: 'nft_mint',
            description: 'NFT basımı',
            created_at: '2023-08-18T09:30:00Z'
          }
        ],
        total_count: 4
      });
    }, 1000);
  });
}; 

// --- ADMIN API ---
export const adminGrantStars = async (userId: number, amount: number, reason: string): Promise<{ success: boolean; message: string }> => {
  console.log(`ADMIN API: grantStars to ${userId}, amount: ${amount}, reason: ${reason}`);
  // Simülasyon için
  try {
    const response = await apiCall<{ success: boolean; message: string }>('/admin/stars/add', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, amount, reason })
    });
    return response;
  } catch (error) {
    console.error("Admin Stars grant hatası:", error);
    // Geliştirme ve test için simülasyon
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      message: `${userId} ID'li kullanıcıya ${amount} Stars başarıyla verildi (simüle).`
    };
  }
};

export const adminDistributeNFT = async (userId: number, nftId: number): Promise<{ success: boolean; message: string }> => {
  console.log(`ADMIN API: distributeNFT to ${userId}, nftId: ${nftId}`);
  // Simülasyon için
  try {
    const response = await apiCall<{ success: boolean; message: string }>('/admin/nft/distribute', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, nft_id: nftId })
    });
    return response;
  } catch (error) {
    console.error("Admin NFT dağıtım hatası:", error);
    // Geliştirme ve test için simülasyon
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      message: `${userId} ID'li kullanıcıya ${nftId} ID'li NFT başarıyla dağıtıldı (simüle).`
    };
  }
};

export const adminFetchUserProfile = async (userId: number): Promise<UserProfile> => {
  console.log(`ADMIN API: fetchUserProfile for ${userId}`);
  // Simülasyon için
  try {
    const response = await apiCall<UserProfile>(`/admin/users/${userId}`);
    return response;
  } catch (error) {
    console.error("Admin kullanıcı profili getirme hatası:", error);
    // Geliştirme ve test için simülasyon
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Demo kullanıcı verisi
    return {
      id: userId,
      telegram_id: userId,
      username: `user${userId}`,
      first_name: `Kullanıcı ${userId}`,
      xp: 1250,
      level: 5,
      stars: 350,
      stars_enabled: true,
      has_vip_access: false,
      created_at: new Date().toISOString(),
      consecutive_login_days: 3,
      mission_streak: 2,
      invited_users_count: 1,
      badges: [
        {
          badge_id: 1,
          badge_name: "Başlangıç",
          badge_image_url: "https://via.placeholder.com/50/3498db/ffffff?text=B",
          earned_at: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ],
      completed_missions: [
        {
          mission_id: 1,
          completed_at: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          mission_id: 2,
          completed_at: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      mission_stories: [],
      nft_count: 2
    };
  }
};

export const adminFetchUserNFTs = async (userId: number): Promise<Nft[]> => {
  console.log(`ADMIN API: fetchUserNFTs for ${userId}`);
  // Simülasyon için
  try {
    const response = await apiCall<Nft[]>(`/admin/users/${userId}/nfts`);
    return response;
  } catch (error) {
    console.error("Admin kullanıcı NFT'leri getirme hatası:", error);
    // Geliştirme ve test için simülasyon
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Demo NFT verisi
    return [
      {
        id: 201,
        name: "Temel Koleksiyon #1",
        description: "Temel koleksiyon NFT #1",
        image_url: "https://via.placeholder.com/150/2ecc71/ffffff?text=NFT1",
        category: NFTCategory.GENERAL,
        price_stars: 50,
        mintable: true,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        is_owned: true,
        is_minted: false,
        is_claimable: false
      },
      {
        id: 305,
        name: "Elit Koleksiyon #5",
        description: "Elit koleksiyon NFT #5",
        image_url: "https://via.placeholder.com/150/9b59b6/ffffff?text=NFT5",
        category: NFTCategory.SORA_VIDEO,
        price_stars: 150,
        mintable: true,
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        is_owned: true,
        is_minted: true,
        is_claimable: false,
        is_elite: true
      }
    ];
  }
};

export const mintNft = async (nftId: number): Promise<BuyNFTResponse> => {
    console.log(`API CALL: mintNft ${nftId}`);
    try {
        const uid = getTelegramUserIdForApi();
        return await apiCall<BuyNFTResponse>(`/mint-nft`, {
            method: 'POST',
            body: JSON.stringify({ uid, nft_id: nftId })
        });
    } catch (error) {
        console.error("Error minting NFT:", error);
        throw error;
    }
}; 

// --- Lokasyon API ---
export const reportUserLocation = async (lat: number, lng: number): Promise<{ success: boolean }> => {
  console.log(`API CALL: reportUserLocation ${lat}, ${lng}`);
  try {
    return await apiCall<{ success: boolean }>(`/location/report`, {
      method: 'POST',
      body: JSON.stringify({ latitude: lat, longitude: lng })
    });
  } catch (error) {
    console.error("Error reporting user location:", error);
    return { success: false };
  }
}; 

// Tüm rozet bilgilerini çeken fonksiyon
export const fetchBadges = async (): Promise<Badge[]> => {
  try {
    console.log(`API CALL: fetchBadges`);
    return await apiCall<Badge[]>('/api/badges');
  } catch (error) {
    console.error("Rozet bilgileri alınırken hata oluştu:", error);
    
    // Fallback - örnek rozet verileri
    return [
      {
        id: 1,
        name: "Hoş Geldin",
        description: "Arayış Evreni'ne katıldığınız için kazandınız. Yolculuğunuz başlıyor!",
        image_url: "/badges/welcome-badge.png",
        is_active: true
      },
      {
        id: 2,
        name: "Görev Kahramanı",
        description: "İlk görevini tamamlayarak evrenin aktif bir parçası oldun!",
        image_url: "/badges/mission-badge.png",
        is_active: true
      },
      {
        id: 3,
        name: "Flört Ustası",
        description: "Flört becerilerini gösterdin ve bu özel rozeti kazandın!",
        image_url: "/badges/flirt-badge.png",
        is_active: true
      },
      {
        id: 4,
        name: "Analiz Uzmanı",
        description: "Detaylı analizlerin ve keskin gözlemlerin için özel ödül!",
        image_url: "/badges/analyst-badge.png",
        is_active: true
      },
      {
        id: 5,
        name: "DAO Savunucusu",
        description: "Topluluk yönetimine aktif katılımın için ödül!",
        image_url: "/badges/dao-badge.png",
        is_active: true
      },
      {
        id: 6,
        name: "Seviye Atlama",
        description: "Seviye atladın ve kozmik yolculuğunda yeni bir kapı açtın!",
        image_url: "/badges/level-badge.png",
        is_active: true
      }
    ];
  }
}; 

// --- Profil API ---
export const setProfilePhoto = async (photoData: File): Promise<{ success: boolean; url?: string }> => {
  console.log(`API CALL: setProfilePhoto`);
  try {
    const formData = new FormData();
    formData.append('photo', photoData);
    
    return await apiCall<{ success: boolean; url?: string }>('/profile/photo', {
      method: 'POST',
      body: formData,
      // Content-Type header'ını axios veya fetch otomatik ekleyecek (multipart/form-data)
      headers: {} // Content-Type header'ını siliyoruz çünkü formData ile gönderiyoruz
    });
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    return { success: false };
  }
}; 