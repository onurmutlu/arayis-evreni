from fastapi import APIRouter, HTTPException
from typing import List
import logging
from pydantic import BaseModel
from enum import Enum

# Logger tanımlama
logger = logging.getLogger(__name__)

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

# Örnek NFT verileri
nft_data = [
    {
        "id": 1,
        "category": "Watcher",
        "level": 1,
        "name": "Watcher Seviye 1",
        "video": "https://cdn.siyahkare.com/nfts/NFT-watcher-1.mp4",
        "rarity": "common"
    },
    {
        "id": 2,
        "category": "Watcher",
        "level": 2,
        "name": "Watcher Seviye 2",
        "video": "https://cdn.siyahkare.com/nfts/NFT-watcher-2.mp4",
        "rarity": "uncommon"
    },
    {
        "id": 3,
        "category": "Warrior",
        "level": 1,
        "name": "Warrior Seviye 1",
        "video": "https://cdn.siyahkare.com/nfts/NFT-warrior-1.mp4",
        "rarity": "common"
    },
    {
        "id": 4,
        "category": "Warrior",
        "level": 2,
        "name": "Warrior Seviye 2",
        "video": "https://cdn.siyahkare.com/nfts/NFT-warrior-2.mp4",
        "rarity": "uncommon"
    },
    {
        "id": 5,
        "category": "Oracle",
        "level": 1,
        "name": "Oracle Seviye 1",
        "video": "https://cdn.siyahkare.com/nfts/NFT-oracle-1.mp4",
        "rarity": "rare"
    },
    {
        "id": 6,
        "category": "Guardian",
        "level": 1,
        "name": "Guardian Seviye 1",
        "video": "https://cdn.siyahkare.com/nfts/NFT-guardian-1.mp4",
        "rarity": "epic"
    },
    {
        "id": 7,
        "category": "Flirt",
        "level": 1,
        "name": "Flirt Seviye 1", 
        "video": "https://cdn.siyahkare.com/nfts/NFT-flirt-1.mp4",
        "rarity": "rare"
    },
    {
        "id": 8,
        "category": "Hacker",
        "level": 1,
        "name": "Hacker Seviye 1",
        "video": "https://cdn.siyahkare.com/nfts/NFT-hacker-1.mp4",
        "rarity": "uncommon"
    },
    {
        "id": 9,
        "category": "City",
        "level": 1,
        "name": "City Seviye 1",
        "video": "https://cdn.siyahkare.com/nfts/NFT-city-1.mp4",
        "rarity": "legendary"
    },
    {
        "id": 10,
        "category": "DAO",
        "level": 1,
        "name": "DAO Seviye 1",
        "video": "https://cdn.siyahkare.com/nfts/NFT-DAO-1.mp4",
        "rarity": "epic"
    }
]

# Tüm NFT'leri listeleyen endpoint
@router.get("/list", response_model=List[NFTMetadata], tags=["NFT"])
async def list_nfts():
    """
    Tüm NFT'lerin metadata'larını listeler.
    """
    return nft_data

# ID'ye göre NFT getiren endpoint
@router.get("/{id}", response_model=NFTMetadata, tags=["NFT"])
async def get_nft(id: int):
    """
    Belirli bir NFT'nin metadata'sını ID parametresiyle döndürür.
    """
    for nft in nft_data:
        if nft["id"] == id:
            return nft
    
    # NFT bulunamadığında 404 hatası dön
    raise HTTPException(status_code=404, detail="NFT not found")

# Logger mesajı
logger.info("⚙️ NFT API ready") 