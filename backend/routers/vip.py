# backend/routers/vip.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# crud, models, schemas importları
import schemas, crud, models, auth
from database import get_db

router = APIRouter(
    prefix="/vip", # Bu router altındaki tüm endpointler /api/v1/vip ile başlar
    tags=["VIP"],
    dependencies=[Depends(auth.get_current_active_user)] # Tüm VIP endpointleri JWT gerektirir
)

VIP_ACCESS_COST = 100 # VIP erişim bedeli (Config dosyasından okunabilir)

@router.get("/missions", response_model=List[schemas.Mission])
async def read_vip_missions(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lists VIP missions if the user has access."""
    if not current_user.has_vip_access:
        raise HTTPException(status_code=403, detail="VIP erişimi gerekli.")

    # get_missions_for_user zaten kullanıcının erişebileceği görevleri döndürür.
    # Sadece VIP olanları filtreleyerek alalım.
    all_accessible_missions = crud.get_missions_for_user(db=db, user=current_user)
    vip_missions = [m for m in all_accessible_missions if m.is_vip]
    return vip_missions

@router.post("/unlock", response_model=schemas.UnlockVipResponse)
async def unlock_vip_access_endpoint(
    # request_body: schemas.UnlockVipRequest, # Body boş
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unlocks VIP access for the current user by spending Stars."""
    if current_user.has_vip_access:
        return schemas.UnlockVipResponse(
             message="VIP erişiminiz zaten aktif.",
             remaining_stars=current_user.stars,
             vip_access_granted=True
        )

    try:
        # Stars harcamayı dene (use_stars_for_action içinde bakiye kontrolü var)
        success = crud.use_stars_for_action(db, user=current_user, amount=VIP_ACCESS_COST, reason="vip_unlock")
        if not success:
             # crud fonksiyonu normalde False yerine ValueError fırlatır (yetersiz bakiye vb.)
             # Ama biz yine de kontrol edelim.
             raise HTTPException(status_code=400, detail=f"VIP erişimi için yeterli Stars yok ({VIP_ACCESS_COST} gerekli).")

        # VIP erişimini veritabanında güncelle
        crud.grant_vip_access(db, user=current_user, grant=True)

        return schemas.UnlockVipResponse(
            message="VIP erişimi başarıyla açıldı!",
            remaining_stars=current_user.stars, # crud güncelledi
            vip_access_granted=True
        )
    except ValueError as e: # use_stars_for_action'dan gelebilir
         raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error unlocking VIP for user {current_user.id}: {e}")
        # Hata durumunda transaction yönetimi önemli.
        # Eğer use_stars commit yaptıysa ama grant_vip yapamadıysa sorun olabilir.
        # db.rollback() gerekebilir. crud fonksiyonları içinde transaction yönetimi daha iyi olabilir.
        raise HTTPException(status_code=500, detail="VIP kilidi açılırken bir hata oluştu.") 