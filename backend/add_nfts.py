from database import SessionLocal, engine
from models import NFT, NFTCategory
from sqlalchemy.orm import Session

def main():
    db = SessionLocal()
    try:
        # Mevcut NFT'lerin ID'lerini kontrol et
        existing_nfts = db.query(NFT.id).all()
        existing_ids = [n[0] for n in existing_nfts]
        print(f"Mevcut NFT ID'leri: {existing_ids}")

        # NFT'leri ekle veya güncelle
        nfts = [
            {
                "id": 1,
                "name": "Gözcü",
                "description": "Görevleri görebilir ve takip edebilirsin.",
                "image_url": "/assets/nft/NFT-watcher.mp4",
                "video_url": "/assets/nft/NFT-watcher.mp4",
                "category": NFTCategory.GENERAL,
                "price_stars": 1000,
                "total_supply": 100,
                "mintable": False,
                "is_active": True
            },
            {
                "id": 2,
                "name": "Savaşçı",
                "description": "Zorlu görevlerin üstesinden gelebilirsin.",
                "image_url": "/assets/nft/NFT-warrior.mp4",
                "video_url": "/assets/nft/NFT-warrior.mp4",
                "category": NFTCategory.GENERAL,
                "price_stars": 2500,
                "total_supply": 75,
                "mintable": False,
                "is_active": True
            },
            {
                "id": 3,
                "name": "Kahin",
                "description": "Gelecekteki görevleri tahmin edebilirsin.",
                "image_url": "/assets/nft/NFT-oracle.mp4",
                "video_url": "/assets/nft/NFT-oracle.mp4",
                "category": NFTCategory.GENERAL,
                "price_stars": 5000,
                "total_supply": 50,
                "mintable": False,
                "is_active": True
            },
            {
                "id": 4,
                "name": "Hacker",
                "description": "Sistemle etkileşimini güçlendirir.",
                "image_url": "/assets/nft/NFT-hacker.mp4",
                "video_url": "/assets/nft/NFT-hacker.mp4",
                "category": NFTCategory.GENERAL,
                "price_stars": 7500,
                "total_supply": 30,
                "mintable": False,
                "is_active": True
            },
            {
                "id": 5,
                "name": "Koruyucu",
                "description": "Diğer kullanıcıları koruma yeteneği kazandırır.",
                "image_url": "/assets/nft/NFT-guardian.mp4",
                "video_url": "/assets/nft/NFT-guardian.mp4",
                "category": NFTCategory.GENERAL,
                "price_stars": 10000,
                "total_supply": 20,
                "mintable": False,
                "is_active": True
            },
            {
                "id": 6,
                "name": "Flörtör",
                "description": "Flört yeteneklerini ve ödüllerini artırır.",
                "image_url": "/assets/nft/NFT-flirt.mp4",
                "video_url": "/assets/nft/NFT-flirt.mp4",
                "category": NFTCategory.GENERAL,
                "price_stars": 12500,
                "total_supply": 15,
                "mintable": False,
                "is_active": True
            },
            {
                "id": 7,
                "name": "Şehir",
                "description": "Sanal şehirde mülk sahibi olursun.",
                "image_url": "/assets/nft/NFT-city.mp4",
                "video_url": "/assets/nft/NFT-city.mp4",
                "category": NFTCategory.GENERAL,
                "price_stars": 15000,
                "total_supply": 10,
                "mintable": False,
                "is_active": True
            },
            {
                "id": 8,
                "name": "DAO Üyesi",
                "description": "DAO'da oy kullanma haklarına sahip olursun.",
                "image_url": "/assets/nft/NFT-DAO.mp4",
                "video_url": "/assets/nft/NFT-DAO.mp4",
                "category": NFTCategory.VOTE_PREMIUM,
                "price_stars": 20000,
                "total_supply": 5,
                "mintable": False,
                "is_active": True
            }
        ]

        for nft_data in nfts:
            nft_id = nft_data["id"]
            
            # Mevcut NFT varsa güncelle, yoksa ekle
            if nft_id in existing_ids:
                nft = db.query(NFT).filter(NFT.id == nft_id).first()
                print(f"Güncelleniyor: {nft_data['name']}")
            else:
                nft = NFT()
                print(f"Ekleniyor: {nft_data['name']}")
            
            # Verileri güncelle
            for key, value in nft_data.items():
                setattr(nft, key, value)
            
            if nft_id not in existing_ids:
                db.add(nft)
        
        db.commit()
        print("NFT eklemeleri ve güncellemeleri tamamlandı!")
        
    except Exception as e:
        db.rollback()
        print(f"Hata: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 