from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

# crud, models, schemas importları eklenecek
import crud, models, schemas, auth
from database import get_db

router = APIRouter()

# TODO: /missions endpoint'i (Aktif görevleri listele)
# TODO: /gorev-tamamla endpoint'i

@router.get("/missions", response_model=List[schemas.Mission])
async def read_missions_for_user(
    category: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcı için aktif ve erişilebilir görevleri listeler.
    İsteğe bağlı olarak kategori filtresi uygulanabilir.
    """
    missions = crud.get_missions_for_user(db=db, user=current_user, category=category)
    return missions

@router.get("/mission/{mission_id}", response_model=schemas.Mission)
async def read_mission_details(
    mission_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Belirli bir görevin detaylarını getirir.
    """
    mission = crud.get_mission(db, mission_id=mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Görev bulunamadı.")
    
    # Kullanıcının görevi görüntüleme yetkisi var mı?
    if mission.required_level > current_user.level:
        raise HTTPException(status_code=403, detail="Bu göreve erişim için gerekli seviyede değilsiniz.")
    if mission.is_vip and not current_user.has_vip_access:
        raise HTTPException(status_code=403, detail="Bu görev sadece VIP kullanıcılar içindir.")
    
    return mission

@router.post("/gorev-tamamla", response_model=schemas.CompleteMissionResponse)
async def complete_mission_endpoint(
    request: schemas.CompleteMissionRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Bir görevi tamamlar ve kullanıcıya ödülleri verir.
    """
    mission = crud.get_mission(db, mission_id=request.mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Görev bulunamadı.")

    # Erişim kontrolleri
    if mission.required_level > current_user.level:
         raise HTTPException(status_code=403, detail="Bu görevi yapmak için yeterli seviyede değilsiniz.")
    if mission.is_vip and not current_user.has_vip_access:
         raise HTTPException(status_code=403, detail="Bu görev sadece VIP kullanıcılar içindir.")
    if mission.required_nft_id:
         user_nft_ids = {user_nft.nft_id for user_nft in current_user.nfts}
         if mission.required_nft_id not in user_nft_ids:
             raise HTTPException(status_code=403, detail="Bu görevi yapmak için gerekli NFT'ye sahip değilsiniz.")

    # Cooldown kontrolü
    last_completion = crud.get_user_last_mission_completion(db, user_id=current_user.id, mission_id=mission.id)
    if last_completion and mission.cooldown_hours > 0:
        cooldown_end = last_completion.completed_at + timedelta(hours=mission.cooldown_hours)
        if datetime.now() < cooldown_end:
            remaining_time = cooldown_end - datetime.now()
            hours, remainder = divmod(remaining_time.seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            time_str = f"{hours} saat {minutes} dakika"
            raise HTTPException(
                status_code=400, 
                detail=f"Bu görevi henüz tekrar yapamazsınız. Kalan süre: {time_str}"
            )

    try:
        result = crud.complete_mission_logic(db=db, user=current_user, mission=mission)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error completing mission {request.mission_id} for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Görev tamamlanırken bir hata oluştu.")

@router.get("/user-missions", response_model=List[schemas.UserMissionSchema])
async def read_user_completed_missions(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcının tamamladığı görevleri listeler.
    """
    completed_missions = crud.get_user_completed_missions(db=db, user_id=current_user.id)
    return completed_missions

@router.get("/mission-cooldowns", response_model=dict)
async def get_mission_cooldowns(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcı için görevlerin cooldown durumlarını getirir.
    Dönen format: {mission_id: cooldown_end_timestamp, ...}
    """
    missions = crud.get_missions_for_user(db=db, user=current_user)
    result = {}
    
    for mission in missions:
        if mission.cooldown_hours > 0:
            last_completion = crud.get_user_last_mission_completion(
                db, user_id=current_user.id, mission_id=mission.id
            )
            if last_completion:
                cooldown_end = last_completion.completed_at + timedelta(hours=mission.cooldown_hours)
                if datetime.now() < cooldown_end:
                    result[mission.id] = cooldown_end.isoformat()
                
    return result

# Açık görev listesi endpoint'i (demo veya test için)
@router.get("/missions/{uid}", response_model=List[schemas.Mission])
async def get_open_missions_for_user(
    uid: str,
    category: Optional[str] = Query(None, description="Filtrelenecek görev kategorisi"),
    db: Session = Depends(get_db)
):
    """
    Belirli bir kullanıcı için erişilebilir görevleri listeler.
    Bu endpoint, frontend tarafından kullanılabilir ve Telegram kullanıcı ID'si veya kullanıcı adı ile erişilebilir.
    """
    try:
        # Telegram ID ile kullanıcıyı bul
        telegram_id = int(uid)
        user = crud.get_user_by_telegram_id(db, telegram_id=telegram_id)
    except ValueError:
        # Kullanıcı adı ile bul
        user = crud.get_user_by_username(db, username=uid)
    
    if not user:
        raise HTTPException(status_code=404, detail=f"Kullanıcı bulunamadı: {uid}")
    
    missions = crud.get_missions_for_user(db=db, user=user, category=category)
    return missions

# Eski placeholder endpoint'i kaldır
# @router.get("/missions/placeholder", ...) ... 