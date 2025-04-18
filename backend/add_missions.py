from database import SessionLocal, engine
from models import Mission, Badge
from sqlalchemy.orm import Session

def main():
    db = SessionLocal()
    try:
        # Mevcut görevlerin ID'lerini kontrol et
        existing_missions = db.query(Mission.id).all()
        existing_ids = [m[0] for m in existing_missions]
        print(f"Mevcut görev ID'leri: {existing_ids}")

        # Rozetleri sorgula (belirli görevler tamamlandığında rozet vermek için)
        badges = db.query(Badge).all()
        badge_dict = {badge.id: badge for badge in badges}
        
        # Görevleri ekle veya güncelle
        missions = [
            {
                "id": 1,
                "title": "Arayış Evrenine Hoş Geldin!",
                "description": "Arayış Evrenine katıldın! Bu yeni ve heyecan verici maceraya adım attın.",
                "xp_reward": 500,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": None
            },
            {
                "id": 2,
                "title": "İlk İletişim",
                "description": "Diğer bir kullanıcıya mesaj gönder.",
                "xp_reward": 100,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": True,
                "prerequisites": "1"
            },
            {
                "id": 3,
                "title": "Profil Tamamlama",
                "description": "Profil resmini yükle ve profil bilgilerini doldur.",
                "xp_reward": 200,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "1"
            },
            {
                "id": 4,
                "title": "İlk NFT",
                "description": "İlk NFT'ni satın al.",
                "xp_reward": 300,
                "badge_id": 1,  # Gözcü Rozeti
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "1,3"
            },
            {
                "id": 5,
                "title": "Sosyal Kelebek",
                "description": "Bir günde en az 5 farklı kullanıcıyla mesajlaş.",
                "xp_reward": 250,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": True,
                "prerequisites": "2"
            },
            {
                "id": 6,
                "title": "Yıldız Toplayıcı",
                "description": "500 yıldız topla.",
                "xp_reward": 300,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "1"
            },
            {
                "id": 7,
                "title": "Günlük Ziyaretçi",
                "description": "7 gün üst üste uygulamaya giriş yap.",
                "xp_reward": 350,
                "badge_id": 2,  # Savaşçı Rozeti
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "1"
            },
            {
                "id": 8,
                "title": "NFT Koleksiyoncusu",
                "description": "En az 3 farklı NFT satın al.",
                "xp_reward": 500,
                "badge_id": 3,  # Kahin Rozeti
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "4"
            },
            {
                "id": 9,
                "title": "VIP Üye",
                "description": "VIP üyelik satın al.",
                "xp_reward": 1000,
                "badge_id": 4,  # Hacker Rozeti
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "1"
            },
            {
                "id": 10,
                "title": "Sohbet Ustası",
                "description": "Bir hafta içinde en az 50 mesaj gönder.",
                "xp_reward": 400,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": True,
                "prerequisites": "2,5"
            },
            {
                "id": 11,
                "title": "DAO Katılımcısı",
                "description": "DAO'da bir öneride bulun.",
                "xp_reward": 700,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "1,9"
            },
            {
                "id": 12,
                "title": "Lider Adayı",
                "description": "Liderlik tablosunda ilk 20'ye gir.",
                "xp_reward": 800,
                "badge_id": 5,  # Koruyucu Rozeti
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "1,6"
            },
            {
                "id": 13,
                "title": "Bağlantı Kurma",
                "description": "10 farklı kullanıcıyla bağlantı kur.",
                "xp_reward": 450,
                "badge_id": 6,  # Flörtör Rozeti
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "2,5"
            },
            {
                "id": 14,
                "title": "Seviye 10",
                "description": "10. seviyeye ulaş.",
                "xp_reward": 600,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "1"
            },
            {
                "id": 15,
                "title": "Seviye 20",
                "description": "20. seviyeye ulaş.",
                "xp_reward": 1200,
                "badge_id": 7,  # Şehir Rozeti
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "14"
            },
            {
                "id": 16,
                "title": "Seviye 30",
                "description": "30. seviyeye ulaş.",
                "xp_reward": 2000,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "15"
            },
            {
                "id": 17,
                "title": "Evren Ustası",
                "description": "Tüm aktif görevleri tamamla.",
                "xp_reward": 5000,
                "badge_id": 8,  # DAO Üyesi Rozeti
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16"
            },
            {
                "id": 18,
                "title": "İlk Ödül",
                "description": "İlk günlük ödülünü al.",
                "xp_reward": 150,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "1"
            },
            {
                "id": 19,
                "title": "Düzenli Ziyaretçi",
                "description": "30 gün boyunca günlük ödüllerini al.",
                "xp_reward": 1500,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "18"
            },
            {
                "id": 20,
                "title": "Topluluk Lideri",
                "description": "DAO'daki önerilerin oylamada %70'ten fazla destek alsın.",
                "xp_reward": 2500,
                "badge_id": None,
                "is_active": True,
                "is_repeatable": False,
                "prerequisites": "11"
            }
        ]

        for mission_data in missions:
            mission_id = mission_data["id"]
            
            # Mevcut görev varsa güncelle, yoksa ekle
            if mission_id in existing_ids:
                mission = db.query(Mission).filter(Mission.id == mission_id).first()
                print(f"Güncelleniyor: {mission_data['title']}")
            else:
                mission = Mission()
                print(f"Ekleniyor: {mission_data['title']}")
            
            # Verileri güncelle
            for key, value in mission_data.items():
                setattr(mission, key, value)
            
            if mission_id not in existing_ids:
                db.add(mission)
        
        db.commit()
        print("Görev eklemeleri ve güncellemeleri tamamlandı!")
        
    except Exception as e:
        db.rollback()
        print(f"Hata: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 