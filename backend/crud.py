# Bu dosya veritabanı işlemleri için fonksiyonları içerecek.
# (Örn: Kullanıcı oluştur, görev getir, NFT al vb.)
# Şimdilik boş bırakıyoruz, endpoint'leri yazdıkça dolduracağız.

from sqlalchemy.orm import Session
import models, schemas  # Kullanılmaya başlandığında importlar eklenecek
from typing import Optional, List
from sqlalchemy import func, desc
from datetime import datetime, timedelta

# Kullanıcı işlemleri
def get_user(db: Session, user_id: int):
    """Kullanıcıyı ID'ye göre getir"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_telegram_id(db: Session, telegram_id: int):
    """
    Kullanıcıyı Telegram ID'sine göre bulur
    """
    return db.query(models.User).filter(models.User.telegram_id == telegram_id).first()

def get_user_by_username(db: Session, username: str):
    """
    Kullanıcıyı kullanıcı adına göre bulur
    """
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user_data: schemas.UserCreate):
    """Yeni kullanıcı oluştur"""
    new_user = models.User(
        telegram_id=user_data.telegram_id,
        username=user_data.username,
        first_name=user_data.first_name,
        xp=0,
        level=1,
        stars=50,  # Başlangıç stars miktarı
        stars_enabled=True,
        has_vip_access=False,
        consecutive_login_days=1,
        mission_streak=0
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Başlangıç yıldızları için işlem kaydı oluştur
    create_star_transaction(
        db=db,
        user_id=new_user.id,
        amount=50,
        transaction_type=models.TransactionType.CREDIT,
        reason="signup_bonus",
        description="Kayıt olma bonusu"
    )
    
    return new_user

# Star işlemleri için yeni fonksiyonlar
def create_star_transaction(
    db: Session, 
    user_id: int, 
    amount: int, 
    transaction_type: models.TransactionType,
    reason: str, 
    description: str = None
):
    """Yeni bir yıldız işlemi kaydı oluşturur"""
    transaction = models.StarTransaction(
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        reason=reason,
        description=description
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

def get_user_star_transactions(db: Session, user_id: int, limit: int = 10):
    """Kullanıcının yıldız işlem geçmişini getirir"""
    return db.query(models.StarTransaction)\
             .filter(models.StarTransaction.user_id == user_id)\
             .order_by(desc(models.StarTransaction.created_at))\
             .limit(limit)\
             .all()

def get_user_stars_spent(db: Session, user_id: int):
    """Kullanıcının harcadığı toplam yıldız miktarını hesaplar"""
    result = db.query(func.sum(models.StarTransaction.amount).label("total"))\
               .filter(
                   models.StarTransaction.user_id == user_id,
                   models.StarTransaction.transaction_type == models.TransactionType.DEBIT
               )\
               .first()
    
    # Eğer harcama yoksa 0 döndür
    return abs(result.total) if result and result.total else 0

# Kullanıcı Profil ve Cüzdan işlemleri
def get_user_profile(db: Session, user_id: int):
    """Kullanıcının profil bilgilerini getirir"""
    user = get_user(db, user_id)
    if not user:
        return None
    return schemas.UserProfile.from_orm(user)

def get_user_wallet(db: Session, user_id: int):
    """Kullanıcının cüzdan bilgilerini getirir"""
    user = get_user(db, user_id)
    if not user:
        return None
    
    user_nfts_schema = []
    if user.nfts:
        for user_nft in user.nfts:
            nft_details = user_nft.nft
            if nft_details:
                user_nfts_schema.append(schemas.UserNFTSchema(
                    nft_id=user_nft.nft_id,
                    nft_name=nft_details.name,
                    nft_image_url=nft_details.image_url,
                    purchase_date=user_nft.purchase_date,
                    purchase_price_stars=user_nft.purchase_price_stars or 0
                ))

    return schemas.UserWallet(
        user_id=user.id,
        telegram_id=user.telegram_id,
        username=user.username,
        stars=user.stars,
        stars_enabled=user.stars_enabled,
        nfts=user_nfts_schema
    )

# Görev işlemleri
def get_mission(db: Session, mission_id: int):
    """Belirli bir görevi ID'ye göre getirir"""
    return db.query(models.Mission).filter(models.Mission.id == mission_id).first()

