from sqlalchemy.orm import Session

from models import NFT, UserNFT
from schemas import NFTCreate

def get_all_nfts(db: Session):
    return db.query(NFT).filter(NFT.is_active == True).all()

def get_nft(db: Session, nft_id: int):
    return db.query(NFT).filter(NFT.id == nft_id).first()

def get_user_nfts(db: Session, user_id: int):
    return db.query(UserNFT).filter(UserNFT.user_id == user_id).all()

def create_nft(db: Session, nft: NFTCreate):
    db_nft = NFT(**nft.dict())
    db.add(db_nft)
    db.commit()
    db.refresh(db_nft)
    return db_nft

def update_nft(db: Session, nft_id: int, nft_data: dict):
    db_nft = get_nft(db, nft_id)
    if db_nft:
        for key, value in nft_data.items():
            setattr(db_nft, key, value)
        db.commit()
        db.refresh(db_nft)
    return db_nft

def add_nft_to_user(db: Session, user_id: int, nft_id: int, purchase_price_stars: int):
    nft = get_nft(db, nft_id)
    user_nft = UserNFT(
        user_id=user_id,
        nft_id=nft_id,
        nft_name=nft.name,
        nft_image_url=nft.image_url,
        purchase_price_stars=purchase_price_stars
    )
    db.add(user_nft)
    db.commit()
    db.refresh(user_nft)
    return user_nft

def user_owns_nft(db: Session, user_id: int, nft_id: int):
    return db.query(UserNFT).filter(
        UserNFT.user_id == user_id, 
        UserNFT.nft_id == nft_id
    ).first() is not None 