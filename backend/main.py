# main.py - FastAPI entrypoint

from fastapi import FastAPI, Depends, HTTPException, status, Request, Query, BackgroundTasks, Response, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Any, Dict

# Logger konfigürasyonu
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ortam değişkenlerini yükle
load_dotenv()

# Local importlar
import models, schemas, crud
from database import SessionLocal, engine, get_db
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
    description="Arayış Evreni platformu için backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS ayarları
origins = [
    "http://localhost:5173",  # Vite standart development portu
    "http://localhost:5174", 
    "http://localhost:5190",
    "http://localhost:5191",
    "http://localhost:5192",
    "http://localhost:3000",  # React standart portu
    "http://localhost:8000",  # Backend portu (aynı origin test için)
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5190",
    "http://127.0.0.1:5191",
    "http://127.0.0.1:5192",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "https://arayis-evreni.siyahkare.com",  # Production domainler
    "*",  # Geliştirme için tüm originlere izin ver. Production'da kaldırılmalı!
]

# Geliştirme aşamasında tüm domainlerden istek kabul et
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(missions.router, prefix="/missions", tags=["missions"])
app.include_router(nfts.router, prefix="/nfts", tags=["nfts"])
app.include_router(vip.router, prefix="/vip", tags=["vip"])
app.include_router(dao.router, prefix="/dao", tags=["dao"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])

# Frontend ile uyumlu olmak için doğrudan endpoint'ler
@app.get("/profile/{uid}", tags=["Users"])
async def get_profile(uid: str, db: Session = Depends(get_db)):
    """
    Kullanıcı profil bilgisini uid (telegram_id veya username) ile getirir.
    """
    return await users.get_user_profile(uid, db)

@app.get("/wallet/{uid}", tags=["Users"])
async def get_wallet(uid: str, db: Session = Depends(get_db)):
    """Frontend ile uyumlu olmak için cüzdan endpoint'i"""
    try:
        return await users.get_user_wallet(uid, db)
    except:
        return {"error": "Cüzdan bilgisi bulunamadı", "uid": uid}

@app.get("/missions/{uid}", tags=["Missions"])
async def get_missions(uid: str, db: Session = Depends(get_db)):
    """
    Demo kullanıcısı için görev listesini döndürür.
    """
    try:
        # Demo kullanıcıları için sabit görevler
        if uid == "demo123" or uid == "123456":
            demo_missions = [
                {
                    "id": 1,
                    "title": "Merhaba Evreni",
                    "description": "Arayış evrenine hoş geldin! İlk görevini tamamla.",
                    "xp_reward": 50,
                    "mission_type": "diğer",
                    "cooldown_hours": 24,
                    "required_level": 1,
                    "is_active": True,
                    "created_at": (datetime.now() - timedelta(days=7)).isoformat(),
                    "is_vip": False,
                    "is_completed": True,
                    "last_completed_at": (datetime.now() - timedelta(days=2)).isoformat(),
                    "is_on_cooldown": False,
                    "unlocked": True,
                    "can_complete": False,
                    "category": "basics"
                },
                {
                    "id": 2,
                    "title": "İlk Flört",
                    "description": "Bir flört görevini tamamla ve flört becerilerini test et!",
                    "xp_reward": 100,
                    "mission_type": "flört",
                    "cooldown_hours": 12,
                    "required_level": 1,
                    "is_active": True,
                    "created_at": (datetime.now() - timedelta(days=5)).isoformat(),
                    "is_vip": False,
                    "is_completed": False,
                    "is_on_cooldown": False,
                    "unlocked": True,
                    "can_complete": True,
                    "category": "flirt"
                },
                {
                    "id": 3,
                    "title": "Analiz Uzmanı",
                    "description": "Analiz yapmanı gerektiren bu görevi tamamla ve ödülünü kazan!",
                    "xp_reward": 150,
                    "mission_type": "analiz",
                    "cooldown_hours": 24,
                    "required_level": 2,
                    "is_active": True,
                    "created_at": (datetime.now() - timedelta(days=4)).isoformat(),
                    "is_vip": False,
                    "is_completed": False,
                    "is_on_cooldown": False,
                    "unlocked": True,
                    "can_complete": True,
                    "category": "analysis"
                },
                {
                    "id": 4,
                    "title": "Arkadaş Davet Et",
                    "description": "Arkadaşını Arayış Evreni'ne davet et ve ekstra ödül kazan!",
                    "xp_reward": 200,
                    "mission_type": "davet",
                    "cooldown_hours": 0,
                    "required_level": 1,
                    "is_active": True,
                    "created_at": (datetime.now() - timedelta(days=3)).isoformat(),
                    "is_vip": False,
                    "is_completed": False,
                    "is_on_cooldown": False,
                    "unlocked": True,
                    "can_complete": True,
                    "category": "social"
                },
                {
                    "id": 5,
                    "title": "VIP Özel Görevi",
                    "description": "Bu görevi tamamlamak için VIP üyelik gerekiyor. VIP üye olun!",
                    "xp_reward": 300,
                    "mission_type": "flört",
                    "cooldown_hours": 48,
                    "required_level": 3,
                    "is_active": True,
                    "created_at": (datetime.now() - timedelta(days=2)).isoformat(),
                    "is_vip": True,
                    "is_completed": False,
                    "is_on_cooldown": False,
                    "unlocked": False,
                    "can_complete": False,
                    "category": "vip"
                }
            ]
            return demo_missions
        else:
            # Gerçek kullanıcılar için normal görev listesi endpointi çağrılıyor
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"Missions error: {e}")
        # Hata durumunda yine demo görevleri döndür
        return []

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