def get_missions_for_user(db: Session, user: models.User, category: Optional[str] = None):
    """Kullanıcının erişebileceği görevleri listeler"""
    query = db.query(models.Mission).filter(
        models.Mission.is_active == True,
        models.Mission.required_level <= user.level
    )
    
    # VIP kontrolü
    if not user.has_vip_access:
        query = query.filter(models.Mission.is_vip == False)
    
    # Kategori filtresi varsa uygula
    if category:
        query = query.filter(func.lower(models.Mission.mission_type) == func.lower(category))
    
    return query.all()

def get_user_last_mission_completion(db: Session, user_id: int, mission_id: int):
    """Kullanıcının belirli bir görevi en son ne zaman tamamladığını kontrol eder"""
    return db.query(models.UserMission)\
            .filter(
                models.UserMission.user_id == user_id,
                models.UserMission.mission_id == mission_id
            )\
            .order_by(desc(models.UserMission.completed_at))\
            .first()

def get_user_completed_missions(db: Session, user_id: int, limit: int = 20):
    """Kullanıcının tamamladığı son görevleri getirir"""
    return db.query(models.UserMission)\
             .filter(models.UserMission.user_id == user_id)\
             .order_by(desc(models.UserMission.completed_at))\
             .limit(limit)\
             .all()

def create_mission_admin(db: Session, mission_data: schemas.AdminCreateMissionRequest):
    """Yeni bir görev oluşturur (admin)"""
    new_mission = models.Mission(
        title=mission_data.title,
        description=mission_data.description,
        xp_reward=mission_data.xp_reward,
        mission_type=mission_data.mission_type,
        cooldown_hours=mission_data.cooldown_hours,
        required_level=mission_data.required_level,
        is_active=mission_data.is_active,
        is_vip=mission_data.is_vip,
        required_nft_id=mission_data.required_nft_id
    )
    
    db.add(new_mission)
    db.commit()
    db.refresh(new_mission)
    return new_mission

def update_mission_admin(db: Session, mission_id: int, update_data: schemas.AdminUpdateMissionRequest):
    """Mevcut bir görevi günceller (admin)"""
    mission = get_mission(db, mission_id)
    if not mission:
        return None
    
    # Gelen verileri güncelle
    for field, value in update_data.model_dump(exclude_unset=True).items():
        # NFT ID için özel işlem: 0 gönderilirse None olarak set et 
        if field == "required_nft_id" and value == 0:
            value = None
        
        setattr(mission, field, value)
    
    db.commit()
    db.refresh(mission)
    return mission

