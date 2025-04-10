# backend/routers/leaderboard.py
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
from typing import List

# crud, models, schemas importları
import schemas, crud, models, auth
from database import get_db

router = APIRouter(
    prefix="/leaderboard", # /api/v1/leaderboard
    tags=["Leaderboard"],
    dependencies=[Depends(auth.get_current_active_user)] # Sıralamayı görmek için giriş yapmış olmak yeterli
)

VALID_CATEGORIES = ["xp", "missions_completed"] # Desteklenen kategoriler (stars_spent eklenebilir)

@router.get("/{category}", response_model=schemas.LeaderboardResponse)
async def get_leaderboard_by_category(
    category: str = Path(..., description=f"Sıralama kategorisi: {', '.join(VALID_CATEGORIES)}"),
    limit: int = Query(20, ge=1, le=100, description="Gösterilecek kullanıcı sayısı"), # Query parametresi olarak limit
    db: Session = Depends(get_db)
):
    """Gets the leaderboard for the specified category."""
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Geçersiz kategori. Geçerli kategoriler: {', '.join(VALID_CATEGORIES)}")

    try:
        entries = crud.get_leaderboard(db, category=category, limit=limit)
        return schemas.LeaderboardResponse(category=category, entries=entries)
    except ValueError as e: # crud içinde geçersiz kategori hatası
         raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error fetching leaderboard for category {category}: {e}")
        raise HTTPException(status_code=500, detail="Sıralama getirilirken bir hata oluştu.") 