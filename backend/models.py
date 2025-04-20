from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, DateTime, Enum as SQLEnum, Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

# Yıldız işlemi türleri için enum
class TransactionType(str, enum.Enum):
    CREDIT = "credit"  # Yıldız kazanma
    DEBIT = "debit"    # Yıldız harcama

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True) # Telegram username
    first_name = Column(String, nullable=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    stars = Column(Integer, default=0) # Başlangıçta 0, sadece admin veya ödeme ile eklenir
    stars_enabled = Column(Boolean, default=False) # Stars kullanımının aktif olup olmadığını belirtir
    has_vip_access = Column(Boolean, default=False) # Yeni Alan: VIP erişimi
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Yeni Alanlar (Login, Streak, Invite)
    last_login_date = Column(DateTime(timezone=True), nullable=True)
    consecutive_login_days = Column(Integer, default=0)
    mission_streak = Column(Integer, default=0)
    inviter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    invited_users_count = Column(Integer, default=0)

    completed_missions = relationship("UserMission", back_populates="user")
    mission_logs = relationship("UserMissionLog", back_populates="user")
    badges = relationship("UserBadge", back_populates="user")
    nfts = relationship("UserNFT", back_populates="user")
    votes = relationship("DAOVote", back_populates="user")
    daily_claims = relationship("DailyBonusClaim", back_populates="user")
    mission_stories = relationship("MissionStoryLog", back_populates="user")
    inviter = relationship("User", remote_side=[id], backref="invitees")

class MissionType(str, enum.Enum):
    FLIRT = "flört"
    ANALYSIS = "analiz"
    MESSAGE = "mesaj"
    INVITE = "davet"
    OTHER = "diğer"

class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    xp_reward = Column(Integer, nullable=False)
    mission_type = Column(SQLEnum(MissionType), default=MissionType.OTHER)
    cooldown_hours = Column(Integer, default=0) # Tekrar tamamlanabilirlik için saat cinsinden süre (0 = tekrar edilemez)
    required_level = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Yeni Alanlar (VIP, NFT Requirement)
    is_vip = Column(Boolean, default=False)
    required_nft_id = Column(Integer, ForeignKey("nfts.id"), nullable=True)

    completions = relationship("UserMission", back_populates="mission")
    required_nft = relationship("NFT")

class UserMission(Base):
    __tablename__ = "user_missions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="completed_missions")
    mission = relationship("Mission", back_populates="completions")

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=False)
    image_url = Column(String, nullable=False) # Rozet görselinin URL'si
    required_xp = Column(Integer, nullable=True) # Belirli XP'ye ulaşınca otomatik kazanılabilir
    required_mission_id = Column(Integer, ForeignKey("missions.id"), nullable=True) # Belirli görevi tamamlayınca kazanılabilir
    is_active = Column(Boolean, default=True)

    owners = relationship("UserBadge", back_populates="badge")

class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="owners")

class NFTCategory(str, enum.Enum):
    GENERAL = "general"
    SORA_VIDEO = "sora_video" # Özel AI video NFT kategorisi
    VOTE_BASIC = "vote-basic"
    VOTE_PREMIUM = "vote-premium"
    VOTE_SORA = "vote-sora" # DAO oylama NFT'leri
    # Yeni NFT kategorileri
    WATCHER = "Watcher"
    WARRIOR = "Warrior"
    ORACLE = "Oracle"
    GUARDIAN = "Guardian"
    FLIRT = "Flirt"
    HACKER = "Hacker" 
    CITY = "City"
    DAO = "DAO"

class NFT(Base):
    __tablename__ = "nfts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    image_url = Column(String, nullable=True) # Görsel URL'si (resim veya video thumbnail)
    video_url = Column(String, nullable=True) # Sora video NFT'leri için video URL'si
    category = Column(SQLEnum(NFTCategory), default=NFTCategory.GENERAL, nullable=False)
    price_stars = Column(Integer, nullable=False) # Stars cinsinden fiyat
    total_supply = Column(Integer, nullable=True) # None ise sınırsız arz
    mintable = Column(Boolean, default=False) # TON Wallet ile mint edilebilir mi? (ileride)
    is_active = Column(Boolean, default=True) # Satışta mı?
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owners = relationship("UserNFT", back_populates="nft")

class UserNFT(Base):
    __tablename__ = "user_nfts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nft_id = Column(Integer, ForeignKey("nfts.id"), nullable=False)
    purchase_date = Column(DateTime(timezone=True), server_default=func.now())
    purchase_price_stars = Column(Integer) # Satın alındığı andaki Stars fiyatı

    user = relationship("User", back_populates="nfts")
    nft = relationship("NFT", back_populates="owners")

class ProposalStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    PASSED = "passed"
    REJECTED = "rejected"

class DAOProposal(Base):
    __tablename__ = "dao_proposals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Sistemi veya admin temsil etmek için null olabilir
    status = Column(SQLEnum(ProposalStatus), default=ProposalStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=False) # Oylama bitiş tarihi

    votes = relationship("DAOVote", back_populates="proposal")
    creator = relationship("User")

class DAOVote(Base):
    __tablename__ = "dao_votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    proposal_id = Column(Integer, ForeignKey("dao_proposals.id"), nullable=False)
    vote_power = Column(Integer, nullable=False) # NFT türüne göre oy gücü (örn: basic=1, premium=5, sora=10)
    choice = Column(Boolean, nullable=False) # True: Evet, False: Hayır
    voted_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="votes")
    proposal = relationship("DAOProposal", back_populates="votes")

class DailyBonusClaim(Base):
    __tablename__ = "daily_bonus_claims"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    claim_date = Column(DateTime(timezone=True), server_default=func.now())
    day_streak = Column(Integer, nullable=False)
    user = relationship("User", back_populates="daily_claims")

class UserMissionLog(Base):
    __tablename__ = "user_mission_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    completion_time = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="mission_logs")
    mission = relationship("Mission")

class LeaderboardCache(Base):
    __tablename__ = "leaderboard_cache"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True, nullable=False) # 'xp', 'missions_completed', 'stars_spent'
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    username = Column(String) # Denormalize username for easy display
    value = Column(Integer, nullable=False, index=True)
    rank = Column(Integer, nullable=False, index=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()) # onupdate eklendi
    user = relationship("User")

class MissionStoryLog(Base):
    __tablename__ = "mission_story_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    story_text = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="mission_stories")
    mission = relationship("Mission")

# Yıldız işlemlerini takip eden yeni tablo
class StarTransaction(Base):
    __tablename__ = "star_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # Pozitif/negatif miktar
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    reason = Column(String, nullable=False)  # İşlem nedeni (örn: nft_purchase, daily_bonus)
    description = Column(String, nullable=True)  # İlave açıklama
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="star_transactions")