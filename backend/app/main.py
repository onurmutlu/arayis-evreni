import os
import json
import uuid
import random
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Set, Any
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Arayış Evreni API",
    description="Arayış Evreni oyunu için backend servisleri.",
    version="0.2.0",
)

# Basit Admin API Anahtarı (Environment'tan alınmalı)
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "supersecretkey") 

# Seviye Eşikleri
LEVEL_THRESHOLDS: Dict[int, int] = {
    1: 0,
    2: 100,
    3: 250,
    4: 500,
    5: 1000,
    6: 1750,
    7: 2750,
    8: 4000,
    9: 5500,
    10: 7500
}
MAX_LEVEL = max(LEVEL_THRESHOLDS.keys())

# Görev Zinciri için Bonus
STREAK_THRESHOLD = 3
STREAK_BONUS_XP = 50
STREAK_BONUS_NFT_ID = "nft-mini-bonus-1" # Örnek bonus NFT ID

# Referans Bonusu
REFERRAL_TARGET_LEVEL = 2
REFERRAL_BONUS_STARS = 50

# Görev Cooldown Kontrolü için Zaman Aralığı
MISSION_COMPLETION_WINDOW_HOURS = 1 # Bir görevi tamamladıktan sonra zincir için ne kadar süre geçerli

# --- Veri Yolu ve Veri Yükleme ---
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
MISSIONS_FILE_PATH = os.path.join(DATA_DIR, 'missions.json')
# NFT verisi yolu (frontend'den kopyalanabilir veya ortak bir yerden okunabilir)
NFT_DATA_PATH = os.path.join(DATA_DIR, '..', '..', 'frontend', 'src', 'data', 'nftData.ts') # Geçici yol

# --- Veri Modelleri (Pydantic) ---
class WalletData(BaseModel):
    stars: int
    owned_nft_ids: List[str] = Field(default_factory=list)
    xp: int
    # Yeni: Yıldız işlem geçmişi (opsiyonel)
    star_transaction_history: Optional[List[Dict[str, Any]]] = None

class ProfileData(BaseModel):
    uid: str
    username: str # Basitlik için uid ile aynı varsayalım
    xp: int
    level: int
    stars: int
    mission_streak: int = 0
    referral_code: str
    owned_nft_count: int # Sahip olunan NFT sayısı
    # Başka profil bilgileri eklenebilir

class MissionDefinition(BaseModel):
    """missions.json'daki bir görevin tanımı"""
    id: str
    category: str
    title: str
    description: str
    xp_reward: int
    cooldown_hours: int
    required_nft_category: Optional[str]
    # İleride eklenebilir: required_level: Optional[int]

class MissionState(MissionDefinition):
    """Kullanıcıya gösterilecek görevin durumu"""
    unlocked: bool
    can_complete: bool # Cooldown'da değilse true
    last_completed: Optional[datetime] = None

class CompletedMissionInfo(BaseModel):
    message: str
    xp_earned: int
    streak_bonus_xp: Optional[int] = None
    streak_bonus_nft_earned: Optional[str] = None
    new_level: Optional[int] = None # Seviye atladıysa

class StarTransaction(BaseModel):
    user_id: str
    amount: int
    reason: str
    transaction_type: str # 'earn' veya 'spend'
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AdminStarsRequest(BaseModel):
    user_id: str
    amount: int

# Yeni: Referans İstatistikleri Yanıt Modeli
class ReferralInfoResponse(BaseModel):
    successful_referral_count: int
    total_referral_bonus_earned: int
    referral_code: str # Kullanıcının kendi kodu

class ClaimResult(BaseModel):
    message: str
    new_stars_balance: int

class UnlockVipResult(BaseModel):
    message: str
    new_stars_balance: int

class VipTaskDefinition(BaseModel):
    """VIP Görevinin temel tanımı"""
    id: str
    title: str
    description: str
    unlockCost: int = Field(..., alias='unlock_cost') # JSON/Mock maliyet adı farklıysa

class VipTaskState(VipTaskDefinition):
    """Kullanıcıya gösterilecek VIP görevinin durumu"""
    isLocked: bool

# --- Mock Veritabanı / Veri Yönetimi --- 

