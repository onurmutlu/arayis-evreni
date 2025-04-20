# 🌌 Arayış Evreni

Arayış Evreni, Telegram Mini App platformu üzerinde çalışan, Web3 teknolojileri ile güçlendirilmiş, görev tabanlı bir sosyal etkileşim ve dijital varlık ekosistemidir. Kullanıcılar, çeşitli görevleri tamamlayarak XP ve Stars kazanır, seviye atlar, NFT'ler toplar ve canlı bir toplulukla etkileşime girerler.

![Arayış Evreni](https://via.placeholder.com/1200x630?text=Arayış+Evreni+Ekosistemi)

## 💫 Vizyon

Arayış Evreni, kripto teknolojilerini ve dijital varlık ekonomisini sıradan kullanıcılar için erişilebilir kılmayı hedefleyen, eğlence ile faydalı bilgiyi harmanlayan bir platforma dönüşmeyi amaçlamaktadır. Misyonumuz, kullanıcıların dijital kimliklerini oluşturmalarına, değerli varlıklar biriktirmelerine ve topluluk tarafından yönetilen bir ekosisteme aktif olarak katılmalarına olanak tanımaktır.

## 🌟 Temel Özellikler

### 🎮 Görev Evreni
- **Kategori Bazlı Görevler**: Flört, DAO, Muhafız, Şehir ve Genel kategorilerinde interaktif görevler
- **XP ve Seviye Sistemi**: Görevleri tamamlayarak deneyim kazanma ve seviye atlama
- **Zaman Bazlı Yenilenmeler**: Periyodik olarak tamamlanabilen görevler ve cooldown mekanizması
- **VIP Görevler**: Premium kullanıcılara özel, daha yüksek ödüllü görevler

### 💎 NFT Galerisi ve Koleksiyon
- **Zengin NFT Koleksiyonu**: Farklı kategorilerde benzersiz dijital varlıklar
- **TON Blockchain Entegrasyonu**: NFT'leri blockchain üzerinde mint etme
- **Koleksiyon İlerleme Sistemi**: Tamamlanan koleksiyonlar için özel ödüller
- **NFT Kullanım Senaryoları**: Görevlerde avantaj, özel içerik erişimi ve daha fazlası

### 💰 Ekonomi Sistemi
- **Stars Sanal Para Birimi**: Uygulama içi ekonominin temeli
- **TON Cüzdan Entegrasyonu**: Kripto varlıklarınızı yönetme
- **Ödül Dağıtım Mekanizması**: Dengeli ve sürdürülebilir bir ekonomi
- **Premium Üyelik Avantajları**: VIP kullanıcılar için özel ekonomik ayrıcalıklar

### 👥 Topluluk ve Sosyal
- **Kullanıcı Profilleri**: Kişiselleştirilebilir profiller ve seviye gösterimi
- **Davet Sistemi**: Arkadaşlarınızı davet ederek bonus kazanma
- **DAO Yönetişimi**: Topluluk önerilerinin oylanması ve kararların birlikte alınması
- **Liderlik Tabloları**: En aktif kullanıcıların sıralandığı rekabetçi tablolar

### 📊 Analitik ve Yönetim
- **Büyüme Analitikleri**: Topluluk metrikleri ve ilerleme takibi
- **Admin Paneli**: Yöneticiler için kapsamlı kontrol arayüzü
- **Bildirim Sistemi**: Önemli etkinlikler ve güncellemeler için bildirimler

## 🚀 Kurulum ve Geliştirme

### 📋 Ön Koşullar
- Node.js (v18+)
- Python (v3.9+)
- pip ve npm

### 🔧 Geliştirme Ortamı Kurulumu

#### Frontend (React + TypeScript + Vite)

```bash
# Projeyi klonla
git clone https://github.com/username/arayis-evreni.git
cd arayis-evreni/frontend

# Bağımlılıkları yükle
npm install

# Geliştirme ortamı değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle - Telegram test parametrelerini ayarla

# Geliştirme sunucusunu başlat
npm run dev

# Dağıtım için build al
npm run build
```

#### Backend (Python + FastAPI)

```bash
# Backend dizinine git
cd ../backend

# Sanal ortam oluştur ve aktive et
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# Geliştirme ortamı değişkenlerini ayarla
cp .env.example .env.development
# .env.development dosyasını düzenle

# Veritabanı migrasyonlarını uygula
alembic upgrade head

# Geliştirme sunucusunu başlat
python main.py
```

### 🏗️ Dağıtım

#### Frontend (Vercel)

```bash
# Vercel CLI'yi yükle
npm i -g vercel

# Deploy işlemini başlat
vercel login
vercel
```

#### Backend (AWS EC2)

```bash
# EC2 sunucuya SSH ile bağlan
ssh -i your-key.pem ec2-user@your-instance-ip

# Projeyi sunucuya klonla
git clone https://github.com/username/arayis-evreni.git
cd arayis-evreni/backend

# Sanal ortam ve bağımlılıkları kur
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Ortam değişkenlerini ayarla
cp .env.example .env.production
nano .env.production  # Üretim ortamı değişkenlerini düzenle

# Log dizinini oluştur
mkdir -p ../logs

# Başlatma scriptine çalıştırma izni ver
chmod +x start_server.sh

# Systemd servis dosyasını oluştur
sudo nano /etc/systemd/system/arayis-evreni.service

# Systemd servisini aktifleştir ve başlat
sudo systemctl enable arayis-evreni
sudo systemctl start arayis-evreni
```

## 📚 Proje Mimarisi

### Frontend (React + TypeScript + Vite)

```
frontend/
├── public/              # Statik dosyalar ve varlıklar
├── src/
│   ├── components/      # Yeniden kullanılabilir UI bileşenleri
│   │   ├── NFTKarti.tsx # NFT kart bileşeni
│   │   ├── GorevKarti.tsx # Görev kart bileşeni
│   │   └── ...          # Diğer bileşenler
│   ├── contexts/        # React context tanımları
│   │   ├── TelegramContext.tsx # Telegram WebApp entegrasyonu
│   │   └── ...          # Diğer context'ler
│   ├── pages/           # Sayfa bileşenleri
│   │   ├── Gorevler.tsx # Görevler sayfası
│   │   ├── Galeri.tsx   # NFT galerisi
│   │   └── ...          # Diğer sayfalar
│   ├── utils/           # Yardımcı fonksiyonlar
│   │   ├── api.ts       # API istek fonksiyonları
│   │   └── ...          # Diğer yardımcılar
│   ├── types/           # TypeScript tip tanımları
│   ├── App.tsx          # Ana uygulama bileşeni
│   └── main.tsx         # Uygulama giriş noktası
├── vite.config.ts       # Vite yapılandırması
└── tsconfig.json        # TypeScript yapılandırması
```

### Backend (Python + FastAPI)

```
backend/
├── alembic/             # Veritabanı migrasyon sistemi
├── app/                 # Ana uygulama modülü
├── routers/             # API rotaları ve endpoint'ler
│   ├── missions.py      # Görev endpoint'leri
│   ├── nfts.py          # NFT endpoint'leri
│   └── ...              # Diğer rotalar
├── models.py            # SQLAlchemy ORM modelleri
├── schemas.py           # Pydantic şemaları ve validasyonları
├── crud.py              # Veritabanı CRUD işlemleri
├── auth.py              # Kimlik doğrulama ve güvenlik
├── database.py          # Veritabanı bağlantı yönetimi
├── main.py              # Uygulama giriş noktası
└── requirements.txt     # Python bağımlılıkları
```

### Blockchain (TON Network)

```
blockchain/
├── contracts/            # Akıllı kontratlar
│   ├── jetton/           # AJX token kontratları
│   │   ├── minter.fc     # Jetton Minter
│   │   └── wallet.fc     # Jetton Wallet
│   ├── nft/              # NFT kontratları
│   │   ├── collection.fc # NFT Koleksiyon
│   │   └── item.fc       # NFT Item
│   └── dao/              # DAO yönetişim kontratları
├── scripts/              # Deployment ve etkileşim scriptleri
│   ├── deploy_jetton.py  # AJX token deployment
│   ├── deploy_nft.py     # NFT koleksiyon deployment
│   └── deploy_dao.py     # DAO kontrat deployment
└── tests/                # Kontrat test dosyaları
```

## 🧩 Entegrasyonlar

### 🚀 Telegram Mini App
Uygulama, Telegram Mini App platformu üzerinde çalışır ve Telegram'ın WebApp API'sini kullanır:

- Bot Komutları: `/start`, `/help`, `/profile`
- Inline Modu: Arkadaşlarına NFT'lerini gösterme
- Uygulama İçi Bildirimler: Görev tamamlama, ödül kazanma

### ⛓️ TON Blockchain
Uygulama, TON (The Open Network) blockchain'i ile entegre çalışır:

- **NFT Mint İşlemleri**: TON üzerinde NFT oluşturma ve koleksiyon yönetimi
- **Cüzdan Entegrasyonu**: TON Transfer, NFT ve Jetton varlıklarını yönetme
- **Akıllı Kontratlar**: NFT marketplace, Jetton ve değer transferi
- **AJAN X (AJX) Jetton**: Topluluk token'ı ve ekonomi sistemi
  - Toplam Arz: 10,000,000 AJX
  - Kullanım Alanları: DAO yönetişimi, özel içerik erişimi, ödül dağıtımı
  - Dağıtım: Görev tamamlama, topluluk katkıları ve ekosistem teşvikleri

#### TON Blockchain Araçları
- TON Connect 2.0: Kullanıcı cüzdanlarını uygulamaya bağlama
- TON NFT ve Jetton Standartları: TEP-62, TEP-64 ve TEP-74 uyumlu dijital varlıklar
- TON API: Blockchain verilerine erişim ve işlem doğrulama

### 🪙 AJAN X Token (AJX)
AJAN X (AJX), Arayış Evreni ekosisteminin yerel token'ıdır ve TON blockchain üzerinde Jetton standardında oluşturulmuştur:

- Toplam arz: 10,000,000 AJX
- Kullanım Durumları:
  - DAO oylamalarında katılım ve oylama gücü
  - Premium içerik ve özel NFT'lere erişim
  - Ekosistem içi ticaret ve değer transferi
  - Topluluk teşvikleri ve ödül dağıtımı

Jetton kontratı ve teknik detaylar için [ton-deploy.md](./ton-deploy.md) dokümanını inceleyebilirsiniz.

## 🔮 Gelecek Planları

Detaylı yol haritası için [ROADMAP.md](./ROADMAP.md) dosyasına göz atın.

## 👥 Katkıda Bulunma

Arayış Evreni, açık geliştirme prensiplerine uygun olarak geliştirilmektedir. Katkıda bulunmak isterseniz:

1. Bu depoyu forklayın
2. Feature branch oluşturun: `git checkout -b yeni-ozellik`
3. Değişikliklerinizi commit edin: `git commit -m 'Yeni özellik: Açıklama'`
4. Branch'inizi push edin: `git push origin yeni-ozellik`
5. Pull Request açın

## 📄 Lisans

© 2024 Arayış Evreni. Tüm hakları saklıdır. Bu proje özel lisans altında dağıtılmaktadır.