def complete_mission_logic(db: Session, user: models.User, mission: models.Mission):
    """Görev tamamlama mantığını işler ve ödülleri verir"""
    # Kazanılacak XP miktarı
    xp_gained = mission.xp_reward
    
    # Streak bonusu (opsiyonel)
    streak_bonus = 0
    if user.mission_streak > 0:
        streak_bonus = int(xp_gained * 0.05 * min(user.mission_streak, 10))
        xp_gained += streak_bonus
    
    # Kullanıcı XP'sini güncelle
    user.xp += xp_gained
    
    # Görev tamamlama kaydı
    user_mission = models.UserMission(
        user_id=user.id,
        mission_id=mission.id
    )
    
    # Görev log kaydı
    mission_log = models.UserMissionLog(
        user_id=user.id,
        mission_id=mission.id
    )
    
    db.add(user_mission)
    db.add(mission_log)
    
    # Streak'i güncelle
    last_log = db.query(models.UserMissionLog)\
                .filter(models.UserMissionLog.user_id == user.id)\
                .order_by(desc(models.UserMissionLog.completion_time))\
                .first()
                
    now = datetime.now()
    if last_log:
        # Son 24 saat içinde görev yapılmışsa streak devam ediyor
        if now - last_log.completion_time < timedelta(days=1):
            user.mission_streak += 1
        else:
            # 48 saatten fazla süre geçmişse streak sıfırlanır
            if now - last_log.completion_time > timedelta(days=2):
                user.mission_streak = 1
    else:
        user.mission_streak = 1
    
    # Rozet kazanımını kontrol et
    earned_badge = None
    available_badges = db.query(models.Badge)\
                        .filter(
                            models.Badge.is_active == True,
                            models.Badge.required_mission_id == mission.id
                        )\
                        .all()
    
    if available_badges:
        for badge in available_badges:
            # Kullanıcı bu rozeti zaten almış mı?
            existing_badge = db.query(models.UserBadge)\
                            .filter(
                                models.UserBadge.user_id == user.id,
                                models.UserBadge.badge_id == badge.id
                            )\
                            .first()
            
            if not existing_badge:
                # Rozeti ver
                user_badge = models.UserBadge(
                    user_id=user.id,
                    badge_id=badge.id
                )
                db.add(user_badge)
                earned_badge = badge
                break  # İlk uygun rozeti ver ve döngüden çık
    
    # Değişiklikleri kaydet
    db.commit()
    db.refresh(user)
    
    # XP seviyesine göre seviyeyi güncelle
    new_level = calculate_level_from_xp(user.xp)
    
    # Yanıt hazırla
    response = schemas.CompleteMissionResponse(
        message=f"Tebrikler! {mission.title} görevini tamamladın.",
        new_xp=user.xp,
        new_level=new_level
    )
    
    if streak_bonus > 0:
        response.streak_bonus_xp = streak_bonus
    
    if earned_badge:
        response.earned_badge = schemas.Badge.from_orm(earned_badge)
    
    return response

def calculate_level_from_xp(xp: int) -> int:
    """XP miktarından seviye hesaplar"""
    if xp < 100:
        return 1
    elif xp < 300:
        return 2
    elif xp < 600:
        return 3
    elif xp < 1000:
        return 4
    elif xp < 1500:
        return 5
    elif xp < 2500:
        return 6
    elif xp < 4000:
        return 7
    elif xp < 6000:
        return 8
    elif xp < 9000:
        return 9
    else:
        return 10 + (xp - 9000) // 5000

# Rozet işlemleri
def get_badge(db: Session, badge_id: int):
    """Belirli bir rozeti ID'ye göre getirir"""
    return db.query(models.Badge).filter(models.Badge.id == badge_id).first()

def get_badges_for_user(db: Session, user_id: int):
    """Kullanıcının sahip olduğu rozetleri getirir"""
    return db.query(models.Badge)\
            .join(models.UserBadge)\
            .filter(models.UserBadge.user_id == user_id)\
            .all()

def create_badge_admin(db: Session, badge_data: schemas.AdminCreateBadgeRequest):
    """Yeni bir rozet oluşturur (admin)"""
    new_badge = models.Badge(
        name=badge_data.name,
        description=badge_data.description,
        image_url=badge_data.image_url,
        required_xp=badge_data.required_xp,
        required_mission_id=badge_data.required_mission_id,
        is_active=badge_data.is_active
    )
    
    db.add(new_badge)
    db.commit()
    db.refresh(new_badge)
    return new_badge

def award_badge_to_user(db: Session, user_id: int, badge_id: int):
    """Kullanıcıya rozet verir"""
    # Kullanıcının bu rozeti zaten var mı?
    existing = db.query(models.UserBadge)\
                .filter(
                    models.UserBadge.user_id == user_id,
                    models.UserBadge.badge_id == badge_id
                )\
                .first()
    
    if existing:
        return existing
    
    user_badge = models.UserBadge(
        user_id=user_id,
        badge_id=badge_id
    )
    
    db.add(user_badge)
    db.commit()
    db.refresh(user_badge)
    return user_badge

# NFT işlemleri
def get_nft(db: Session, nft_id: int):
    """Belirli bir NFT'yi ID'ye göre getirir"""
    return db.query(models.NFT).filter(models.NFT.id == nft_id).first()

def get_all_nfts(db: Session, active_only: bool = True, limit: int = 100):
    """Tüm NFT'leri listeler"""
    query = db.query(models.NFT)
    
    if active_only:
        query = query.filter(models.NFT.is_active == True)
    
    return query.limit(limit).all()

