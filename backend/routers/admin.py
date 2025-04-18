from fastapi import APIRouter, Depends, HTTPException, Body, Path
from sqlalchemy.orm import Session
from typing import List

# crud, models, schemas importları
import schemas, crud, models, auth
from database import get_db
# TODO: Admin yetkilendirmesi eklenmeli (örneğin API key veya özel token ile)

# Tüm admin endpoint'lerini API Key ile koru
router = APIRouter(
    dependencies=[Depends(auth.verify_admin_api_key)]
)

# Kullanıcı İşlemleri
@router.post("/users/update/{telegram_id}", response_model=schemas.User, summary="Update User Details")
async def admin_update_user_endpoint(
    telegram_id: int = Path(..., description="Güncellenecek kullanıcının Telegram ID'si"),
    update_data: schemas.AdminUpdateUserRequest = Body(...),
    db: Session = Depends(get_db)
):
    """(Admin Only) Updates a user's details (XP, Level, Stars, VIP status etc.)."""
    updated_user = crud.update_user_admin(db, telegram_id=telegram_id, update_data=update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    return updated_user

@router.post("/users/add-stars", response_model=schemas.User, summary="Add Stars to User")
async def admin_add_stars(request: schemas.AdminAddStarsRequest, db: Session = Depends(get_db)):
    """(Admin Only) Belirtilen kullanıcıya Stars ekler."""
    user = crud.get_user_by_telegram_id(db, request.telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    # Negatif değer eklemeyi engelle (opsiyonel)
    if request.amount <= 0:
         raise HTTPException(status_code=400, detail="Eklenecek miktar pozitif olmalı.")
    user.stars += request.amount
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/toggle-stars", response_model=schemas.User, summary="Toggle User Stars Usage")
async def admin_toggle_stars_usage(request: schemas.AdminToggleStarsRequest, db: Session = Depends(get_db)):
    """(Admin Only) Belirtilen kullanıcının Stars harcama yetkisini açar/kapatır."""
    user = crud.get_user_by_telegram_id(db, request.telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    user.stars_enabled = request.enable
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/toggle-vip", response_model=schemas.User, summary="Toggle User VIP Access")
async def admin_toggle_vip_access(request: schemas.AdminToggleVipRequest, db: Session = Depends(get_db)):
    """(Admin Only) Grants or revokes VIP access for a user."""
    user = crud.get_user_by_telegram_id(db, request.telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    # grant_vip_access commit yaptığı için burada tekrar commit'e gerek yok
    crud.grant_vip_access(db, user=user, grant=request.enable)
    # User objesi zaten güncellendi, tekrar refresh etmeye gerek yok ama edilebilir.
    db.refresh(user)
    return user


# Görev İşlemleri
@router.post("/missions", response_model=schemas.Mission, status_code=201, summary="Create Mission")
async def admin_create_mission(
    mission_data: schemas.AdminCreateMissionRequest,
    db: Session = Depends(get_db)
):
    """(Admin Only) Creates a new mission."""
    # İsteğe bağlı: Gerekli NFT ID'si varsa geçerli bir NFT mi kontrol et
    if mission_data.required_nft_id:
         nft = crud.get_nft(db, mission_data.required_nft_id)
         if not nft:
             raise HTTPException(status_code=400, detail=f"Required NFT ID {mission_data.required_nft_id} bulunamadı.")
    return crud.create_mission_admin(db, mission_data=mission_data)

@router.put("/missions/{mission_id}", response_model=schemas.Mission, summary="Update Mission")
async def admin_update_mission(
    mission_id: int = Path(..., description="Güncellenecek görevin ID'si"),
    update_data: schemas.AdminUpdateMissionRequest = Body(...),
    db: Session = Depends(get_db)
):
    """(Admin Only) Updates an existing mission."""
    # İsteğe bağlı: Gerekli NFT ID'si varsa geçerli bir NFT mi kontrol et
    if update_data.required_nft_id is not None:
        if update_data.required_nft_id > 0: # 0 veya null değilse kontrol et
             nft = crud.get_nft(db, update_data.required_nft_id)
             if not nft:
                 raise HTTPException(status_code=400, detail=f"Required NFT ID {update_data.required_nft_id} bulunamadı.")
        elif update_data.required_nft_id < 0: # Negatif ID geçersiz
             raise HTTPException(status_code=400, detail="Geçersiz required_nft_id.")
        # Eğer 0 gönderildiyse, null olarak set edilecek (crud halleder)

    updated_mission = crud.update_mission_admin(db, mission_id=mission_id, update_data=update_data)
    if not updated_mission:
        raise HTTPException(status_code=404, detail="Görev bulunamadı.")
    return updated_mission

@router.get("/missions", response_model=List[schemas.Mission], summary="List All Missions")
async def admin_read_all_missions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """(Admin Only) Lists all missions (active and inactive)."""
    # TODO: crud'a tüm görevleri getiren bir fonksiyon eklenebilir (get_all_missions).
    missions = db.query(models.Mission).order_by(models.Mission.id).offset(skip).limit(limit).all()
    return missions

# Rozet İşlemleri
@router.post("/badges", response_model=schemas.Badge, status_code=201, summary="Create Badge")
async def admin_create_badge(
    badge_data: schemas.AdminCreateBadgeRequest,
    db: Session = Depends(get_db)
):
    """(Admin Only) Creates a new badge."""
    # İsteğe bağlı: Gerekli Misyon ID'si varsa geçerli bir misyon mu kontrol et
    if badge_data.required_mission_id:
        mission = crud.get_mission(db, mission_id=badge_data.required_mission_id)
        if not mission:
            raise HTTPException(status_code=400, detail=f"Required Mission ID {badge_data.required_mission_id} bulunamadı.")
    return crud.create_badge_admin(db, badge_data=badge_data)

@router.get("/badges", response_model=List[schemas.Badge], summary="List All Badges")
async def admin_read_all_badges(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """(Admin Only) Lists all badges."""
    badges = db.query(models.Badge).order_by(models.Badge.id).offset(skip).limit(limit).all()
    return badges

@router.post("/badges/award/{badge_id}/{telegram_id}", response_model=dict, summary="Award Badge to User")
async def admin_award_badge(
    badge_id: int,
    telegram_id: int,
    db: Session = Depends(get_db)
):
    """(Admin Only) Awards a badge to a user manually."""
    user = crud.get_user_by_telegram_id(db, telegram_id=telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {telegram_id}")
    
    badge = crud.get_badge(db, badge_id=badge_id)
    if not badge:
        raise HTTPException(status_code=404, detail=f"Rozet bulunamadı: {badge_id}")
    
    # Rozeti ver
    user_badge = crud.award_badge_to_user(db, user_id=user.id, badge_id=badge_id)
    
    return {
        "success": True,
        "message": f"{badge.name} rozeti {user.username} kullanıcısına verildi.",
        "badge_id": badge_id,
        "user_id": user.id,
        "telegram_id": telegram_id
    }

# TODO: Rozet, NFT, DAO Oylama yönetimi için Admin endpointleri eklenebilir.
# Örneğin:
# POST /admin/badges
# PUT /admin/badges/{badge_id}
# POST /admin/nfts
# PUT /admin/nfts/{nft_id}
# POST /admin/dao/proposals
# PUT /admin/dao/proposals/{proposal_id}

# Eski placeholder endpoint'leri kaldır
# @router.post("/stars/add/placeholder", ...) ...
# @router.post("/stars/toggle/placeholder", ...) ...

# TODO: Görev ekleme/düzenleme endpoint'leri
# TODO: Rozet ekleme/düzenleme endpoint'leri
# TODO: NFT ekleme/düzenleme endpoint'leri
# TODO: DAO oylaması oluşturma endpoint'i 