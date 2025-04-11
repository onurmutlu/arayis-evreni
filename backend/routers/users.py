from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from typing import List, Annotated, Dict, Any
from datetime import timedelta # timedelta import edildi
from sqlalchemy.sql import func

# crud, models, schemas importları eklenecek
import schemas, auth, crud, models 
from database import get_db

router = APIRouter()

# XP eşikleri
XP_THRESHOLDS = {
    1: 0,    # 0-100
    2: 101,  # 101-250
    3: 251,  # 251-500
}

def calculate_level_from_xp(xp: int) -> int:
    """
    XP değerine göre seviye hesaplar
    - Level 1: 0-100
    - Level 2: 101-250
    - Level 3: 251-500
    - Level 4+: XP / 100 (yuvarlanmış)
    """
    if xp <= 100:
        return 1
    elif xp <= 250:
        return 2
    elif xp <= 500:
        return 3
    else:
        # Level 4+ için XP / 100 yuvarlanmış değeri
        return max(4, round(xp / 100))

# TODO: /profil/{uid} endpoint'i - EKLENDI
@router.get("/profile/{uid}", response_model=Dict[str, Any], tags=["User Profile"])
async def get_user_profile(uid: str, db: Session = Depends(get_db)):
    """
    Kullanıcı profil bilgilerini döndürür:
    - XP, seviye, rozet listesi, görev serisi (streak)
    """
    try:
        # Kullanıcıyı Telegram ID ile bul
        telegram_id = int(uid)
        user = crud.get_user_by_telegram_id(db, telegram_id=telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
        
        # Kullanıcının rozetlerini al
        badges = []
        if hasattr(user, 'badges') and user.badges:
            badges = [badge.badge.name for badge in user.badges]
        
        # XP değerine göre seviyeyi hesapla
        level = calculate_level_from_xp(user.xp)
        
        # İstenen formatta yanıt döndür
        return {
            "uid": uid,
            "xp": user.xp,
            "level": level,
            "streak": user.mission_streak,
            "rozetler": badges
        }
    except ValueError:
        # Telegram ID sayı değilse kullanıcı adını dene
        user = crud.get_user_by_username(db, username=uid)
        if not user:
            raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
        
        # Kullanıcının rozetlerini al
        badges = []
        if hasattr(user, 'badges') and user.badges:
            badges = [badge.badge.name for badge in user.badges]
        
        # XP değerine göre seviyeyi hesapla
        level = calculate_level_from_xp(user.xp)
        
        # İstenen formatta yanıt döndür
        return {
            "uid": uid,
            "xp": user.xp,
            "level": level,
            "streak": user.mission_streak,
            "rozetler": badges
        }

# TODO: /wallet/{uid} endpoint'i
# TODO: /stars/use endpoint'i
# TODO: Kullanıcı oluşturma/giriş endpoint'i (Telegram initData ile)

# Telegram initData'dan JWT token almak için endpoint
@router.post("/login", response_model=schemas.Token, tags=["Auth"])
async def login_for_access_token(
    # initData'yı doğrudan body'den string olarak al
    init_data_str: Annotated[str, Body(embed=True, alias='initData')],
    db: Session = Depends(get_db)
):
    """Validates Telegram initData and returns a JWT access token."""
    if not auth.BOT_TOKEN:
         raise HTTPException(status_code=500, detail="Bot token not configured on server.")

    validated_data = auth.validate_init_data(init_data_str, auth.BOT_TOKEN)

    if not validated_data or not validated_data.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials from initData",
        )

    user_info = validated_data.user
    user = crud.get_user_by_telegram_id(db, telegram_id=user_info.id)

    # Davet linkinden gelmiş mi kontrol et (start_param)
    inviter_id = None
    if validated_data.start_param and validated_data.start_param.startswith("invite_"):
        try:
            inviter_id_str = validated_data.start_param.split("_")[1]
            inviter_id = int(inviter_id_str)
            inviter = crud.get_user(db, inviter_id)
            if not inviter: inviter_id = None
        except (ValueError, IndexError, TypeError):
            inviter_id = None

    if not user:
        user_create_data = schemas.UserCreate(
            telegram_id=user_info.id,
            username=user_info.username,
            first_name=user_info.first_name,
            inviter_id=inviter_id
        )
        user = crud.create_user(db=db, user_data=user_create_data)
        print(f"New user created: {user.telegram_id} (Invited by: {inviter_id})")
    else:
        user.username = user_info.username
        user.first_name = user_info.first_name
        db.commit()
        db.refresh(user)
        print(f"User login: {user.telegram_id}")

    # Günlük giriş istatistiklerini güncelle
    crud.update_user_login_stats(db=db, user=user)

    # JWT Token oluştur
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.telegram_id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# Mevcut kullanıcı bilgilerini (profil) almak için endpoint
@router.get("/me/profile", response_model=schemas.UserProfile)
async def read_users_me(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Gets profile information for the currently authenticated user."""
    stories = crud.get_mission_stories_for_user(db, user_id=current_user.id)
    user_profile = schemas.UserProfile.from_orm(current_user)
    # badge ve completed_missions ilişkileri zaten user objesinde olmalı (lazy/eager loading)
    # Story'leri ekle
    user_profile.mission_stories = [schemas.MissionStorySchema.from_orm(s) for s in stories]
    return user_profile


@router.get("/me/wallet", response_model=schemas.UserWallet)
async def read_my_wallet(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Gets wallet information (Stars, NFTs) for the currently authenticated user."""
    # Wallet şemasını direkt user ve ilişkili nfts ile doldur
    # UserNFT ilişkisinden UserNFTSchema'ya dönüşüm
    user_nfts_schema = []
    if current_user.nfts: # İlişki yüklendiyse
        for user_nft in current_user.nfts:
            nft_details = user_nft.nft # İlişkili NFT detayları
            if nft_details:
                user_nfts_schema.append(schemas.UserNFTSchema(
                    nft_id=user_nft.nft_id,
                    nft_name=nft_details.name,
                    nft_image_url=nft_details.image_url,
                    purchase_date=user_nft.purchase_date,
                    purchase_price_stars=user_nft.purchase_price_stars or 0, # Null ise 0 yap
                ))

    return schemas.UserWallet(
        user_id=current_user.id,
        telegram_id=current_user.telegram_id,
        username=current_user.username,
        stars=current_user.stars,
        stars_enabled=current_user.stars_enabled,
        nfts=user_nfts_schema
    )

@router.get("/me/daily-bonus/status", response_model=schemas.DailyBonusStatus)
async def get_my_daily_bonus_status(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Checks the daily bonus status for the current user."""
    return crud.get_daily_bonus_status(db, user=current_user)

@router.post("/me/daily-bonus/claim", response_model=schemas.ClaimDailyBonusResponse)
async def claim_my_daily_bonus(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Claims the daily bonus for the current user."""
    try:
        return crud.claim_daily_bonus(db, user=current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me/invite-info", response_model=schemas.InviteInfoResponse)
async def get_my_invite_info(
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Gets the invite link and info for the current user."""
    return crud.get_invite_info(user=current_user)


# Kullanıcının cüzdan bilgilerini kullanıcı adına göre döndüren endpoint
@router.get("/wallet/{uid}", response_model=Dict[str, Any], tags=["User Wallet"])
async def get_user_wallet(uid: str, db: Session = Depends(get_db)):
    """
    Kullanıcının cüzdan bilgilerini döndürür:
    - Stars (yıldız) bakiyesi
    - Sahip olunan NFT ID'leri
    - Toplam harcanan yıldızlar
    """
    try:
        # Kullanıcıyı Telegram ID ile bul
        telegram_id = int(uid)
        user = crud.get_user_by_telegram_id(db, telegram_id=telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
        
        # NFT ID'lerini al
        nft_ids = []
        if hasattr(user, 'nfts') and user.nfts:
            nft_ids = [user_nft.nft_id for user_nft in user.nfts]
        
        # Toplam harcanan yıldızları transaction tablosundan hesapla
        stars_spent = crud.get_user_stars_spent(db, user_id=user.id)
        
        # İstenen formatta yanıt döndür
        return {
            "uid": uid,
            "stars": user.stars,
            "nft_ids": nft_ids,
            "stars_spent": stars_spent
        }
    except ValueError:
        # Telegram ID sayı değilse kullanıcı adını dene
        user = crud.get_user_by_username(db, username=uid)
        if not user:
            raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
        
        # NFT ID'lerini al
        nft_ids = []
        if hasattr(user, 'nfts') and user.nfts:
            nft_ids = [user_nft.nft_id for user_nft in user.nfts]
        
        # Toplam harcanan yıldızları transaction tablosundan hesapla
        stars_spent = crud.get_user_stars_spent(db, user_id=user.id)
        
        # İstenen formatta yanıt döndür
        return {
            "uid": uid,
            "stars": user.stars,
            "nft_ids": nft_ids,
            "stars_spent": stars_spent
        }


# Stars harcama endpoint'i (JWT korumalı)
@router.post("/me/stars/use", response_model=schemas.UseStarsResponse)
async def use_my_stars(
    request: schemas.UseStarsRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Spends stars for the current user for a specific reason."""
    try:
        success = crud.use_stars_for_action(
            db, user=current_user, amount=request.amount, reason=request.reason
        )
        if not success:
             # Bakiye yetersizse crud fonksiyonu False döner
             raise HTTPException(status_code=400, detail="Yetersiz Stars bakiyesi.")
        return schemas.UseStarsResponse(
            message=f"{request.amount} Stars başarıyla harcandı ({request.reason}).",
            remaining_stars=current_user.stars
        )
    except ValueError as e: # Örn: Stars kullanımı kapalıysa crud hata verir
        raise HTTPException(status_code=400, detail=str(e))


# NFT basma/satın alma endpointi
@router.post("/mint-nft", response_model=Dict[str, Any], tags=["NFTs"])
async def mint_nft(
    uid: str,
    nft_id: int,
    db: Session = Depends(get_db)
):
    """
    Kullanıcının belirtilen NFT'yi basması/satın alması işlemini gerçekleştirir.
    Kullanıcının yeterli Stars bakiyesini kontrol eder.
    Yeterli Stars varsa, bakiyeden düşer ve NFT'yi kullanıcıya ekler.
    """
    try:
        # Kullanıcıyı Telegram ID ile bul
        telegram_id = int(uid)
        user = crud.get_user_by_telegram_id(db, telegram_id=telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
    except ValueError:
        # Telegram ID sayı değilse kullanıcı adını dene
        user = crud.get_user_by_username(db, username=uid)
        if not user:
            raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
    
    # NFT'yi bul
    nft = db.query(models.NFT).filter(models.NFT.id == nft_id).first()
    if not nft:
        raise HTTPException(status_code=404, detail=f"NFT bulunamadı: {nft_id}")
    
    # Kullanıcının bu NFT'ye zaten sahip olup olmadığını kontrol et
    existing_nft = db.query(models.UserNFT).filter(
        models.UserNFT.user_id == user.id,
        models.UserNFT.nft_id == nft_id
    ).first()
    
    if existing_nft:
        raise HTTPException(status_code=400, detail=f"Kullanıcı bu NFT'ye zaten sahip: {nft.name}")
    
    # Yeterli Stars bakiyesini kontrol et
    if user.stars < nft.price_stars:
        return {
            "success": False,
            "message": "Yetersiz Stars bakiyesi",
            "required_stars": nft.price_stars,
            "current_stars": user.stars
        }
    
    # Stars bakiyesinden düş
    user.stars -= nft.price_stars
    
    # Yeni UserNFT ilişkisi oluştur
    user_nft = models.UserNFT(
        user_id=user.id,
        nft_id=nft_id,
        purchase_price_stars=nft.price_stars
    )
    
    # Star işlem kaydı oluştur
    crud.create_star_transaction(
        db=db,
        user_id=user.id,
        amount=-nft.price_stars,  # Negatif değer (harcama)
        transaction_type=models.TransactionType.DEBIT,
        reason="nft_purchase",
        description=f"NFT satın alımı: {nft.name}"
    )
    
    # Veritabanına ekle ve kaydet
    db.add(user_nft)
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "message": f"NFT başarıyla alındı: {nft.name}",
        "remaining_stars": user.stars,
        "nft": {
            "id": nft.id,
            "name": nft.name,
            "image_url": nft.image_url,
            "purchase_price": nft.price_stars
        }
    }


# Görev tamamlama endpointi
@router.post("/gorev-tamamla", response_model=Dict[str, Any], tags=["Missions"])
async def complete_mission(
    uid: str,
    gorev_id: int,
    db: Session = Depends(get_db)
):
    """
    Kullanıcının belirtilen görevi tamamlamasını sağlar.
    XP ekler, streak günceller ve görevi o gün için tamamlanmış olarak işaretler.
    """
    try:
        # Kullanıcıyı Telegram ID ile bul
        telegram_id = int(uid)
        user = crud.get_user_by_telegram_id(db, telegram_id=telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
    except ValueError:
        # Telegram ID sayı değilse kullanıcı adını dene
        user = crud.get_user_by_username(db, username=uid)
        if not user:
            raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
    
    # Görevi bul
    mission = db.query(models.Mission).filter(models.Mission.id == gorev_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail=f"Görev bulunamadı: {gorev_id}")
    
    # Görevin kullanıcı seviyesine uygun olup olmadığını kontrol et
    user_level = calculate_level_from_xp(user.xp)
    if user_level < mission.required_level:
        raise HTTPException(
            status_code=400, 
            detail=f"Bu görev için gerekli seviye: {mission.required_level}, mevcut seviye: {user_level}"
        )
    
    # Görevin VIP gerektirip gerektirmediğini kontrol et
    if mission.is_vip and not user.has_vip_access:
        raise HTTPException(status_code=403, detail="Bu görev VIP erişimi gerektiriyor")
    
    # Görevin belirli bir NFT gerektirip gerektirmediğini kontrol et
    if mission.required_nft_id:
        has_required_nft = db.query(models.UserNFT).filter(
            models.UserNFT.user_id == user.id,
            models.UserNFT.nft_id == mission.required_nft_id
        ).first() is not None
        
        if not has_required_nft:
            required_nft = db.query(models.NFT).filter(models.NFT.id == mission.required_nft_id).first()
            nft_name = required_nft.name if required_nft else f"NFT #{mission.required_nft_id}"
            raise HTTPException(
                status_code=403, 
                detail=f"Bu görev için {nft_name} NFT'sine sahip olmanız gerekiyor"
            )
    
    # Görevin bugün zaten tamamlanıp tamamlanmadığını kontrol et
    today = func.date(func.now())
    mission_completed_today = db.query(models.UserMissionLog).filter(
        models.UserMissionLog.user_id == user.id,
        models.UserMissionLog.mission_id == gorev_id,
        func.date(models.UserMissionLog.completion_time) == today
    ).first() is not None
    
    if mission_completed_today:
        raise HTTPException(
            status_code=400, 
            detail="Bu görev bugün zaten tamamlandı"
        )
    
    # Görevin yeniden tamamlanabilir olup olmadığını kontrol et
    if mission.cooldown_hours == 0:  # 0 = tekrar edilemez
        mission_ever_completed = db.query(models.UserMission).filter(
            models.UserMission.user_id == user.id,
            models.UserMission.mission_id == gorev_id
        ).first() is not None
        
        if mission_ever_completed:
            raise HTTPException(
                status_code=400, 
                detail="Bu görev daha önce tamamlandı ve tekrar edilemez"
            )
    
    # Önceki tüm kontroller geçildi, görevi tamamla
    
    # XP ekle
    xp_gained = mission.xp_reward
    old_level = user_level
    user.xp += xp_gained
    
    # Streak güncelle
    user.mission_streak += 1
    
    # Görev tamamlama kaydı ekle
    user_mission = models.UserMission(
        user_id=user.id,
        mission_id=gorev_id
    )
    
    # Görev günlük log kaydı ekle
    mission_log = models.UserMissionLog(
        user_id=user.id,
        mission_id=gorev_id
    )
    
    # Değişiklikleri kaydet
    db.add(user_mission)
    db.add(mission_log)
    db.commit()
    db.refresh(user)
    
    # Yeni seviyeyi hesapla
    new_level = calculate_level_from_xp(user.xp)
    level_up = new_level > old_level
    
    return {
        "xp_gained": xp_gained,
        "streak": user.mission_streak,
        "level_up": level_up,
        "current_xp": user.xp,
        "current_level": new_level
    }


# Kullanıcıya özel görevleri listele
@router.get("/missions/{uid}", response_model=List[Dict[str, Any]], tags=["Missions"])
async def get_user_missions(
    uid: str,
    db: Session = Depends(get_db)
):
    """
    Kullanıcının erişebileceği görevleri döndürür.
    Kullanıcı seviyesine uygun, aktif ve kullanıcının henüz tamamlamamış olduğu görevleri içerir.
    VIP görevleri sadece VIP kullanıcılara gösterilir.
    """
    try:
        # Kullanıcıyı Telegram ID ile bul
        telegram_id = int(uid)
        user = crud.get_user_by_telegram_id(db, telegram_id=telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
    except ValueError:
        # Telegram ID sayı değilse kullanıcı adını dene
        user = crud.get_user_by_username(db, username=uid)
        if not user:
            raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
    
    # Tüm aktif görevleri al
    missions = db.query(models.Mission).filter(models.Mission.is_active == True).all()
    
    # Kullanıcının seviyesini hesapla
    user_level = calculate_level_from_xp(user.xp)
    
    # Kullanıcının tamamlamış olduğu görevleri al - son 24 saat içinde
    completed_mission_ids = set()
    one_day_ago = func.now() - timedelta(days=1)
    completed_missions = db.query(models.UserMission).filter(
        models.UserMission.user_id == user.id,
        models.UserMission.completed_at > one_day_ago
    ).all()
    
    for cm in completed_missions:
        completed_mission_ids.add(cm.mission_id)
    
    # Kullanıcının NFT'lerini al
    user_nft_ids = set()
    user_nfts = db.query(models.UserNFT).filter(models.UserNFT.user_id == user.id).all()
    for un in user_nfts:
        user_nft_ids.add(un.nft_id)
    
    # Kullanıcının erişebileceği görevleri filtrele ve cevap formatına dönüştür
    result = []
    for mission in missions:
        # Görev kullanıcının seviyesine uygun mu?
        if mission.required_level > user_level:
            continue
            
        # VIP gerektiren bir görev ve kullanıcı VIP değil mi?
        if mission.is_vip and not user.has_vip_access:
            continue
            
        # Kullanıcı bu görevi son 24 saat içinde tamamlamış mı?
        if mission.id in completed_mission_ids:
            # Eğer tekrarlanabilir değilse (cooldown > 0) ve son 24 saat içinde tamamlanmışsa
            if mission.cooldown_hours > 0:
                # Bu görev şu an erişilebilir değil, son tamamlanma zamanı ve cooldown ile atla
                continue
        
        # Kullanıcının bu görev için gerekli NFT'si var mı?
        unlocked = True
        if mission.required_nft_id is not None:
            if mission.required_nft_id not in user_nft_ids:
                unlocked = False
        
        # Görev için gerekli NFT varsa ismini al
        required_nft_name = None
        if mission.required_nft_id:
            nft = db.query(models.NFT).filter(models.NFT.id == mission.required_nft_id).first()
            if nft:
                required_nft_name = nft.name
        
        # Son tamamlanma zamanını al (eğer varsa)
        last_completed = None
        last_completed_mission = db.query(models.UserMission).filter(
            models.UserMission.user_id == user.id,
            models.UserMission.mission_id == mission.id
        ).order_by(models.UserMission.completed_at.desc()).first()
        
        if last_completed_mission:
            last_completed = last_completed_mission.completed_at.isoformat()
        
        # Görev detayları
        mission_details = {
            "id": mission.id,
            "title": mission.title,
            "description": mission.description,
            "xp_reward": mission.xp_reward,
            "mission_type": mission.mission_type,
            "category": mission.mission_type.lower() if mission.mission_type else None,
            "cooldown_hours": mission.cooldown_hours,
            "required_level": mission.required_level,
            "is_vip": mission.is_vip,
            "required_nft_id": mission.required_nft_id,
            "required_nft_name": required_nft_name,
            "unlocked": unlocked,
            "last_completed": last_completed,
        }
        
        result.append(mission_details)
    
    return result

# Eski placeholder endpoint'leri kaldır
# @router.get("/users/placeholder", ...) ... 