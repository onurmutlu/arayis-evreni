from database import SessionLocal, engine
from models import Badge
from sqlalchemy.orm import Session

def main():
    db = SessionLocal()
    try:
        # Mevcut rozetlerin ID'lerini kontrol et
        existing_badges = db.query(Badge.id).all()
        existing_ids = [b[0] for b in existing_badges]
        print(f"Mevcut rozet ID'leri: {existing_ids}")

        # Rozetleri ekle veya güncelle
        badges = [
            {
                "id": 1,
                "name": "Gezgin",
                "description": "Arayış Evreni'ne giriş yaptın ve yolculuğuna başladın.",
                "image_url": "/assets/badges/gezgin.svg",
                "required_level": 1,
                "is_active": True
            },
            {
                "id": 2,
                "name": "Analist",
                "description": "10 analiz görevini başarıyla tamamladın.",
                "image_url": "/assets/badges/analist.svg",
                "required_level": 3,
                "is_active": True
            },
            {
                "id": 3,
                "name": "Kalp Avcısı",
                "description": "Flört modunda ustalaştın.",
                "image_url": "/assets/badges/kalp-avcisi.svg",
                "required_level": 5,
                "is_active": True
            },
            {
                "id": 4,
                "name": "Elçi",
                "description": "5 arkadaşını Arayış Evreni'ne davet ettin.",
                "image_url": "/assets/badges/elci.svg",
                "required_level": 3,
                "is_active": True
            },
            {
                "id": 5,
                "name": "VIP Üye",
                "description": "VIP üyelik satın aldın ve özel içeriklere erişim kazandın.",
                "image_url": "/assets/badges/vip.svg",
                "required_level": 1,
                "is_active": True
            },
            {
                "id": 6,
                "name": "Bilge",
                "description": "Bilginin peşinde koşarak 25. seviyeye ulaştın.",
                "image_url": "/assets/badges/bilge.svg",
                "required_level": 25,
                "is_active": True
            },
            {
                "id": 7,
                "name": "Koleksiyoner",
                "description": "En az 5 NFT sahibi oldun.",
                "image_url": "/assets/badges/koleksiyoner.svg",
                "required_level": 10,
                "is_active": True
            },
            {
                "id": 8,
                "name": "Karar Verici",
                "description": "DAO oylamalarına aktif katılım gösterdin.",
                "image_url": "/assets/badges/karar-verici.svg",
                "required_level": 8,
                "is_active": True
            },
            {
                "id": 9,
                "name": "Sadık Takipçi",
                "description": "30 gün boyunca her gün giriş yaptın.",
                "image_url": "/assets/badges/sadik-takipci.svg",
                "required_level": 5,
                "is_active": True
            },
            {
                "id": 10,
                "name": "Görev Tutkunu",
                "description": "100 görevi tamamlayarak azmin simgesi oldun.",
                "image_url": "/assets/badges/gorev-tutkunu.svg",
                "required_level": 15,
                "is_active": True
            }
        ]

        for badge_data in badges:
            badge_id = badge_data["id"]
            
            # Mevcut rozet varsa güncelle, yoksa ekle
            if badge_id in existing_ids:
                badge = db.query(Badge).filter(Badge.id == badge_id).first()
                print(f"Güncelleniyor: {badge_data['name']}")
            else:
                badge = Badge()
                print(f"Ekleniyor: {badge_data['name']}")
            
            # Verileri güncelle
            for key, value in badge_data.items():
                setattr(badge, key, value)
            
            if badge_id not in existing_ids:
                db.add(badge)
        
        db.commit()
        print("Rozet eklemeleri ve güncellemeleri tamamlandı!")
        
    except Exception as e:
        db.rollback()
        print(f"Hata: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 