# Mock Kullanıcı Verileri (aynı)
mock_user_data: Dict[str, Dict[str, Any]] = {
    "user123": {
        "username": "user123",
        "xp": 150,
        "stars": 250,
        "owned_nft_ids": ["nft-guardian-1", "nft-guardian-5", "nft-flirt-10"],
        "mission_streak": 1,
        "last_mission_completed_at": datetime.utcnow() - timedelta(minutes=30),
        "referral_code": str(uuid.uuid4())[:8], 
        "referred_by_code": None,
        "mission_completions": { 
            "general_share_1": datetime.utcnow() - timedelta(hours=15)
        },
        "star_transactions": [
             {"amount": 50, "reason": "initial_grant", "transaction_type": "earn", "timestamp": datetime.utcnow() - timedelta(days=1)},
             {"amount": 200, "reason": "task_reward_placeholder", "transaction_type": "earn", "timestamp": datetime.utcnow() - timedelta(hours=2)}
        ],
        "unlocked_vip_task_ids": set() # Başlangıçta boş set
    },
    "dev_tester": {
        "username": "dev_tester",
        "xp": 500,
        "stars": 500,
        "owned_nft_ids": ["nft-flirt-2", "nft-dao-3", "nft-city-4", "nft-dao-7", "nft-flirt-14", "nft-dao-11", "nft-city-16", "nft-dao-15"],
        "mission_streak": 0,
        "last_mission_completed_at": None,
        "referral_code": str(uuid.uuid4())[:8],
        "referred_by_code": None,
        "mission_completions": {},
        "star_transactions": [],
        "unlocked_vip_task_ids": {"vip-g1"} # Bu görevi açmış
    },
    "newbie": {
        "username": "newbie",
        "xp": 0,
        "stars": 0,
        "owned_nft_ids": [],
        "mission_streak": 0,
        "last_mission_completed_at": None,
        "referral_code": str(uuid.uuid4())[:8],
        "referred_by_code": None,
        "mission_completions": {},
        "star_transactions": [],
        "unlocked_vip_task_ids": set()
    },
}

# Görev Havuzunu JSON'dan yükle
all_missions_pool: List[MissionDefinition] = []
try:
    with open(MISSIONS_FILE_PATH, 'r') as f:
        missions_raw = json.load(f)
        all_missions_pool = [MissionDefinition(**m) for m in missions_raw]
except FileNotFoundError:
    print(f"ERROR: Mission definition file not found at {MISSIONS_FILE_PATH}")
except json.JSONDecodeError:
    print(f"ERROR: Could not decode JSON from {MISSIONS_FILE_PATH}")
except Exception as e:
    print(f"ERROR: Failed to load missions: {e}")

# Yeni: NFT Maliyetlerini Yükle (nftData.ts'den basitleştirilmiş)
# Gerçek uygulamada bu DB'den veya ortak bir kaynaktan gelmeli
nft_costs: Dict[str, int] = {
  # Kategori bazlı maliyetler (nftData.ts ile aynı olmalı)
  'guardian': 100,
  'flirt': 60,
  'dao': 250, 
  'city': 75
}
# Tüm NFT ID'leri ve maliyetleri için bir map oluştur (veya ID'den kategoriyi çıkar)
# Basitlik için ID'den kategori çıkarımını kullanacağız
def get_nft_claim_cost(nft_id: str) -> Optional[int]:
    parts = nft_id.split('-')
    if len(parts) == 3:
        category = parts[1]
        return nft_costs.get(category)
    return None

# VIP Görev Tanımları (Maliyetleri de içerecek şekilde)
# VIP Görev Maliyetleri (Mock)
vip_tasks_definitions: Dict[str, VipTaskDefinition] = {
    "vip-g1": VipTaskDefinition(id="vip-g1", title="Altın Dokunuş", description="Profiline özel bir altın çerçeve ekle.", unlock_cost=500),
    "vip-g2": VipTaskDefinition(id="vip-g2", title="Özel Erişim: DAO Liderleri", description="DAO liderleriyle özel sohbet kanalına erişim kazan.", unlock_cost=1000),
    "vip-g3": VipTaskDefinition(id="vip-g3", title="XP Takviyesi", description="Bir sonraki 5 görevden %50 daha fazla XP kazan.", unlock_cost=750),
    "vip-g4": VipTaskDefinition(id="vip-g4", title="Efsanevi NFT İpucu", description="Bir sonraki Efsanevi NFT'nin nerede bulunabileceğine dair bir ipucu al.", unlock_cost=1200)
}
# Eski vip_task_costs kaldırıldı, bilgiler VipTaskDefinition içinde
# mock_user_unlocked_vip kaldırıldı, bilgiler mock_user_data içinde

# --- Yardımcı Fonksiyonlar (aynı) ---

