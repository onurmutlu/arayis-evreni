from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from typing import List, Annotated
from datetime import timedelta # timedelta import edildi

# crud, models, schemas importları eklenecek
import schemas, auth, crud, models 
from database import get_db

router = APIRouter()

# TODO: /profil/{uid} endpoint'i
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

# Eski placeholder endpoint'leri kaldır
# @router.get("/users/placeholder", ...) ... 