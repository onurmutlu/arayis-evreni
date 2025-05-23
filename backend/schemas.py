from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from models import MissionType, NFTCategory, ProposalStatus, Badge as BadgeModel
from enum import Enum

# Base Schemas (Temel alanlar)
class MissionBase(BaseModel):
    title: str
    description: str
    xp_reward: int
    mission_type: MissionType = MissionType.OTHER
    cooldown_hours: int = 0
    required_level: int = 1
    is_active: bool = True
    is_vip: bool = False
    required_nft_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class BadgeBase(BaseModel):
    name: str
    description: str
    image_url: str = Field(
        description="Badge image URL path",
        example="/badges/welcome-badge.png"  # Örnek URL'yi güncelliyoruz
    )
    required_xp: Optional[int] = None
    required_mission_id: Optional[int] = None
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)

class NFTBase(BaseModel):
    name: str
    description: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    category: NFTCategory
    price_stars: int
    total_supply: Optional[int] = None
    mintable: bool = False
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)

class DAOProposalBase(BaseModel):
    title: str
    description: str
    end_date: datetime

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Create Schemas (Oluşturma için)
class MissionCreate(MissionBase):
    pass

class BadgeCreate(BadgeBase):
    pass

class NFTCreate(NFTBase):
    pass

class DAOProposalCreate(DAOProposalBase):
    pass

class UserCreate(UserBase):
    inviter_id: Optional[int] = None

# Read Schemas (Okuma/Döndürme için)
# Önce ilişkili verileri döndürmek için alt şemalar
class UserBadgeSchema(BaseModel):
    badge_id: int
    badge_name: str
    badge_image_url: str
    earned_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserNFTSchema(BaseModel):
    nft_id: int
    nft_name: str
    nft_image_url: Optional[str]
    purchase_date: datetime
    purchase_price_stars: int

    model_config = ConfigDict(from_attributes=True)

