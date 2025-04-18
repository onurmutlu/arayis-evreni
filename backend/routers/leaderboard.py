# backend/routers/leaderboard.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

import crud, models, schemas, auth
from database import get_db

router = APIRouter()

@router.get("/leaderboard/{category}", response_model=schemas.LeaderboardResponse)
async def get_leaderboard(
    category: str,
    limit: int = 20,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Belirli bir kategori için liderlik tablosunu getirir.
    Kategoriler: xp, missions_completed, stars_spent
    """
    valid_categories = ["xp", "missions_completed", "stars_spent"]
    if category not in valid_categories:
        raise HTTPException(
            status_code=400, 
            detail=f"Geçersiz kategori. Geçerli değerler: {valid_categories}"
        )
    
    entries = crud.get_leaderboard(db=db, category=category, limit=limit)
    
    # Kullanıcının kendi konumunu bul
    user_rank = None
    for entry in entries:
        if entry.user_id == current_user.id:
            user_rank = entry.rank
            break
    
    # Eğer kullanıcı ilk N'de değilse, kendi konumunu ekle
    if user_rank is None:
        user_rank = crud.get_user_leaderboard_rank(db=db, user_id=current_user.id, category=category)
        if user_rank:
            user_entry = schemas.LeaderboardEntry(
                rank=user_rank,
                user_id=current_user.id,
                username=current_user.username,
                value=getattr(current_user, category if category != "missions_completed" else "xp")
            )
            entries.append(user_entry)
    
    return schemas.LeaderboardResponse(
        category=category,
        entries=entries
    )

@router.get("/user-rank/{category}", response_model=int)
async def get_user_rank(
    category: str,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcının belirli bir kategorideki sıralamasını getirir.
    """
    valid_categories = ["xp", "missions_completed", "stars_spent"]
    if category not in valid_categories:
        raise HTTPException(
            status_code=400, 
            detail=f"Geçersiz kategori. Geçerli değerler: {valid_categories}"
        )
    
    rank = crud.get_user_leaderboard_rank(db=db, user_id=current_user.id, category=category)
    if not rank:
        return 0
    
    return rank 