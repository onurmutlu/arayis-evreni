from database import get_db
import models, schemas
from sqlalchemy.orm import Session
import contextlib

@contextlib.contextmanager
def get_db_session():
    db = get_db().__next__()
    try:
        yield db
    finally:
        db.close()

# Mevcut görevleri kontrol et
with get_db_session() as db:
    missions = db.query(models.Mission).all()
    print(f"Mevcut görev sayısı: {len(missions)}")
    
    for mission in missions:
        print(f"ID: {mission.id}, Başlık: {mission.title}, XP: {mission.xp_reward}") 