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

@router.get("/vip-status", response_model=dict)
async def get_vip_status(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcının VIP durumunu getirir.
    """
    vip_price = 500  # VIP erişim fiyatı
    return {
        "has_vip_access": current_user.has_vip_access,
        "stars": current_user.stars,
        "vip_price": vip_price,
        "can_afford": current_user.stars >= vip_price
    }

@router.post("/unlock-vip", response_model=schemas.UnlockVipResponse)
async def unlock_vip_access(
    request: schemas.UnlockVipRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Stars kullanarak VIP erişimi açar.
    """
    # Kullanıcı zaten VIP mi?
    if current_user.has_vip_access:
        raise HTTPException(status_code=400, detail="Zaten VIP erişiminiz var.")
    
    # Stars özelliği aktif mi?
    if not current_user.stars_enabled:
        raise HTTPException(status_code=400, detail="Stars özelliği hesabınızda aktif değil.")
    
    # Sabit VIP fiyatı
    vip_price = 500
    
    # Yeterli Stars var mı?
    if current_user.stars < vip_price:
        raise HTTPException(
            status_code=400, 
            detail=f"Yeterli Stars'ınız yok. Gereken: {vip_price}, Mevcut: {current_user.stars}"
        )
    
    try:
        # Stars'ları düş
        current_user.stars -= vip_price
        
        # VIP erişimi aç
        current_user.has_vip_access = True
        
        # İşlem kaydı oluştur
        crud.create_star_transaction(
            db=db,
            user_id=current_user.id,
            amount=-vip_price,
            transaction_type=models.TransactionType.DEBIT,
            reason="vip_unlock",
            description=f"VIP erişimi için {vip_price} Stars harcandı"
        )
        
        db.commit()
        
        # VIP olduğunda özel NFT verme
        try:
            vip_nft = crud.get_vip_nft(db=db)
            if vip_nft:
                crud.add_nft_to_user(db=db, user_id=current_user.id, nft_id=vip_nft.id, price=0)
                db.commit()
        except Exception as e:
            print(f"VIP NFT verme hatası: {e}")
            # Ana işlemi etkilememesi için bu hatayı yutuyoruz
        
        return schemas.UnlockVipResponse(
            message="VIP erişim başarıyla açıldı!",
            remaining_stars=current_user.stars,
            vip_access_granted=True
        )
    except Exception as e:
        db.rollback()
        print(f"Error unlocking VIP for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="VIP erişimi açılırken bir hata oluştu.")

@router.get("/vip-benefits", response_model=List[dict])
async def get_vip_benefits(
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    VIP avantajlarını listeler.
    """
    benefits = [
        {
            "id": 1,
            "title": "Özel Görevler",
            "description": "Sadece VIP kullanıcılara özel görevlere erişim",
            "icon": "crown"
        },
        {
            "id": 2,
            "title": "Premium NFT'ler",
            "description": "Özel NFT koleksiyonlarına erişim",
            "icon": "gem"
        },
        {
            "id": 3,
            "title": "Artırılmış Ödüller",
            "description": "Tüm görevlerden %20 daha fazla XP ve Stars",
            "icon": "trending-up"
        },
        {
            "id": 4,
            "title": "DAO Premium Oy",
            "description": "Topluluk oylamalarında 5x oy gücü",
            "icon": "vote"
        },
        {
            "id": 5,
            "title": "Öncelikli Destek",
            "description": "Sorularınız için öncelikli destek hattı",
            "icon": "headset"
        }
    ]
    
    return benefits 