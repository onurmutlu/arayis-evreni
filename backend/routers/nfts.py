from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# crud, models, schemas importları eklenecek
import schemas
from database import get_db

router = APIRouter()

# TODO: /nft/buy endpoint'i
# TODO: /gallery/{uid} endpoint'i (Kullanıcının NFT'lerini listele)
# TODO: Satıştaki NFT'leri listeleme endpoint'i

@router.get("/nfts/placeholder", response_model=List[schemas.NFT])
def read_nfts_placeholder(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Geçici placeholder endpoint'i. Gerçek NFT listesi yerine boş liste döner.
    """
    # nfts = db.query(models.NFT).filter(models.NFT.is_active == True).offset(skip).limit(limit).all() # Gerçek crud fonksiyonu kullanılmalı
    # raise HTTPException(status_code=501, detail="NFT listing not implemented yet")
    print(f"Placeholder: Reading NFTs with skip={skip}, limit={limit}")
    return [] # Şimdilik boş liste döndür 