def get_user_or_404(uid: str) -> Dict[str, Any]:
    user = mock_user_data.get(uid)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID '{uid}' not found")
    return user

def calculate_level(xp: int) -> int:
    current_level = 1
    for level, threshold in sorted(LEVEL_THRESHOLDS.items(), key=lambda item: item[1]):
        if xp >= threshold:
            current_level = level
        else:
            break
    return current_level

def get_categories_from_ids(nft_ids: List[str]) -> Set[str]:
    """Verilen NFT ID listesinden sahip olunan kategorileri çıkarır."""
    categories: Set[str] = set()
    for nft_id in nft_ids:
        parts = nft_id.split('-') # örn: ['nft', 'guardian', '1']
        if len(parts) == 3:
            category = parts[1]
            # Bilinen kategorilerden biri mi diye kontrol edilebilir
            valid_categories = {'guardian', 'flirt', 'dao', 'city'}
            if category in valid_categories:
                 categories.add(category)
    return categories

def log_star_transaction(user_id: str, amount: int, reason: str, type: str):
    # Mock veri için basit loglama
    user = get_user_or_404(user_id)
    transaction = {
        "amount": amount,
        "reason": reason,
        "transaction_type": type,
        "timestamp": datetime.utcnow()
    }
    if "star_transactions" not in user:
        user["star_transactions"] = []
    user["star_transactions"].append(transaction)
    # Gerçek DB'de INSERT işlemi yapılır
    print(f"Logged transaction for {user_id}: {amount} stars, reason: {reason}, type: {type}")

# --- Yetkilendirme (Basit) ---
async def verify_admin_key(x_admin_api_key: str = Header(...)):
    if x_admin_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid Admin API Key")

# --- API Endpointleri ---

@app.get("/profile/{uid}", response_model=ProfileData, tags=["User Profile"])
async def get_user_profile(uid: str):
    """
    Kullanıcının profil bilgilerini döndürür (seviye, XP, yıldız, referans kodu vb.).
    """
    user = get_user_or_404(uid)
    level = calculate_level(user["xp"])
    profile = ProfileData(
        uid=uid,
        username=user["username"],
        xp=user["xp"],
        level=level,
        stars=user["stars"],
        mission_streak=user.get("mission_streak", 0),
        referral_code=user["referral_code"],
        owned_nft_count=len(user.get("owned_nft_ids", [])),
    )
    return profile

@app.get("/wallet/{uid}", response_model=WalletData, tags=["User Wallet"])
async def get_user_wallet(uid: str, include_history: bool = False, history_limit: int = 10):
    """
    Belirtilen Kullanıcı ID'sine ait cüzdan bilgilerini döndürür.
    Opsiyonel olarak son yıldız işlem geçmişini içerir.

    - **uid**: Cüzdan bilgisi alınacak kullanıcının unique ID'si.
    - **include_history**: Yıldız işlem geçmişini yanıta ekler (default: false).
    - **history_limit**: Döndürülecek maksimum işlem sayısı (default: 10).
    """
    user = get_user_or_404(uid)
    wallet_data = WalletData(
        stars=user["stars"],
        owned_nft_ids=user.get("owned_nft_ids", []),
        xp=user["xp"],
    )
    if include_history:
        history = user.get("star_transactions", [])
        # Tarihe göre sıralı ve limitli olarak döndür
        wallet_data.star_transaction_history = sorted(
            history, key=lambda t: t['timestamp'], reverse=True
        )[:history_limit]
        
    return wallet_data

# Güncellenmiş Endpoint: Cooldown ve state bilgisi içerir
@app.get("/missions/{uid}", response_model=List[MissionState], tags=["Missions"])
async def get_all_missions_for_user(uid: str):
    """
    Belirtilen kullanıcı için TÜM görevleri ve durumlarını döndürür.
    (unlocked, can_complete, last_completed)
    """
    user = get_user_or_404(uid)
    wallet = WalletData(**user) # Use user data directly
    owned_nft_ids = wallet.owned_nft_ids
    owned_categories = get_categories_from_ids(owned_nft_ids)
    user_completions = user.get("mission_completions", {}) # {mission_id: completed_at}

    all_missions_with_status: List[MissionState] = []
    now = datetime.utcnow()

    for mission_def in all_missions_pool:
        required_category = mission_def.required_nft_category
        is_unlocked = False
        can_complete = False
        last_completed_dt = user_completions.get(mission_def.id)

        # 1. Kilidi açık mı?
        if required_category is None or required_category in owned_categories:
            is_unlocked = True
        
        # 2. Cooldown süresi doldu mu?
        if is_unlocked:
            if last_completed_dt is None:
                can_complete = True
            else:
                cooldown_delta = timedelta(hours=mission_def.cooldown_hours)
                if now >= last_completed_dt + cooldown_delta:
                    can_complete = True
        
        all_missions_with_status.append(
            MissionState(
                **mission_def.dict(), 
                unlocked=is_unlocked,
                can_complete=can_complete,
                last_completed=last_completed_dt
            )
        )

    return all_missions_with_status

