#!/usr/bin/env python3
"""
Test kullanıcısı oluşturma betiği.
Bu script, test amaçlı bir kullanıcı oluşturur. Yalnızca geliştirme ortamında kullanılmalıdır.
"""

import os
import sys
from sqlalchemy.orm import Session
from datetime import datetime

# Gerekli modülleri import et
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal, engine
import models
from schemas import UserCreate
import crud

def create_test_user(telegram_id: int, username: str = "test_user"):
    """Test kullanıcısı oluştur"""
    db = SessionLocal()
    try:
        # Kullanıcı zaten var mı kontrol et
        existing_user = crud.get_user_by_telegram_id(db, telegram_id)
        if existing_user:
            print(f"🔍 Kullanıcı zaten mevcut: {existing_user.telegram_id} ({existing_user.username})")
            return existing_user
        
        # Yeni kullanıcı oluştur
        user_data = UserCreate(
            telegram_id=telegram_id,
            username=username,
            first_name="Test",
            last_name="User",
            inviter_id=None
        )
        
        new_user = crud.create_user(db, user_data)
        print(f"✅ Yeni kullanıcı oluşturuldu: {new_user.telegram_id} ({new_user.username})")
        
        # Kullanıcı profil bilgilerini doğrudan ayarla
        new_user.xp = 750
        new_user.level = 5
        new_user.stars = 1000
        new_user.stars_enabled = True
        new_user.has_vip_access = True
        db.add(new_user)
        
        # Kullanıcının son giriş tarihini güncelle
        new_user.last_login_date = datetime.now()
        
        # Commit yap
        db.commit()
        db.refresh(new_user)
        print(f"✅ Kullanıcı profili güncellendi: Level {new_user.level}, XP: {new_user.xp}, Stars: {new_user.stars}")
        
        return new_user
    
    except Exception as e:
        db.rollback()
        print(f"❌ Hata oluştu: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    # Komut satırından ID değerini al veya varsayılan değeri kullan
    import sys
    telegram_id = int(sys.argv[1]) if len(sys.argv) > 1 else 7576090003
    
    print(f"🚀 Test kullanıcısı oluşturuluyor: {telegram_id}")
    create_test_user(telegram_id)
    print("✨ İşlem tamamlandı!") 