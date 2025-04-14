from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

# crud, models, schemas importları eklenecek
import schemas
from database import get_db
import crud, models, auth

router = APIRouter()

# TODO: /nft/buy endpoint'i
# TODO: /gallery/{uid} endpoint'i (Kullanıcının NFT'lerini listele)
# TODO: Satıştaki NFT'leri listeleme endpoint'i

@router.get("/nfts", response_model=List[schemas.NFT])
async def read_all_nfts(
    category: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Tüm NFT'leri listeler. İsteğe bağlı olarak kategori filtresi uygulanabilir.
    """
    nfts = crud.get_all_nfts(db=db, category=category, skip=skip, limit=limit)
    return nfts

@router.get("/nfts/{nft_id}", response_model=schemas.NFT)
async def read_nft_details(
    nft_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Belirli bir NFT'nin detaylarını getirir.
    """
    nft = crud.get_nft(db, nft_id=nft_id)
    if not nft:
        raise HTTPException(status_code=404, detail="NFT bulunamadı.")
    
    return nft

@router.get("/user-nfts", response_model=List[schemas.UserNFTSchema])
async def read_user_nfts(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcının sahip olduğu NFT'leri listeler.
    """
    user_nfts = crud.get_user_nfts(db=db, user_id=current_user.id)
    return user_nfts

@router.post("/nft/buy", response_model=schemas.BuyNFTResponse)
async def buy_nft(
    request: schemas.BuyNFTRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Bir NFT'yi satın alır.
    """
    nft = crud.get_nft(db, nft_id=request.nft_id)
    if not nft:
        raise HTTPException(status_code=404, detail="NFT bulunamadı.")
    
    # NFT aktif mi?
    if not nft.is_active:
        raise HTTPException(status_code=400, detail="Bu NFT şu anda satışta değil.")
    
    # Kullanıcının yeterli Stars'ı var mı?
    if current_user.stars < nft.price_stars:
        raise HTTPException(
            status_code=400, 
            detail=f"Yeterli Stars'ınız yok. Gereken: {nft.price_stars}, Mevcut: {current_user.stars}"
        )
    
    # Kullanıcı zaten bu NFT'ye sahip mi?
    existing_nft = crud.get_user_nft(db, user_id=current_user.id, nft_id=nft.id)
    if existing_nft:
        raise HTTPException(status_code=400, detail="Bu NFT'ye zaten sahipsiniz.")
    
    try:
        result = crud.buy_nft(db=db, user=current_user, nft=nft)
        return schemas.BuyNFTResponse(
            message=f"{nft.name} başarıyla satın alındı!",
            remaining_stars=result.stars
        )
    except Exception as e:
        print(f"Error buying NFT {request.nft_id} for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="NFT satın alınırken bir hata oluştu.")

@router.post("/nft/mint", response_model=schemas.BuyNFTResponse)
async def mint_nft(
    request: schemas.BuyNFTRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Bir NFT'yi blockchain'e mint eder.
    """
    nft = crud.get_nft(db, nft_id=request.nft_id)
    if not nft:
        raise HTTPException(status_code=404, detail="NFT bulunamadı.")
    
    # NFT mint edilebilir mi?
    if not nft.mintable:
        raise HTTPException(status_code=400, detail="Bu NFT mint edilebilir değil.")
    
    # Kullanıcı bu NFT'ye sahip mi?
    user_nft = crud.get_user_nft(db, user_id=current_user.id, nft_id=nft.id)
    if not user_nft:
        raise HTTPException(status_code=400, detail="Bu NFT'ye sahip değilsiniz, önce satın almalısınız.")
    
    # NFT zaten mint edilmiş mi?
    if user_nft.minted:
        raise HTTPException(status_code=400, detail="Bu NFT zaten blockchain'e mint edilmiş.")
    
    try:
        # Mint işlemi Burada TON Blockchain entegrasyonu yapılacak
        # Şimdilik sadece veritabanında update yapıyoruz
        user_nft.minted = True
        user_nft.minted_at = datetime.now()
        db.commit()
        
        return schemas.BuyNFTResponse(
            message=f"{nft.name} başarıyla blockchain'e mint edildi!",
            remaining_stars=current_user.stars
        )
    except Exception as e:
        print(f"Error minting NFT {request.nft_id} for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="NFT mint edilirken bir hata oluştu.")

@router.get("/nfts/placeholder", response_model=List[schemas.NFT])
def read_nfts_placeholder(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Geçici placeholder endpoint'i. Gerçek NFT listesi yerine boş liste döner.
    """
    # nfts = db.query(models.NFT).filter(models.NFT.is_active == True).offset(skip).limit(limit).all() # Gerçek crud fonksiyonu kullanılmalı
    # raise HTTPException(status_code=501, detail="NFT listing not implemented yet")
    print(f"Placeholder: Reading NFTs with skip={skip}, limit={limit}")
    return [] # Şimdilik boş liste döndür 