@app.post("/complete_mission/{uid}/{mission_id}", response_model=CompletedMissionInfo, tags=["Missions"])
async def complete_mission_for_user(uid: str, mission_id: str):
    """
    Kullanıcının belirli bir görevi tamamlamasını işler.
    XP verir, zinciri kontrol eder, seviye ve referans bonuslarını uygular.
    """
    user = get_user_or_404(uid)
    now = datetime.utcnow()

    # Görev tanımını bul
    mission_def = next((m for m in all_missions_pool if m.id == mission_id), None)
    if not mission_def:
        raise HTTPException(status_code=404, detail=f"Mission with ID '{mission_id}' not found")

    # Görevin mevcut durumunu kontrol et (unlocked ve can_complete olmalı)
    owned_categories = get_categories_from_ids(user.get("owned_nft_ids", []))
    user_completions = user.get("mission_completions", {})
    last_completed_dt = user_completions.get(mission_id)
    
    required_category = mission_def.required_nft_category
    is_unlocked = required_category is None or required_category in owned_categories
    
    can_complete = False
    if is_unlocked:
        if last_completed_dt is None or now >= last_completed_dt + timedelta(hours=mission_def.cooldown_hours):
            can_complete = True

    if not is_unlocked:
         raise HTTPException(status_code=403, detail="Mission is locked for this user")
    if not can_complete:
         raise HTTPException(status_code=400, detail="Mission is still in cooldown")

    # --- Başarılı Tamamlama İşlemleri ---
    
    initial_level = calculate_level(user["xp"])
    xp_earned = mission_def.xp_reward
    bonus_xp = 0
    bonus_nft = None

    # 1. Görev Tamamlamayı Kaydet
    user["mission_completions"][mission_id] = now
    user["last_mission_completed_at"] = now

    # 2. Görev Zincirini Kontrol Et ve Güncelle
    last_completed_prev = user.get("last_mission_completed_at")
    current_streak = user.get("mission_streak", 0)
    
    # Zincir kontrolü: Eğer bir önceki görev belirli bir süre içinde tamamlandıysa
    if last_completed_prev and (now - last_completed_prev <= timedelta(hours=MISSION_COMPLETION_WINDOW_HOURS)):
        current_streak += 1
    else:
        current_streak = 1 # Zincir kırıldı veya ilk görev
    
    user["mission_streak"] = current_streak

    if current_streak >= STREAK_THRESHOLD:
        bonus_xp = STREAK_BONUS_XP
        bonus_nft = STREAK_BONUS_NFT_ID
        # Bonusu ver ve zinciri sıfırla
        user["mission_streak"] = 0 
        if bonus_nft not in user.get("owned_nft_ids", []):
            user.setdefault("owned_nft_ids", []).append(bonus_nft)
        print(f"User {uid} completed streak! Awarding {bonus_xp} XP and NFT {bonus_nft}")
        log_star_transaction(uid, 0, f"streak_bonus_nft_{bonus_nft}", "earn") # NFT için 0 yıldızlık log

    # 3. XP'yi Güncelle
    total_xp_gain = xp_earned + bonus_xp
    user["xp"] += total_xp_gain
    log_star_transaction(uid, total_xp_gain, f"mission_complete_{mission_id}", "earn") # XP'yi de loglayalım (amount=XP)

    # 4. Seviye Atlama Kontrolü
    final_level = calculate_level(user["xp"])
    new_level_achieved = final_level if final_level > initial_level else None
    if new_level_achieved:
        print(f"User {uid} leveled up to level {final_level}!")
        # Seviye atlama logu veya ödülü burada verilebilir

    # 5. Referans Bonusu Kontrolü
    referred_by = user.get("referred_by_code")
    if referred_by and final_level >= REFERRAL_TARGET_LEVEL:
        # Referans vereni bul (mock data için basit arama)
        referrer_uid = None
        for r_uid, r_data in mock_user_data.items():
            if r_data.get("referral_code") == referred_by:
                referrer_uid = r_uid
                break
        
        if referrer_uid:
            # TODO: Gerçek DB'de `referrals` tablosu kontrol edilmeli (rewarded_at)
            # Şimdilik basitçe ödülü verelim
            referrer_user = get_user_or_404(referrer_uid)
            referrer_user["stars"] += REFERRAL_BONUS_STARS
            log_star_transaction(referrer_uid, REFERRAL_BONUS_STARS, f"referral_bonus_from_{uid}", "earn")
            print(f"Awarded {REFERRAL_BONUS_STARS} stars to referrer {referrer_uid} for {uid} reaching level {REFERRAL_TARGET_LEVEL}")
            # Ödül verildiğini işaretlemek için referred_by_code'u silebilir veya başka bir mekanizma kullanabiliriz
            user["referred_by_code"] = None # Tek seferlik ödül için

    # Yanıtı oluştur
    completion_info = CompletedMissionInfo(
        message=f"'{mission_def.title}' görevi tamamlandı!",
        xp_earned=xp_earned,
        streak_bonus_xp=bonus_xp if bonus_xp > 0 else None,
        streak_bonus_nft_earned=bonus_nft,
        new_level=new_level_achieved
    )
    return completion_info

