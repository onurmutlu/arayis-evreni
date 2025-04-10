# Arayış Evreni

Telegram Mini App platformu için TON ekosistemi ile entegre, NFT ve sosyal özellikleri içeren bir uygulama.

## Özellikler

- NFT Koleksiyonu ve Galeri
- TON Cüzdanı Entegrasyonu
- Görevler ve Ödüller
- Topluluk ve Sosyal Özellikler
- Kullanıcı Profilleri ve Davet Sistemi
- Stars (sanal para) ekonomisi

## Kurulum

### Frontend (Vercel)

```bash
# Bağımlılıkları yükle
cd frontend
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Dağıtım için build al
npm run build
```

Frontend `.env` ve `.env.production` dosyalarında yapılandırma seçenekleri yer alır.

### Backend (EC2)

```bash
# Bağımlılıkları yükle
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Veritabanı migrasyonlarını uygula
alembic upgrade head

# Sunucuyu başlat
python main.py
```

Production için `start_server.sh` betiğini kullanabilirsiniz.

### EC2 Deployment

EC2 instance'ına kopyalayın ve başlatın:

```bash
# EC2'de
git clone https://github.com/username/arayis-evreni.git
cd arayis-evreni/backend

# Sanal ortam oluştur
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# .env dosyasını oluştur (örnek .env dosyasını düzenle)
cp .env.example .env
nano .env

# Log dizinini oluştur
mkdir -p ../logs

# Çalıştırma iznini ver
chmod +x start_server.sh

# Sunucuyu başlat
./start_server.sh
```

## Yapı

### Frontend

- `/src/pages` - Ana sayfalar
- `/src/components` - Paylaşılan bileşenler
- `/src/context` - React context'leri
- `/src/utils` - Yardımcı fonksiyonlar
- `/src/types` - TypeScript türleri

### Backend

- `/routers` - API rotaları
- `/models.py` - Veritabanı modelleri
- `/schemas.py` - Pydantic şemaları
- `/auth.py` - Kimlik doğrulama

## Telegram WebApp Entegrasyonu

Uygulama Telegram MiniApp platformuna entegre şekilde çalışır. Geliştirme ortamında Telegram WebApp API'si taklit edilerek test edilebilir.

## Lisans

Tüm hakları saklıdır. Bu projeyi izinsiz paylaşmak, kopyalamak veya dağıtmak yasaktır.
