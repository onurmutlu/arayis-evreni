from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# crud, models, schemas importları eklenecek
import crud, models, schemas, auth
from database import get_db

router = APIRouter()

# TODO: /missions endpoint'i (Aktif görevleri listele)
# TODO: /gorev-tamamla endpoint'i

@router.get("/missions", response_model=List[schemas.Mission])
async def read_missions_for_user(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Gets the list of active and available missions for the current user,
    including completion and cooldown status.
    """
    # CRUD fonksiyonunu çağır
    missions = crud.get_missions_for_user(db=db, user=current_user)
    return missions


@router.post("/gorev-tamamla", response_model=schemas.CompleteMissionResponse)
async def complete_mission_endpoint(
    request: schemas.CompleteMissionRequest, # Sadece mission_id içerir
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Completes a mission for the current user."""
    mission = crud.get_mission(db, mission_id=request.mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Görev bulunamadı.")

    # Görevin kullanıcı için uygun olup olmadığını tekrar kontrol et (opsiyonel ama güvenli)
    if mission.required_level > current_user.level:
         raise HTTPException(status_code=403, detail="Bu görevi yapmak için yeterli seviyede değilsiniz.")
    if mission.is_vip and not current_user.has_vip_access:
         raise HTTPException(status_code=403, detail="Bu görev sadece VIP kullanıcılar içindir.")
    if mission.required_nft_id:
         # Kullanıcının sahip olduğu NFT ID'lerini al (verimli yol bulunmalı)
         # Direkt ilişkiden çekmek daha iyi: user.nfts
         user_nft_ids = {user_nft.nft_id for user_nft in current_user.nfts}
         if mission.required_nft_id not in user_nft_ids:
             raise HTTPException(status_code=403, detail="Bu görevi yapmak için gerekli NFT'ye sahip değilsiniz.")

    try:
        # CRUD fonksiyonunu çağır
        result = crud.complete_mission_logic(db=db, user=current_user, mission=mission)
        return result
    except ValueError as e:
        # Cooldown veya tek seferlik hata gibi durumlar
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Beklenmedik hatalar
        print(f"Error completing mission {request.mission_id} for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Görev tamamlanırken bir hata oluştu.")

# Eski placeholder endpoint'i kaldır
# @router.get("/missions/placeholder", ...) ... 