class UserMissionSchema(BaseModel):
    mission_id: int
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Ana Okuma Şemaları
class Mission(MissionBase):
    id: int
    created_at: datetime
    required_nft_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class Badge(BadgeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class NFT(NFTBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MissionStorySchema(BaseModel):
    id: int
    mission_id: int
    story_text: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class User(UserBase):
    id: int
    xp: int
    level: int
    stars: int
    stars_enabled: bool
    has_vip_access: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login_date: Optional[datetime] = None
    consecutive_login_days: int = 0
    mission_streak: int = 0
    invited_users_count: int = 0

    model_config = ConfigDict(from_attributes=True)

# Detaylı profil ve cüzdan şemaları
class UserProfile(User):
    badges: List[UserBadgeSchema] = []
    completed_missions: List[UserMissionSchema] = []
    mission_stories: List[MissionStorySchema] = []

    model_config = ConfigDict(from_attributes=True)


class UserWallet(BaseModel):
    user_id: int
    telegram_id: int
    username: Optional[str]
    stars: int
    stars_enabled: bool
    nfts: List[UserNFTSchema] = []

    model_config = ConfigDict(from_attributes=True)


class DAOVoteSchema(BaseModel):
    id: int
    user_id: int
    proposal_id: int
    vote_power: int
    choice: bool
    voted_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DAOProposal(DAOProposalBase):
    id: int
    creator_id: Optional[int] = None
    status: ProposalStatus
    created_at: datetime
    total_yes_power: int = 0
    total_no_power: int = 0

    model_config = ConfigDict(from_attributes=True)


# Diğer Yardımcı Şemalar
class CompleteMissionRequest(BaseModel):
    mission_id: int

class CompleteMissionResponse(BaseModel):
    message: str
    new_xp: int
    new_level: int
    earned_badge: Optional[Badge] = None
    streak_bonus_xp: Optional[int] = None
    story_generated: Optional[str] = None

class BuyNFTRequest(BaseModel):
    nft_id: int

class BuyNFTResponse(BaseModel):
    message: str
    remaining_stars: int

class UseStarsRequest(BaseModel):
    amount: int = Field(..., gt=0)
    reason: str

class UseStarsResponse(BaseModel):
    message: str
    remaining_stars: int

class VoteRequest(BaseModel):
    proposal_id: int
    choice: bool

class VoteResponse(BaseModel):
    message: str

class UserLoginData(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    language_code: Optional[str] = None
    is_premium: Optional[bool] = None
    photo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class InitData(BaseModel):
    query_id: Optional[str] = None
    user: Optional[UserLoginData] = None
    receiver: Optional[dict] = None
    chat: Optional[dict] = None
    chat_type: Optional[str] = None
    chat_instance: Optional[str] = None
    start_param: Optional[str] = None
    can_send_after: Optional[int] = None
    auth_date: int
    hash: str

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    telegram_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class DailyBonusStatus(BaseModel):
    can_claim: bool
    current_streak: int
    time_until_next_claim_seconds: Optional[int] = None
    today_reward_xp: Optional[int] = None
    today_reward_stars: Optional[int] = None
    streak_reward_nft: Optional[NFT] = None

    model_config = ConfigDict(from_attributes=True)

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: Optional[str] = None
    value: int

    model_config = ConfigDict(from_attributes=True)

class LeaderboardResponse(BaseModel):
    category: str
    entries: List[LeaderboardEntry]

    model_config = ConfigDict(from_attributes=True)

class ClaimDailyBonusResponse(BaseModel):
    message: str
    claimed_xp: int
    claimed_stars: int
    claimed_nft: Optional[NFT] = None
    new_streak: int

    model_config = ConfigDict(from_attributes=True)

class InviteInfoResponse(BaseModel):
    invite_link: str
    successful_invites: int
    reward_per_invite_stars: int

    model_config = ConfigDict(from_attributes=True)

class UnlockVipRequest(BaseModel):
    pass

class UnlockVipResponse(BaseModel):
    message: str
    remaining_stars: int
    vip_access_granted: bool

    model_config = ConfigDict(from_attributes=True)

class AdminAddStarsRequest(BaseModel):
    telegram_id: int
    amount: int

    model_config = ConfigDict(from_attributes=True)

class AdminToggleStarsRequest(BaseModel):
    telegram_id: int
    enable: bool

    model_config = ConfigDict(from_attributes=True)

class AdminToggleVipRequest(BaseModel):
    telegram_id: int
    enable: bool

    model_config = ConfigDict(from_attributes=True)

class AdminUpdateMissionRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    xp_reward: Optional[int] = None
    mission_type: Optional[MissionType] = None
    cooldown_hours: Optional[int] = None
    required_level: Optional[int] = None
    is_active: Optional[bool] = None
    is_vip: Optional[bool] = None
    required_nft_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class AdminUpdateUserRequest(BaseModel):
    xp: Optional[int] = None
    level: Optional[int] = None
    stars: Optional[int] = None
    has_vip_access: Optional[bool] = None
    stars_enabled: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)

class AdminUserActionRequest(BaseModel):
    telegram_id: int

    model_config = ConfigDict(from_attributes=True)

class AdminCreateMissionRequest(MissionCreate):
    pass

class AdminCreateBadgeRequest(BadgeCreate):
    pass

class AdminCreateNFTRequest(NFTCreate):
    pass

class AdminCreateProposalRequest(DAOProposalCreate):
    pass

class NFTCategory(str, Enum):
    GENERAL = "general"
    SORA_VIDEO = "sora_video"
    VOTE_BASIC = "vote-basic"
    VOTE_PREMIUM = "vote-premium"
    VOTE_SORA = "vote-sora"
    # Yeni NFT kategorileri
    WATCHER = "Watcher"
    WARRIOR = "Warrior"
    ORACLE = "Oracle"
    GUARDIAN = "Guardian"
    FLIRT = "Flirt"
    HACKER = "Hacker"
    CITY = "City"
    DAO = "DAO" 