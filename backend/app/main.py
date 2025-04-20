import os
import json
import uuid
import random
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Set, Any
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import logging

# Logger konfigürasyonu
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ortam değişkenlerini yükle
load_dotenv()

# Local importlar
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

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
    "http://localhost",
    "http://localhost:3000",  # React frontend
    "http://localhost:8000",  # FastAPI
    "http://localhost:8001",  # Alternatif FastAPI portu
    "https://arayisevreni.com",
    "https://www.arayisevreni.com",
    "https://api.arayisevreni.com",
    "https://dev.arayisevreni.com"
]

# Geliştirme aşamasında tüm domainlerden istek kabul et
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tüm domainler. Prodüksiyonda 'origins' listesi kullanılmalı.
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
    """Frontend ile uyumlu olmak için profil endpoint'i"""
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
    """Frontend ile uyumlu olmak için görevler endpoint'i"""
    try:
        # users modülündeki get_user_missions fonksiyonunu çağır
        return await users.get_user_missions(uid, db)
    except Exception as e:
        print(f"Missions error: {e}")
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

# Api modülünü başlatmak için
if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 8000))
    HOST = os.getenv("HOST", "0.0.0.0")
    
    print(f"Uygulama {HOST}:{PORT} adresinde başlatılıyor...")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True) 