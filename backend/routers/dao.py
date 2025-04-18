from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

# crud, models, schemas importları
import schemas, crud, models, auth
from database import get_db

router = APIRouter()

# TODO: /dao/proposals endpoint'i (Aktif oylamaları listele)
# TODO: /dao/vote endpoint'i

@router.get("/proposals", response_model=List[schemas.DAOProposal])
async def read_dao_proposals(
    status: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    DAO tekliflerini listeler. İsteğe bağlı olarak durum filtresi uygulanabilir.
    """
    # Durum parametresi kontrol
    if status and status not in [s.value for s in models.ProposalStatus]:
        raise HTTPException(
            status_code=400, 
            detail=f"Geçersiz durum. Geçerli değerler: {[s.value for s in models.ProposalStatus]}"
        )
    
    status_enum = models.ProposalStatus(status) if status else None
    proposals = crud.get_dao_proposals(db=db, status=status_enum, skip=skip, limit=limit)
    return proposals

@router.get("/proposals/{proposal_id}", response_model=schemas.DAOProposal)
async def read_dao_proposal_details(
    proposal_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Belirli bir DAO teklifinin detaylarını getirir.
    """
    proposal = crud.get_dao_proposal(db=db, proposal_id=proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Teklif bulunamadı.")
    
    return proposal

@router.post("/vote", response_model=schemas.VoteResponse)
async def vote_on_proposal(
    request: schemas.VoteRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Bir DAO teklifi üzerinde oy kullanır.
    """
    proposal = crud.get_dao_proposal(db=db, proposal_id=request.proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Teklif bulunamadı.")
    
    # Teklif açık mı?
    if proposal.status != models.ProposalStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Bu teklif artık oylamaya açık değil.")
    
    # Oylama süresi geçti mi?
    if datetime.now() > proposal.end_date:
        raise HTTPException(status_code=400, detail="Bu teklifin oylama süresi sona erdi.")
    
    # Kullanıcı daha önce oy kullandı mı?
    existing_vote = crud.get_user_vote(db=db, user_id=current_user.id, proposal_id=proposal.id)
    if existing_vote:
        raise HTTPException(status_code=400, detail="Bu teklif için zaten oy kullandınız.")
    
    # Oy gücünü hesapla - sahip olunan NFT'lere göre
    vote_power = 1  # Temel oy gücü
    
    # DAO oylama NFT'leri için ek güç
    for user_nft in current_user.nfts:
        nft = user_nft.nft
        if nft.category == models.NFTCategory.VOTE_BASIC:
            vote_power += 1
        elif nft.category == models.NFTCategory.VOTE_PREMIUM:
            vote_power += 5
        elif nft.category == models.NFTCategory.VOTE_SORA:
            vote_power += 10
    
    try:
        # Oyu kaydet
        vote = models.DAOVote(
            user_id=current_user.id,
            proposal_id=proposal.id,
            vote_power=vote_power,
            choice=request.choice
        )
        db.add(vote)
        
        # Teklif oy sayılarını güncelle
        if request.choice:  # Evet oyu
            proposal.total_yes_power += vote_power
        else:  # Hayır oyu
            proposal.total_no_power += vote_power
        
        db.commit()
        
        return schemas.VoteResponse(
            message=f"Oyunuz başarıyla kaydedildi! Oy gücü: {vote_power}"
        )
    except Exception as e:
        db.rollback()
        print(f"Error voting on proposal {request.proposal_id} for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Oy kullanılırken bir hata oluştu.") 