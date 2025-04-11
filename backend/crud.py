# Bu dosya veritabanı işlemleri için fonksiyonları içerecek.
# (Örn: Kullanıcı oluştur, görev getir, NFT al vb.)
# Şimdilik boş bırakıyoruz, endpoint'leri yazdıkça dolduracağız.

from sqlalchemy.orm import Session
import models, schemas  # Kullanılmaya başlandığında importlar eklenecek
from typing import Optional
from sqlalchemy import func, desc

# Kullanıcı işlemleri
def get_user(db: Session, user_id: int):
    """Kullanıcıyı ID'ye göre getir"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_telegram_id(db: Session, telegram_id: int):
    """Kullanıcıyı Telegram ID'ye göre getir"""
    return db.query(models.User).filter(models.User.telegram_id == telegram_id).first()

def get_user_by_username(db: Session, username: str):
    """Kullanıcıyı kullanıcı adına göre getir"""
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user_data: schemas.UserCreate):
    """Yeni kullanıcı oluştur"""
    new_user = models.User(
        telegram_id=user_data.telegram_id,
        username=user_data.username,
        first_name=user_data.first_name,
        xp=0,
        level=1,
        stars=50,  # Başlangıç stars miktarı
        stars_enabled=True,
        has_vip_access=False,
        consecutive_login_days=1,
        mission_streak=0
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Başlangıç yıldızları için işlem kaydı oluştur
    create_star_transaction(
        db=db,
        user_id=new_user.id,
        amount=50,
        transaction_type=models.TransactionType.CREDIT,
        reason="signup_bonus",
        description="Kayıt olma bonusu"
    )
    
    return new_user

# Star işlemleri için yeni fonksiyonlar
def create_star_transaction(
    db: Session, 
    user_id: int, 
    amount: int, 
    transaction_type: models.TransactionType,
    reason: str, 
    description: str = None
):
    """Yeni bir yıldız işlemi kaydı oluşturur"""
    transaction = models.StarTransaction(
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        reason=reason,
        description=description
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

def get_user_star_transactions(db: Session, user_id: int, limit: int = 10):
    """Kullanıcının yıldız işlem geçmişini getirir"""
    return db.query(models.StarTransaction)\
             .filter(models.StarTransaction.user_id == user_id)\
             .order_by(desc(models.StarTransaction.created_at))\
             .limit(limit)\
             .all()

def get_user_stars_spent(db: Session, user_id: int):
    """Kullanıcının harcadığı toplam yıldız miktarını hesaplar"""
    result = db.query(func.sum(models.StarTransaction.amount).label("total"))\
               .filter(
                   models.StarTransaction.user_id == user_id,
                   models.StarTransaction.transaction_type == models.TransactionType.DEBIT
               )\
               .first()
    
    # Eğer harcama yoksa 0 döndür
    return abs(result.total) if result and result.total else 0

# Örnek bir fonksiyon yapısı:
# def get_user_by_telegram_id(db: Session, telegram_id: int):
#     return db.query(models.User).filter(models.User.telegram_id == telegram_id).first() 