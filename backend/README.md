# 🚀 Arayış Evreni Backend

Arayış Evreni uygulamasının backend kısmı FastAPI framework'ü kullanılarak geliştirilmiştir. Bu dökümantasyon, backend'in kurulumu, yapısı ve kullanımı hakkında bilgiler içerir.

## 📋 Kurulum

### Ön Koşullar
- Python 3.9 veya üzeri
- pip (Python paket yöneticisi)
- SQLite (veya PostgreSQL için ek yapılandırma)

### Geliştirme Ortamı Kurulumu

```bash
# Sanal ortam oluşturma
python -m venv venv

# Sanal ortamı aktifleştirme
# Windows için:
venv\Scripts\activate
# Unix/MacOS için:
source venv/bin/activate

# Bağımlılıkları yükleme
pip install -r requirements.txt

# Ortam değişkenlerini yapılandırma
cp .env.example .env.development
# .env.development dosyasını düzenleyin

# Veritabanı migrasyon işlemleri
alembic upgrade head

# Geliştirme sunucusunu başlatma
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🏗️ Proje Yapısı

```
backend/
├── alembic/             # Veritabanı migrasyon sistemi
├── crud/                # CRUD işlemleri için modüler yapı
├── data/                # Statik veri ve metadata dosyaları
│   └── nft_metadata/    # NFT metadata JSON dosyaları
├── routers/             # API route'ları
│   ├── admin.py         # Admin işlemleri
│   ├── dao.py           # DAO işlemleri
│   ├── leaderboard.py   # Liderlik tablosu
│   ├── missions.py      # Görev işlemleri
│   ├── nft.py           # NFT metadata API
│   ├── nfts.py          # NFT CRUD işlemleri
│   ├── users.py         # Kullanıcı işlemleri
│   └── vip.py           # VIP işlemleri
├── models.py            # SQLAlchemy ORM modelleri
├── schemas.py           # Pydantic şemaları
├── crud.py              # Temel CRUD işlemleri
├── auth.py              # Kimlik doğrulama
├── database.py          # Veritabanı bağlantısı
├── main.py              # Ana uygulama giriş noktası
└── requirements.txt     # Bağımlılıklar
```

## 🔑 API Endpoints

API'nin tam dokümantasyonu için, uygulamayı çalıştırdıktan sonra `/docs` veya `/redoc` adreslerine gidebilirsiniz.

### 👤 Kullanıcı İşlemleri
- `POST /api/token` - Telegram WebApp verisi ile token alma
- `GET /profile/{uid}` - Kullanıcı profilini görüntüleme
- `GET /wallet/{uid}` - Kullanıcı cüzdanını görüntüleme

### 📝 Görev İşlemleri
- `GET /missions/{uid}` - Kullanıcının görevlerini listeleme
- `POST /api/missions/gorev-tamamla` - Görev tamamlama

### 🖼️ NFT İşlemleri
- `GET /nfts/` - Tüm NFT'leri listeleme
- `GET /nfts/{nft_id}` - Belirli bir NFT'yi görüntüleme
- `GET /nft/list` - Tüm NFT metadatalarını listeleme
- `GET /nft/{id}` - Belirli bir NFT'nin metadatasını görüntüleme
- `POST /nfts/buy` - NFT satın alma
- `POST /nfts/mint` - NFT mint etme

### 🏆 Liderlik Tablosu
- `GET /api/leaderboard/{category}` - Kategori bazlı liderlik tablosu

### 👑 VIP İşlemleri
- `GET /api/vip/status/{uid}` - VIP durumunu kontrol etme
- `POST /api/vip/purchase` - VIP satın alma

### 🔧 Admin İşlemleri
- `POST /api/admin/stars/add` - Kullanıcıya stars ekleme
- `POST /api/admin/nft/distribute` - Kullanıcıya NFT dağıtma

## 🔒 Güvenlik

API'nin güvenliği JWT (JSON Web Tokens) ile sağlanmaktadır. Telegram WebApp verileri doğrulanarak kullanıcı kimliği tespit edilir ve token oluşturulur.

### Token Alma
```python
# Token alma örneği
import requests

response = requests.post(
    "http://localhost:8000/api/token",
    json={"initData": "TELEGRAM_WEB_APP_INIT_DATA"}
)
token = response.json().get("access_token")
```

### API İstekleri
```python
# Token ile API isteği örneği
import requests

headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    "http://localhost:8000/profile/USER_ID",
    headers=headers
)
```

## 🧪 Test

```bash
# Test çalıştırma (henüz test yoktur)
pytest
```

## 📚 Bağımlılıklar

Ana bağımlılıklar:
- FastAPI: Modern, hızlı web framework
- SQLAlchemy: ORM (Object Relational Mapping)
- Pydantic: Veri doğrulama
- Alembic: Veritabanı migrasyon
- Python-jose: JWT oluşturma/doğrulama

Daha detaylı liste için `requirements.txt` dosyasına bakın.

## 🔄 Geliştirme İş Akışı

1. Feature branch oluşturun: `git checkout -b feature/yeni-ozellik`
2. Değişikliklerinizi yapın ve commit edin
3. Push yapın: `git push origin feature/yeni-ozellik`
4. Pull Request oluşturun
5. Code review sonrası merge edin

## 🚀 Dağıtım

```bash
# Üretim ortamı için
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Alternatif olarak Gunicorn ile (daha performanslı)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

## 📝 Notlar ve Bilinen Sorunlar

- NFT API'si iki ayrı modül olarak yapılandırılmıştır: `nft.py` (metadata) ve `nfts.py` (CRUD). Bu durumun gelecekte birleştirilmesi planlanmaktadır.
- Şu anda veritabanı olarak SQLite kullanılmaktadır. Üretim ortamında PostgreSQL'e geçiş yapılması önerilir.
- Loglama stratejisi geliştirilmektedir. 