@app.post("/admin/stars/add", tags=["Admin"], dependencies=[Depends(verify_admin_key)])
async def add_stars_admin(request: AdminStarsRequest):
    """
    Admin tarafından belirli bir kullanıcıya yıldız ekler.
    Yetkilendirme için 'X-Admin-Api-Key' header'ı gereklidir.
    """
    user = get_user_or_404(request.user_id)
    
    if request.amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero")

    user["stars"] += request.amount
    log_star_transaction(
        request.user_id, 
        request.amount, 
        "admin_grant", 
        "earn" if request.amount > 0 else "spend" # Negatif miktar da olabilir
    )
    
    return {"message": f"Successfully added {request.amount} stars to user {request.user_id}. New balance: {user['stars']}"}

# Yeni: Referans İstatistikleri Endpoint'i
@app.get("/referral_info/{uid}", response_model=ReferralInfoResponse, tags=["User Profile"])
async def get_referral_info(uid: str):
    """
    Kullanıcının referans programı istatistiklerini döndürür.
    """
    user = get_user_or_404(uid)
    user_referral_code = user.get("referral_code")
    
    successful_referrals = 0
    total_bonus = 0

    # Mock veri üzerinde basit sayım:
    # Kimlerin user tarafından referans edildiğini bul
    for referred_user_id, referred_user_data in mock_user_data.items():
        if referred_user_data.get("referred_by_code") == user_referral_code:
            # Bu kullanıcı user tarafından referans edilmiş.
            # Seviye 2'ye ulaşıp ulaşmadığını ve ödülün verilip verilmediğini kontrol et.
            # Mock yapıda, eğer referred_by_code hala duruyorsa ödül verilmemiş varsayalım
            # (complete_mission içinde None yapıyoruz)
            # Veya daha iyisi: Seviyesini kontrol edelim.
            referred_level = calculate_level(referred_user_data.get("xp", 0))
            if referred_level >= REFERRAL_TARGET_LEVEL:
                 # Başarılı referans sayılır (ödül verilmiş olsa bile)
                 successful_referrals += 1
                 # Ödülün verilip verilmediğini transaction log'dan kontrol etmek daha doğru olurdu
                 # Şimdilik basitçe, başarılı her referans için bonusu topluyoruz
                 total_bonus += REFERRAL_BONUS_STARS 
                 # NOT: Bu mock hesaplama, ödülün birden fazla kez sayılmasına neden olabilir.
                 # Gerçek DB'de 'referrals' tablosundan 'rewarded_at' kontrolü yapılmalı.

    return ReferralInfoResponse(
        successful_referral_count=successful_referrals,
        total_referral_bonus_earned=total_bonus, 
        referral_code=user_referral_code
    )

