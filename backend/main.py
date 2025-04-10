# main.py - FastAPI entrypoint

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Ortam değişkenlerini yükle
load_dotenv()

# crud modülünü import et (artık boş değil, veya olacak)
import models, schemas, crud # crud importunu aktif et
from database import SessionLocal, engine, get_db
# routers klasöründeki modülleri import et
import routers.users as users
import routers.missions as missions
import routers.nfts as nfts
import routers.dao as dao
import routers.admin as admin
import routers.vip as vip
import routers.leaderboard as leaderboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Uygulama başlarken veritabanı tablolarını oluştur (Alembic yoksa)
    # Dikkat: Bu yöntem basit geliştirmeler için uygundur, production'da Alembic kullanılmalı.
    try:
        print("Veritabanı tabloları oluşturuluyor (Alembic yoksa)...")
        models.Base.metadata.create_all(bind=engine)
        print("Veritabanı tabloları başarıyla kontrol edildi/oluşturuldu.")
    except Exception as e:
        print(f"Veritabanı oluşturulurken HATA: {e}")
    yield
    # Uygulama kapanırken yapılacaklar (varsa)
    print("Uygulama kapanıyor.")

app = FastAPI(
    title="Arayış Evreni API",
    description="Arayış Evreni Telegram MiniApp için Backend API",
    version="1.0.0", # Versiyon güncellendi - üretim için hazır
    lifespan=lifespan # lifespan olay yöneticisini ekle
)

# CORS Ayarları - Frontend'den gelen isteklere izin vermek için
# İzin verilecek orijinleri ortam değişkenlerinden al
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

# Production URL'i varsa ekle
PRODUCTION_URL = os.getenv("PRODUCTION_URL")
if PRODUCTION_URL:
    ALLOWED_ORIGINS.append(PRODUCTION_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Router'ları Uygulamaya Dahil Etme ---
# Ana prefix /api/v1 altında toplandı
API_PREFIX = "/api/v1"

app.include_router(users.router, prefix=API_PREFIX, tags=["Users & Auth"])
app.include_router(missions.router, prefix=API_PREFIX, tags=["Missions"])
app.include_router(nfts.router, prefix=API_PREFIX, tags=["NFTs"])       # NFT endpointleri henüz boş
app.include_router(dao.router, prefix=API_PREFIX, tags=["DAO"])         # DAO endpointleri henüz boş
app.include_router(vip.router, prefix=API_PREFIX, tags=["VIP"])         # Yeni VIP router
app.include_router(leaderboard.router, prefix=API_PREFIX, tags=["Leaderboard"]) # Yeni Leaderboard router
app.include_router(admin.router, prefix=f"{API_PREFIX}/admin", tags=["Admin"])

@app.get(f"{API_PREFIX}/health", tags=["Health"], response_model=dict)
def read_root():
    """Sağlık kontrolü endpoint'i"""
    return {"status": "ok", "version": app.version, "environment": os.getenv("ENVIRONMENT", "development")}

# Uygulamayı doğrudan çalıştırma
if __name__ == "__main__":
    import uvicorn
    PORT = int(os.getenv("PORT", 8000))
    HOST = os.getenv("HOST", "0.0.0.0")
    
    print(f"Uygulama {HOST}:{PORT} adresinde başlatılıyor...")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
