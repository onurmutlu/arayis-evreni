from database import SessionLocal
from models import NFT
import json
import os

def main():
    db = SessionLocal()
    try:
        # NFT'leri veritabanından çek
        nfts = db.query(NFT).all()
        print(f"Toplam {len(nfts)} NFT bulundu.")

        # Metadata dizin yapısını oluştur
        metadata_dir = os.path.join("data", "nft_metadata")
        os.makedirs(metadata_dir, exist_ok=True)

        # Tüm NFT'leri içeren bir JSON dosyası oluştur
        all_nfts_metadata = []

        for nft in nfts:
            # Tekil NFT metadata JSON yapısı
            nft_metadata = {
                "id": nft.id,
                "name": nft.name,
                "category": nft.category.value,
                "level": 1,  # Başlangıç seviyesi
                "video": nft.video_url,
                "image": nft.image_url,
                "description": nft.description,
                "price": nft.price_stars,
                "rarity": get_rarity_for_nft(nft.id),
                "benefits": get_benefits_for_nft(nft.id)
            }
            
            # Tek tek NFT metadata dosyası
            nft_file_path = os.path.join(metadata_dir, f"nft_{nft.id}.json")
            with open(nft_file_path, "w") as f:
                json.dump(nft_metadata, f, indent=2, ensure_ascii=False)
            
            # Genel listeye ekle
            all_nfts_metadata.append(nft_metadata)
            print(f"NFT {nft.id} - {nft.name} için metadata oluşturuldu.")
        
        # Tüm NFT'leri içeren metadata dosyası
        all_nfts_file_path = os.path.join("data", "nfts.json")
        with open(all_nfts_file_path, "w") as f:
            json.dump(all_nfts_metadata, f, indent=2, ensure_ascii=False)
        
        print(f"Tüm NFT'ler için metadata dosyası oluşturuldu: {all_nfts_file_path}")
        
    except Exception as e:
        print(f"Hata: {e}")
    finally:
        db.close()

def get_rarity_for_nft(nft_id):
    """NFT'nin nadirlik derecesini belirler"""
    rarities = {
        1: "common",      # Gözcü
        2: "common",      # Savaşçı
        3: "uncommon",    # Kahin
        4: "uncommon",    # Hacker
        5: "rare",        # Koruyucu
        6: "rare",        # Flörtör
        7: "epic",        # Şehir
        8: "legendary"    # DAO Üyesi
    }
    return rarities.get(nft_id, "common")

def get_benefits_for_nft(nft_id):
    """NFT'nin sağladığı faydaları belirler"""
    benefits = {
        1: ["Görevleri görebilir ve izleyebilir", "Günlük %5 daha fazla yıldız"],
        2: ["Zorlu görevlerin kilidini açar", "Günlük %10 daha fazla yıldız"],
        3: ["Gelecekteki görevleri önceden görebilir", "DAO oylamalarında %5 daha fazla oy gücü"],
        4: ["Sistem etkileşiminiz %20 daha güçlü", "Her gün ekstra XP kazanımı"],
        5: ["Diğer kullanıcıları koruyabilir", "Özel alan görevlerine erişim"],
        6: ["Flört yetenekleriniz %30 daha etkili", "Özel eşleşme görünürlüğü"],
        7: ["Sanal şehirde mülk sahibi olun", "Bölgesel etkinliklerde ayrıcalıklar"],
        8: ["DAO'da premium oy hakkı", "Özel içeriklere erişim", "Topluluğu yönetme yetkisi"]
    }
    return benefits.get(nft_id, ["Temel NFT faydaları"])

if __name__ == "__main__":
    main() 