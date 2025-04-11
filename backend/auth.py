# backend/auth.py
import hmac
import hashlib
import json
from urllib.parse import unquote
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError

import crud, models, schemas
from database import get_db
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
BOT_TOKEN = os.getenv("BOT_TOKEN")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login/token") # Token URL'i (gerçek değil, sadece şema için)

# Geliştirme için varsayılan Telegram ID
DEV_FALLBACK_TELEGRAM_ID = int(os.getenv("DEV_FALLBACK_TELEGRAM_ID", "12345678")) # Frontend'deki VITE_FALLBACK_USER_ID ile aynı olmalı

def validate_init_data(init_data: str, bot_token: str = BOT_TOKEN) -> Optional[schemas.InitData]:
    """Validates the initData string from Telegram WebApp."""
    if not bot_token:
        print("Error: BOT_TOKEN is not set.")
        return None

    try:
        # Veriyi & ile ayrılmış anahtar=değer çiftlerine böl
        parsed_data = {}
        for item in init_data.split('&'):
            if '=' in item:
                key, value = item.split('=', 1)
                # user, chat, receiver gibi JSON olanları özel olarak handle etme, Pydantic halleder.
                parsed_data[unquote(key)] = unquote(value)
            else:
                pass

        received_hash = parsed_data.pop('hash', None)
        if not received_hash:
            print("Validation Error: No hash found in initData")
            return None

        data_check_string_parts = []
        for key, value in sorted(parsed_data.items()):
            data_check_string_parts.append(f"{key}={value}")
        data_check_string = "\n".join(data_check_string_parts)

        secret_key_bytes = hmac.new("WebAppData".encode(), bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key_bytes, data_check_string.encode(), hashlib.sha256).hexdigest()

        if calculated_hash == received_hash:
            try:
                 # Pydantic modeline dönüştür (user vb. JSON parse'ı Pydantic yapar)
                init_data_model = schemas.InitData(**parsed_data, hash=received_hash)
                auth_date = datetime.fromtimestamp(init_data_model.auth_date, tz=timezone.utc)
                # Zaman aşımı kontrolü daha kısa tutulabilir (örn: 5 dakika)
                if datetime.now(tz=timezone.utc) - auth_date > timedelta(minutes=60):
                     print("Validation Error: initData is too old (over 60 minutes)")
                     return None
                return init_data_model
            except ValidationError as e:
                 print(f"Validation Error: Pydantic parsing failed - {e}")
                 return None
        else:
            print("Validation Error: Hash mismatch")
            # Güvenlik için hashleri loglamamak daha iyi olabilir.
            # print(f"Received Hash: {received_hash}")
            # print(f"Calculated Hash: {calculated_hash}")
            # print(f"Data Check String:\n{data_check_string}")
            return None
    except Exception as e:
        print(f"Validation Error: An unexpected error occurred - {e}")
        return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable not set")
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """Dependency to get the current user from JWT token.
       DEVELOPMENT MODE: If token is 'fake-dev-token-123', returns the fallback user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # --- DEVELOPMENT MODE OVERRIDE ---
    if token == "fake-dev-token-123":
        print("--- DEVELOPMENT: Using fallback user --- ")
        user = crud.get_user_by_telegram_id(db, telegram_id=DEV_FALLBACK_TELEGRAM_ID)
        if user is None:
            print(f"--- DEVELOPMENT: Fallback user {DEV_FALLBACK_TELEGRAM_ID} not found, creating... ---")
            # Geliştirme kullanıcısını basitçe oluştur (gerçek user şeması farklı olabilir)
            dev_user_data = schemas.UserCreate(telegram_id=DEV_FALLBACK_TELEGRAM_ID, username="dev_tester")
            user = crud.create_user(db=db, user=dev_user_data)
            if user:
                print(f"--- DEVELOPMENT: Created fallback user {DEV_FALLBACK_TELEGRAM_ID} ---")
            else:
                print(f"--- DEVELOPMENT: Failed to create fallback user {DEV_FALLBACK_TELEGRAM_ID} ---")
                raise HTTPException(status_code=500, detail="Could not create dev fallback user")
        return user
    # --- END DEVELOPMENT MODE OVERRIDE ---

    # Normal Token Validation
    if not SECRET_KEY:
         print("CRITICAL ERROR: SECRET_KEY is not set for JWT validation!")
         raise credentials_exception # Veya 500 Internal Server Error

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        telegram_id_str: Optional[str] = payload.get("sub")
        if telegram_id_str is None:
            raise credentials_exception
        telegram_id = int(telegram_id_str) # Integer'a çevir
        token_data = schemas.TokenData(telegram_id=telegram_id)
    except JWTError:
        print("JWTError during token decode") # Debug
        raise credentials_exception
    except (ValidationError, ValueError):
         print("ValidationError or ValueError during token processing") # Debug
         raise credentials_exception

    user = crud.get_user_by_telegram_id(db, telegram_id=token_data.telegram_id)
    if user is None:
        # Kullanıcı token'da var ama DB'de yoksa (silinmiş olabilir)
        print(f"User with telegram_id {token_data.telegram_id} from token not found in DB") # Debug
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Dependency to check if the user is active (if an 'is_active' field exists)."""
    # if hasattr(current_user, 'is_active') and not current_user.is_active:
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Admin yetkilendirmesi (Örnek: Basit API Key)
from fastapi.security.api_key import APIKeyHeader
API_KEY_NAME = "X-Admin-API-Key"
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY") # .env dosyasından okunacak
api_key_header_auth = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def verify_admin_api_key(api_key: str = Depends(api_key_header_auth)):
    if not ADMIN_API_KEY:
        print("CRITICAL: ADMIN_API_KEY not set in environment variables!")
        raise HTTPException(status_code=500, detail="Admin API Key not configured")
    if not api_key or not hmac.compare_digest(api_key, ADMIN_API_KEY):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing Admin API Key")
    print("Admin authenticated via API Key.")
    return True # Başarılı yetkilendirme 