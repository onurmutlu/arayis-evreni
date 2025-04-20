from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import random
import logging
from pydantic import BaseModel
from enum import Enum

# Logger tanımlama
logger = logging.getLogger(__name__)

# crud, models, schemas importları eklenecek
import schemas
from database import get_db
import crud, models, auth

router = APIRouter()

# NFT rarity enum türünü tanımlama
class NFTRarity(str, Enum):
    common = "common"
    uncommon = "uncommon"
    rare = "rare"
    epic = "epic"
    legendary = "legendary"

# NFT metadata modeli
class NFTMetadata(BaseModel):
    id: int
    category: str
    level: int
    name: str
    video: str
    rarity: NFTRarity

# Örnek NFT metadata verileri
nft_metadata = [
    {
        "id": 1,
        "category": "Watcher",
        "level": 1,
        "name": "Watcher Seviye 1",
        "video": "https://arayis-evreni.siyahkare.com/assets/nft/NFT-watcher-1.mp4",
        "rarity": "common"
    },
    {
        "id": 2,
        "category": "Watcher",
        "level": 2,
        "name": "Watcher Seviye 2",
        "video": "https://arayis-evreni.siyahkare.com/assets/nft/NFT-watcher-2.mp4",
        "rarity": "uncommon"
    },
    {
        "id": 3,
        "category": "Warrior",
        "level": 1,
        "name": "Warrior Seviye 1",
        "video": "https://arayis-evreni.siyahkare.com/assets/nft/NFT-warrior-1.mp4",
        "rarity": "common"
    },
    {
        "id": 4,
        "category": "Warrior",
        "level": 2,
        "name": "Warrior Seviye 2",
        "video": "https://arayis-evreni.siyahkare.com/assets/nft/NFT-warrior-2.mp4",
        "rarity": "uncommon"
    },
    {
        "id": 5,
        "category": "Oracle",
        "level": 1,
        "name": "Oracle Seviye 1",
        "video": "https://arayis-evreni.siyahkare.com/assets/nft/NFT-oracle-1.mp4",
        "rarity": "rare"
    },
    {
        "id": 6,
        "category": "Guardian",
        "level": 1,
        "name": "Guardian Seviye 1",
        "video": "https://arayis-evreni.siyahkare.com/assets/nft/NFT-guardian-1.mp4",
        "rarity": "epic"
    },
    {
        "id": 7,
        "category": "Flirt",
        "level": 1,
        "name": "Flirt Seviye 1", 
        "video": "https://arayis-evreni.siyahkare.com/assets/nft/NFT-flirt-1.mp4",
        "rarity": "rare"
    },
    {
        "id": 8,
        "category": "Hacker",
        "level": 1,
        "name": "Hacker Seviye 1",
        "video": "https://arayis-evreni.siyahkare.com/assets/nft/NFT-hacker-1.mp4",
        "rarity": "uncommon"
    },
    {
        "id": 9,
        "category": "City",
        "level": 1,
        "name": "City Seviye 1",
        "video": "https://arayis-evreni.siyahkare.com/assets/nft/NFT-city-1.mp4",
        "rarity": "legendary"
    },
    {
        "id": 10,
        "category": "DAO",
        "level": 1,
        "name": "DAO Seviye 1",
        "video": "https://arayis-evreni.siyahkare.com/assets/nft/NFT-DAO-1.mp4",
        "rarity": "epic"
    }
]

# TODO: /nft/buy endpoint'i
# TODO: /gallery/{uid} endpoint'i (Kullanıcının NFT'lerini listele)
# TODO: Satıştaki NFT'leri listeleme endpoint'i

# --- Metadata API Endpoints (eski /nft endpoint'leri) ---

# Tüm NFT metadatalarını listeleyen endpoint (eski nft.py'den gelen)
@router.get("/list", response_model=List[NFTMetadata], tags=["NFT Metadata"])
async def list_nfts():
    """
    Tüm NFT'lerin metadata'larını listeler.
    """
    return nft_metadata

# ID'ye göre NFT metadata getiren endpoint (eski nft.py'den gelen)
@router.get("/{id}", response_model=NFTMetadata, tags=["NFT Metadata"])
async def get_nft_metadata_by_id(id: int):
    """
    Belirli bir NFT'nin metadata'sını ID parametresiyle döndürür.
    """
    for nft in nft_metadata:
        if nft["id"] == id:
            return nft
    
    # NFT bulunamadığında 404 hatası dön
    raise HTTPException(status_code=404, detail="NFT not found")

# Tüm NFT metadatalarını listeleyen endpoint (eski nfts.py'deki aynı endpoint)
@router.get("/metadata/list", response_model=List[NFTMetadata], tags=["NFT Metadata"])
async def list_nft_metadata():
    """
    Tüm NFT'lerin metadata'larını listeler.
    """
    return nft_metadata