# Yeni: NFT Claim Endpoint'i
@app.post("/claim_nft/{uid}/{nft_id}", response_model=ClaimResult, tags=["NFTs"])
async def claim_nft_for_user(uid: str, nft_id: str):
    """
    Kullanıcının belirtilen NFT'yi Yıldız kullanarak claim etmesini sağlar.
    """
    user = get_user_or_404(uid)
    
    # NFT maliyetini al
    cost = get_nft_claim_cost(nft_id)
    if cost is None:
        raise HTTPException(status_code=404, detail=f"NFT with ID '{nft_id}' or its cost not found")

    # Kullanıcı zaten sahip mi?
    if nft_id in user.get("owned_nft_ids", []):
        raise HTTPException(status_code=400, detail="User already owns this NFT")

    # Yeterli yıldız var mı?
    if user["stars"] < cost:
        raise HTTPException(status_code=400, detail=f"Insufficient stars. Requires {cost}, has {user['stars']}")

    # İşlemi gerçekleştir
    user["stars"] -= cost
    user.setdefault("owned_nft_ids", []).append(nft_id)
    log_star_transaction(uid, -cost, f"nft_claim_{nft_id}", "spend")

    return ClaimResult(
        message=f"NFT '{nft_id}' successfully claimed!",
        new_stars_balance=user["stars"]
    )

# Yeni: Kullanıcı için VIP Görevlerini Döndür
@app.get("/vip_tasks/{uid}", response_model=List[VipTaskState], tags=["VIP"])
async def get_vip_tasks_for_user(uid: str):
    """
    Kullanıcı için tüm VIP görevlerini ve kilit durumlarını döndürür.
    """
    user = get_user_or_404(uid)
    unlocked_ids = user.get("unlocked_vip_task_ids", set())
    
    tasks_with_state: List[VipTaskState] = []
    for task_id, task_def in vip_tasks_definitions.items():
        is_locked = task_id not in unlocked_ids
        tasks_with_state.append(
            VipTaskState(**task_def.dict(), isLocked=is_locked)
        )
    return tasks_with_state

# Güncellendi: VIP Görev Kilidi Açma Endpoint'i (State'i günceller)
@app.post("/unlock_vip_task/{uid}/{task_id}", response_model=UnlockVipResult, tags=["VIP"])
async def unlock_vip_task_for_user(uid: str, task_id: str):
    """
    Kullanıcının belirtilen VIP görevinin kilidini Yıldız kullanarak açmasını sağlar.
    Açılan görevin durumunu backend'de günceller.
    """
    user = get_user_or_404(uid)
    
    # VIP görev tanımını ve maliyetini al
    task_def = vip_tasks_definitions.get(task_id)
    if not task_def:
         raise HTTPException(status_code=404, detail=f"VIP task with ID '{task_id}' not found")
    cost = task_def.unlockCost

    # Kullanıcı zaten açmış mı?
    if task_id in user.get("unlocked_vip_task_ids", set()):
         raise HTTPException(status_code=400, detail="VIP task already unlocked")

    # Yeterli yıldız var mı?
    if user["stars"] < cost:
        raise HTTPException(status_code=400, detail=f"Insufficient stars. Requires {cost}, has {user['stars']}")

    # İşlemi gerçekleştir
    user["stars"] -= cost
    # Açılan görevi kullanıcının set'ine ekle
    user.setdefault("unlocked_vip_task_ids", set()).add(task_id)
    log_star_transaction(uid, -cost, f"vip_unlock_{task_id}", "spend")

    return UnlockVipResult(
        message=f"VIP task '{task_def.title}' successfully unlocked!", # Başlık eklendi
        new_stars_balance=user["stars"]
    )

# --- Kök ve CORS (Dosyanın sonunda kalmalı) --- 

# İsteğe bağlı: Kök endpoint
@app.get("/", tags=["General"], include_in_schema=False) # Dokümantasyonda gizle
async def read_root():
    return {"message": "Arayış Evreni API'sine hoş geldiniz! /docs adresinden dokümantasyona ulaşabilirsiniz."}


# --- CORS Ayarları (Frontend'den istekler için genellikle gereklidir) ---
origins = [
    "http://localhost:3000",  # React uygulamasının çalıştığı adres (varsayılan)
    "http://127.0.0.1:3000",
    # Gerekirse diğer frontend adresleri
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # İzin verilen kaynaklar
    allow_credentials=True,
    allow_methods=["*"], # İzin verilen HTTP metodları (GET, POST, vb.)
    allow_headers=["*"], # İzin verilen HTTP başlıkları
)

# Not: Eğer backend klasör yapınız farklıysa (örn. app/main.py yerine direkt backend/main.py),
# importlar ve çalıştırma komutu buna göre ayarlanmalıdır.

# Örnek Çalıştırma Komutu (backend klasöründe):
# cd backend
# uvicorn app.main:app --reload 