# Endpoint for badges data
@app.get("/api/badges", response_model=List[schemas.Badge])
async def get_badges():
    """
    Rozet verilerini döndüren endpoint
    """
    try:
        badge_data_path = "backend/data/badges_data.json"
        
        # Dosya var mı kontrol et
        if not os.path.exists(badge_data_path):
            # Dosya yoksa alternatifleri kontrol et
            for alt_path in ["data/badges_data.json", "./data/badges_data.json", "../data/badges_data.json"]:
                if os.path.exists(alt_path):
                    badge_data_path = alt_path
                    break
            else:
                # Hiçbir dosya yoksa hata döndür
                raise HTTPException(
                    status_code=404,
                    detail=f"Rozet verileri bulunamadı. Aranan dosya: {badge_data_path}"
                )
        
        # Rozet verilerini oku
        with open(badge_data_path, "r", encoding="utf-8") as f:
            badge_data = json.load(f)
            
        return badge_data
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Rozet verileri alınırken hata oluştu: {str(e)}"
        )

# NFT metadata route'ları
@app.get("/api/nft-metadata")
async def get_all_nft_metadata():
    """Tüm NFT'lerin metadata bilgilerini döndürür"""
    try:
        metadata_path = os.path.join("data", "nfts.json")
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        return metadata
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Metadata yüklenirken hata oluştu: {str(e)}"}
        )

@app.get("/api/nft-metadata/{nft_id}")
async def get_nft_metadata(nft_id: int):
    """Belirli bir NFT'nin metadata bilgilerini döndürür"""
    try:
        metadata_path = os.path.join("data", "nft_metadata", f"nft_{nft_id}.json")
        if not os.path.exists(metadata_path):
            return JSONResponse(
                status_code=404,
                content={"message": f"NFT ID {nft_id} için metadata bulunamadı"}
            )
            
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        return metadata
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Metadata yüklenirken hata oluştu: {str(e)}"}
        )

# Leaderboard API endpoint - frontend ile uyumlu
@app.get("/api/leaderboard", tags=["Leaderboard"])
async def api_get_leaderboard(
    category: str = Query(..., description="Leaderboard category (xp, missions_completed, stars)"),
    limit: int = Query(50, description="Number of results to return"),
    time_frame: str = Query("all", description="Time frame (all, weekly, monthly)"),
    db: Session = Depends(get_db)
):
    """
    Frontend ile uyumlu olması için leaderboard endpoint'i.
    Kimlik doğrulama gerektirmez.
    """
    try:
        valid_categories = ["xp", "missions_completed", "stars", "badges"]
        if category not in valid_categories:
            return JSONResponse(
                status_code=400, 
                content={"detail": f"Geçersiz kategori. Geçerli değerler: {valid_categories}"}
            )
        
        # Veritabanından liderlik tablosunu al
        entries = crud.get_leaderboard(db=db, category=category, limit=limit)
        
        # İstatistik verileri
        stats = {
            "total_participants": crud.get_user_count(db),
            "competition_end_date": (datetime.now() + timedelta(days=14)).isoformat(),
            "prize_pool": "5000 TON"
        }
        
        return {
            "category": category,
            "entries": entries,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Leaderboard error: {str(e)}")
        # Hata durumunda örnek veri döndür
        return {
            "category": category,
            "entries": [],
            "stats": {
                "total_participants": 0,
                "competition_end_date": (datetime.now() + timedelta(days=14)).isoformat(),
                "prize_pool": "5000 TON"
            }
        }

# Uygulamayı doğrudan çalıştırma
if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 8000))
    HOST = os.getenv("HOST", "0.0.0.0")
    
    print(f"Uygulama {HOST}:{PORT} adresinde başlatılıyor...")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)

logger.info("🚀 Backend API ready")