# ID'ye göre NFT metadata getiren endpoint (eski nfts.py'deki aynı endpoint)
@router.get("/metadata/{id}", response_model=NFTMetadata, tags=["NFT Metadata"])
async def get_nft_metadata(id: int):
    """
    Belirli bir NFT'nin metadata'sını ID parametresiyle döndürür.
    """
    for nft in nft_metadata:
        if nft["id"] == id:
            return nft
    
    # NFT bulunamadığında 404 hatası dön
    raise HTTPException(status_code=404, detail="NFT not found")

# --- Veritabanı NFT Endpoints (eski /nfts endpoint'leri) ---

@router.get("/all", response_model=List[schemas.NFT])
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

@router.get("/details/{nft_id}", response_model=schemas.NFT)
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

@router.post("/buy", response_model=schemas.BuyNFTResponse)
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

@router.post("/mint", response_model=schemas.BuyNFTResponse)
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
    
    # TODO: NFT mint etme işlemini entegre et
    try:
        # Blockchain'e mint etme işlemi burada yapılacak
        # Şu an için simülasyon olarak başarılı kabul ediyoruz
        return schemas.BuyNFTResponse(
            message=f"{nft.name} başarıyla mint edildi!",
            remaining_stars=current_user.stars
        )
    except Exception as e:
        print(f"Error minting NFT {request.nft_id} for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="NFT mint edilirken bir hata oluştu.")

# Ana NFT listesi endpoint'i
@router.get("/", response_model=List[schemas.NFT])
def read_nfts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Tüm NFT'leri listeler.
    """
    # models.NFTCategory enum'undan kategoriler alınıyor
    categories = [
        models.NFTCategory.WATCHER, 
        models.NFTCategory.WARRIOR, 
        models.NFTCategory.ORACLE, 
        models.NFTCategory.GUARDIAN, 
        models.NFTCategory.FLIRT, 
        models.NFTCategory.HACKER,
        models.NFTCategory.CITY,
        models.NFTCategory.DAO
    ]
    
    nfts = []
    for i in range(10):
        category_index = i % len(categories)
        level = (i % 3) + 1  # 1, 2, veya 3
        category = categories[category_index]
        
        # Video URL'si
        video_path = f"https://arayis-evreni.siyahkare.com/assets/nft/NFT-{category.lower()}-{level}.mp4"
        # Aynı URL'yi resim için de kullan (uzantı olmadan)
        image_path = f"https://arayis-evreni.siyahkare.com/assets/nft/NFT-{category.lower()}-{level}"
        
        nft = schemas.NFT(
            id=i+1,
            name=f"{category} Level {level}",
            description=f"A {category} NFT at level {level}",
            video_url=video_path,
            image_url=image_path,
            category=category,
            price_stars=(i+1) * 100,
            total_supply=50 - (i * 3),
            mintable=i < 5,  # İlk 5 mint edilebilir
            is_active=True,
            created_at=datetime.now()
        )
        nfts.append(nft)
    
    return nfts

# Placeholder endpoint için de aynı düzeltmeyi yapalım
@router.get("/placeholder", response_model=List[schemas.NFT])
def read_nfts_placeholder(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Placeholder NFT'leri döndürür (geliştirme için).
    """
    # models.NFTCategory enum'undan kategoriler alınıyor
    categories = [
        models.NFTCategory.WATCHER, 
        models.NFTCategory.WARRIOR, 
        models.NFTCategory.ORACLE, 
        models.NFTCategory.GUARDIAN, 
        models.NFTCategory.FLIRT, 
        models.NFTCategory.HACKER,
        models.NFTCategory.CITY,
        models.NFTCategory.DAO
    ]
    
    nfts = []
    for i in range(10):
        category = random.choice(categories)
        random_level = random.randint(1, 3)
        
        # Video URL'si
        video_path = f"https://arayis-evreni.siyahkare.com/assets/nft/NFT-{category.lower()}-{random_level}.mp4"
        # Aynı URL'yi resim için de kullan (uzantı olmadan)
        image_path = f"https://arayis-evreni.siyahkare.com/assets/nft/NFT-{category.lower()}-{random_level}"
        
        nft = schemas.NFT(
            id=i+1,
            name=f"{category} Level {random_level}",
            description=f"A {category} NFT at level {random_level}",
            video_url=video_path,
            image_url=image_path,
            category=category,
            price_stars=random.randint(50, 500) * 10,
            total_supply=random.randint(10, 100),
            mintable=bool(random.getrandbits(1)),
            is_active=True,
            created_at=datetime.now()
        )
        nfts.append(nft)
    
    return nfts

# Logger mesajı
logger.info("⚙️ NFT API endpoints ready") 