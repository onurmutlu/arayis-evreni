from sqlalchemy.orm import Session
from database import engine, Base
from models import Mission
import contextlib

@contextlib.contextmanager
def get_db_session():
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()

def main():
    with get_db_session() as db:
        missions = db.query(Mission).all()
        print(f"Toplam görev sayısı: {len(missions)}")
        print("\nGörev Listesi:")
        for mission in missions:
            print(f"ID: {mission.id}, Başlık: {mission.title}, XP: {mission.xp_reward}")

if __name__ == "__main__":
    main() 