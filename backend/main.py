# main.py - FastAPI entrypoint

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import uvicorn

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
import auth

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
    description="Arayış Evreni mini uygulaması için backend API",
    version="1.0.0"
)

# CORS ayarları
origins = [
    "http://localhost:*",  # Vite dev server
    "http://localhost:3000",
    "https://arayis-evreni.vercel.app",
    "*"  # Geliştirme aşamasında tüm kaynaklara izin ver
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(missions.router, prefix="/api/missions", tags=["Missions"])
app.include_router(nfts.router, prefix="/api/nfts", tags=["NFTs"])
app.include_router(vip.router, prefix="/api/vip", tags=["VIP"])
app.include_router(dao.router, prefix="/api/dao", tags=["DAO"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["Leaderboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# Auth endpoint'leri
@app.post("/api/token", response_model=schemas.Token)
async def login_for_access_token(form_data: schemas.InitData, db: Session = Depends(get_db)):
    """
    Kullanıcı kimlik doğrulama ve token alma endpoint'i.
    Telegram WebApp initData verileriyle çalışır.
    """
    user = auth.authenticate_user(db, form_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz kimlik bilgileri",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Token oluştur
    access_token = auth.create_access_token(data={"sub": str(user.telegram_id)})
    
    return {"access_token": access_token, "token_type": "bearer"}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Arayış Evreni API'ye Hoş Geldiniz! Dokümantasyon için /docs adresini ziyaret edin."}

# Sağlık kontrolü
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Uygulamayı doğrudan çalıştırma
if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 8000))
    HOST = os.getenv("HOST", "0.0.0.0")
    
    print(f"Uygulama {HOST}:{PORT} adresinde başlatılıyor...")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