def get_user_nft(db: Session, user_id: int, nft_id: int):
    """Kullanıcının belirli bir NFT'sine erişir"""
    return db.query(models.UserNFT).filter(
        models.UserNFT.user_id == user_id,
        models.UserNFT.nft_id == nft_id
    ).first()

def get_user_nfts(db: Session, user_id: int):
    """Kullanıcının tüm NFT'lerini listeler"""
    user_nfts = db.query(models.UserNFT).filter(
        models.UserNFT.user_id == user_id
    ).all()
    return user_nfts

def buy_nft(db: Session, user: models.User, nft: models.NFT):
    """Kullanıcı için NFT satın alma işlemi"""
    # Yıldız bakiyesi kontrolü
    if user.stars < nft.price_stars:
        raise ValueError(f"Yetersiz yıldız bakiyesi. Gereken: {nft.price_stars}, Mevcut: {user.stars}")
    
    # NFT kullanıcıya ekle
    user_nft = models.UserNFT(
        user_id=user.id,
        nft_id=nft.id,
        purchase_price_stars=nft.price_stars
    )
    db.add(user_nft)
    
    # Yıldız bakiyesini güncelle
    user.stars -= nft.price_stars
    
    # Yıldız işlemini kaydet
    star_transaction = models.StarTransaction(
        user_id=user.id,
        amount=-nft.price_stars,
        transaction_type=models.TransactionType.DEBIT,
        reason="nft_purchase",
        description=f"{nft.name} NFT satın alımı"
    )
    db.add(star_transaction)
    
    db.commit()
    db.refresh(user)
    return user

def get_mission_stories_for_user(db: Session, user_id: int, limit: int = 10):
    """Kullanıcının görev hikayelerini getirir"""
    return db.query(models.MissionStoryLog)\
            .filter(models.MissionStoryLog.user_id == user_id)\
            .order_by(desc(models.MissionStoryLog.timestamp))\
            .limit(limit)\
            .all()

def update_user_admin(db: Session, telegram_id: int, update_data: schemas.AdminUpdateUserRequest):
    """Kullanıcı bilgilerini günceller (admin)"""
    user = get_user_by_telegram_id(db, telegram_id)
    if not user:
        return None
    
    # Gelen verileri güncelle
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

def grant_vip_access(db: Session, user: models.User, grant: bool = True):
    """Kullanıcıya VIP erişimi verir/kaldırır"""
    user.has_vip_access = grant
    db.commit()
    return user

def get_user_badges(db: Session, user_id: int):
    """
    Kullanıcının rozetlerini getirir
    """
    user_badges = db.query(models.UserBadge).filter(models.UserBadge.user_id == user_id).all()
    badges = []
    
    for ub in user_badges:
        badge = db.query(models.Badge).filter(models.Badge.id == ub.badge_id).first()
        if badge:
            badges.append({
                "badge_id": badge.id,
                "badge_name": badge.name,
                "badge_image_url": badge.image_url,
                "earned_at": ub.earned_at.isoformat() if ub.earned_at else None
            })
    
    return badges

def get_user_missions(db: Session, user_id: int):
    """
    Kullanıcının tamamladığı görevleri getirir
    """
    user_missions = db.query(models.UserMission).filter(models.UserMission.user_id == user_id).all()
    completed_missions = []
    
    for um in user_missions:
        completed_missions.append({
            "mission_id": um.mission_id,
            "completed_at": um.completed_at.isoformat() if um.completed_at else None
        })
    
    return completed_missions

def get_user_mission_stories(db: Session, user_id: int):
    """
    Kullanıcının görev hikayelerini getirir
    """
    stories = db.query(models.MissionStory).filter(models.MissionStory.user_id == user_id).all()
    mission_stories = []
    
    for story in stories:
        mission_stories.append({
            "id": story.id,
            "mission_id": story.mission_id,
            "story_text": story.story_text,
            "timestamp": story.timestamp.isoformat() if story.timestamp else None
        })
    
    return mission_stories

def get_user_nft_count(db: Session, user_id: int):
    """
    Kullanıcının sahip olduğu NFT sayısını getirir
    """
    return db.query(models.UserNFT).filter(models.UserNFT.user_id == user_id).count() 