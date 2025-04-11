// src/types/index.ts

// Backend Schemas (schemas.py) ile uyumlu olmalı

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  xp: number;
  level: number;
  stars: number;
  stars_enabled: boolean;
  has_vip_access: boolean;
  created_at: string; // ISO Date string
  updated_at?: string; // ISO Date string
  last_login_date?: string;
  consecutive_login_days: number;
  mission_streak: number;
  invited_users_count: number;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  image_url: string;
  required_xp?: number;
  required_mission_id?: number;
  is_active: boolean;
}

export interface UserBadge {
  badge_id: number;
  badge_name: string;
  badge_image_url: string;
  earned_at: string; // ISO Date string
}

export enum MissionType {
  FLIRT = "flört",
  ANALYSIS = "analiz",
  MESSAGE = "mesaj",
  INVITE = "davet",
  OTHER = "diğer",
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  xp_reward: number;
  mission_type: MissionType;
  cooldown_hours: number;
  required_level: number;
  is_active: boolean;
  created_at: string; // ISO Date string
  is_vip: boolean;
  required_nft_id?: number;
  required_nft_name?: string;
  is_completed?: boolean;
  last_completed_at?: string;
  is_on_cooldown?: boolean;
  unlocked?: boolean; // Kullanıcı için erişilebilir mi
  category?: string; // Kategori bilgisi (ikonlar için)
  last_completed?: string; // Cooldown hesaplaması için
  can_complete?: boolean; // Cooldown doldu mu/tamamlanabilir mi
}

export interface UserMission {
  mission_id: number;
  completed_at: string; // ISO Date string
}

export enum NFTCategory {
  GENERAL = "general",
  SORA_VIDEO = "sora_video",
  VOTE_BASIC = "vote-basic",
  VOTE_PREMIUM = "vote-premium",
  VOTE_SORA = "vote-sora",
}

export interface Nft {
  id: number;
  name: string;
  description: string;
  image_url?: string;
  video_url?: string;
  category: NFTCategory;
  price_stars: number;
  total_supply?: number;
  mintable: boolean;
  is_active: boolean; // Satışta mı?
  created_at: string; // ISO Date string
  is_owned?: boolean; // Kullanıcı sahip mi?
  is_minted?: boolean; // Kullanıcı tarafından mint edildi mi? (Claim/TON)
  is_claimable?: boolean; // Claim edilebilir durumda mı? (Örn: bir görevden kazanıldı ama henüz claim edilmedi)
  is_elite?: boolean; // Elit bir NFT mi? (Sora özel koleksiyonu)
  subcategory?: string; // Alt kategori bilgisi (örn: Sora koleksiyonu için)
}

export interface UserNft {
  nft_id: number;
  nft_name: string;
  nft_image_url?: string;
  purchase_date: string; // ISO Date string
  purchase_price_stars: number;
  is_minted_on_ton?: boolean; // TON üzerinde mint edildi mi?
}

export enum ProposalStatus {
  ACTIVE = "active",
  CLOSED = "closed",
  PASSED = "passed",
  REJECTED = "rejected",
}

export interface DAOProposal {
  id: number;
  title: string;
  description: string;
  creator_id?: number;
  status: ProposalStatus;
  created_at: string; // ISO Date string
  end_date: string; // ISO Date string
  total_yes_power: number;
  total_no_power: number;
  user_voted?: boolean;
  user_choice?: boolean;
}

export interface DAOVote {
    id: number;
    user_id: number;
    proposal_id: number;
    vote_power: number;
    choice: boolean;
    voted_at: string; // ISO Date string
}

export interface MissionStory {
    id: number;
    mission_id: number;
    story_text: string;
    timestamp: string;
}

export interface UserBadgeSchema {
  badge_id: number;
  badge_name: string;
  badge_image_url: string;
  earned_at: string;
}

export interface UserMissionSchema {
    mission_id: number;
    completed_at: string;
}

export interface UserNftSchema {
    nft_id: number;
    nft_name: string;
    nft_image_url?: string;
    purchase_date: string;
    purchase_price_stars: number;
    is_minted_on_ton?: boolean;
}

export interface UserProfile extends User {
  badges: UserBadgeSchema[];
  completed_missions: UserMissionSchema[];
  mission_stories: MissionStory[];
  nft_count?: number;
}

export interface UserWallet {
    user_id: number;
    telegram_id: number;
    username?: string;
    stars: number;
    stars_enabled: boolean;
    nfts: UserNftSchema[];
}

export interface CompleteMissionResponse {
    message: string;
    new_xp: number;
    new_level: number;
    earned_badge?: Badge;
    streak_bonus_xp?: number;
    story_generated?: string;
    xp_gained?: number; // API'den dönen toplam kazanılan XP
    streak?: number; // Kullanıcının güncel görev serisi
    level_up?: boolean; // Seviye atladı mı
    current_xp?: number; // Güncel XP
    current_level?: number; // Güncel seviye
}

export interface BuyNFTResponse {
    message: string;
    remaining_stars: number;
}

export interface UseStarsResponse {
    message: string;
    remaining_stars: number;
}

export interface VoteResponse {
    message: string;
}

export interface DailyBonusStatus {
    can_claim: boolean;
    current_streak: number;
    time_until_next_claim_seconds?: number;
    today_reward_xp?: number;
    today_reward_stars?: number;
    streak_reward_nft?: Nft;
}

export interface ClaimDailyBonusResponse {
    message: string;
    claimed_xp: number;
    claimed_stars: number;
    claimed_nft?: Nft;
    new_streak: number;
}

export interface InviteInfoResponse {
    invite_link: string;
    successful_invites: number;
    reward_per_invite_stars: number;
}

export interface LeaderboardEntry {
    rank: number;
    user_id: number;
    username?: string;
    value: number;
}

export interface LeaderboardResponse {
    category: string;
    entries: LeaderboardEntry[];
}

export interface UnlockVipResponse {
    message: string;
    remaining_stars: number;
    vip_access_granted: boolean;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    is_new_user?: boolean; // Kullanıcının ilk kez giriş yapıp yapmadığını gösteren alan
}

export interface Notification {
    id: string;
    type: 'mission' | 'nft' | 'dao' | 'system';
    message: string;
    timestamp: string;
    read: boolean;
    link?: string;
}

export interface TonWalletInfo {
    is_connected: boolean;
    address?: string;
    balance?: number;
}

export interface StarTransaction {
  id: number;
  amount: number;
  type: 'credit' | 'debit';  // credit: alınan stars, debit: harcanan stars
  reason: string;
  description: string;
  created_at: string;
}

export interface StarTransactionHistoryResponse {
  transactions: StarTransaction[];
  total_count: number;
} 