# 🚀 Arayış Evreni: Üretim Ortamına Geçiş Kılavuzu

Bu belge, Arayış Evreni projesinin geliştirme ortamından üretim ortamına geçiş sürecini ve kontrol listesini içerir. Deployment öncesi dikkat edilmesi gereken noktalar ve adım adım kurulum talimatları bu dokümanda bulunmaktadır.

## 📋 Üretim Öncesi Kontrol Listesi

### 💻 Backend Kontrolleri
- [ ] `.env.production` dosyası oluşturuldu ve doğru ortam değişkenleri ayarlandı
- [ ] Veritabanı yedekleme stratejisi oluşturuldu
- [ ] `alembic upgrade head` ile veritabanı migrasyonları tamamlandı
- [ ] API ratelimiting yapılandırması aktif edildi
- [ ] DEBUG modu kapatıldı
- [ ] CORS ayarları doğru şekilde yapılandırıldı (sadece gerekli domain'ler)
- [ ] Güvenlik başlıkları eklendi (X-Content-Type-Options, X-Frame-Options)
- [ ] Bağımlılıklar sabit versiyonlara kilitlendi
- [ ] Loglama ayarları yapılandırıldı
- [ ] Telegram bot token'ı üretim ortamı için ayarlandı
- [ ] NFT API'leri birleştirilmesi main.py dosyasına entegre edildi
- [ ] NFT metadata işlemleri API yolları kontrol edildi
- [ ] NFT endpoint'lerinin tümü test edildi

### 🎨 Frontend Kontrolleri
- [ ] `.env.production` dosyası oluşturuldu ve değişkenler ayarlandı
- [ ] Vite build optimizasyonları aktif edildi
- [ ] API endpoint URL'leri üretim ortamına göre ayarlandı
- [ ] Telegram WebApp parametreleri üretim ortamı için yapılandırıldı
- [ ] Hata izleme servisi entegre edildi
- [ ] Analitik kodları yerleştirildi
- [ ] Lighthouse performans testi yapıldı (90+ puan hedefi)
- [ ] Konsol logları temizlendi
- [ ] PWA manifest ve service worker dosyaları kontrol edildi
- [ ] NFT API birleştirmesi sonrası frontend API çağrıları güncellendi
- [ ] Yeni API endpoint'leri ile frontend işlevselliği doğrulandı

### 🔐 Güvenlik Kontrolleri
- [ ] JWT süresi ve refresh token mekanizması ayarlandı
- [ ] Telegram doğrulama şifrelemeleri kontrol edildi
- [ ] API anahtarları ve hassas bilgiler ortam değişkenlerine taşındı
- [ ] SQL enjeksiyon ve XSS korumaları test edildi
- [ ] Veri doğrulama kontrolleri tamamlandı
- [ ] Sızma testi yapıldı

### ⛓️ Blockchain Entegrasyonu
- [ ] TON API anahtarları üretim için hazırlandı
- [ ] TON Connect 2.0 yapılandırması yapıldı
- [ ] NFT kontratları mainnet'e deploy edildi
- [ ] AJX Jetton kontratı mainnet'e deploy edildi
- [ ] Test cüzdanları ile işlemler doğrulandı

## 🚀 Deployment Adımları

### 1️⃣ Backend Deployment (AWS EC2)

```bash
# EC2 sunucuya SSH ile bağlan
ssh -i your-key.pem ec2-user@your-instance-ip

# Gerekli paketleri yükle
sudo yum update -y
sudo yum install -y python39 python39-devel python39-pip git nginx

# Proje dizinini oluştur
mkdir -p /home/ec2-user/arayis-evreni
cd /home/ec2-user/arayis-evreni

# Repo'yu kopyala
git clone https://github.com/username/arayis-evreni.git .
cd backend

# Sanal ortam oluştur ve etkinleştir
python3 -m venv venv
source venv/bin/activate

# Bağımlılıkları kur
pip install -r requirements.txt

# Üretim ortam değişkenlerini kopyala
cp .env.example .env.production
nano .env.production  # Değişkenleri düzenle

# Veritabanı migrasyonlarını uygula
alembic upgrade head

# Gunicorn servis dosyasını oluştur
sudo tee /etc/systemd/system/arayis-backend.service > /dev/null << EOL
[Unit]
Description=Arayis Evreni Backend
After=network.target

[Service]
User=ec2-user
Group=ec2-user
WorkingDirectory=/home/ec2-user/arayis-evreni/backend
Environment="PATH=/home/ec2-user/arayis-evreni/backend/venv/bin"
ExecStart=/home/ec2-user/arayis-evreni/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 main:app
Restart=always
RestartSec=5
StartLimitInterval=0

[Install]
WantedBy=multi-user.target
EOL

# Nginx yapılandırması
sudo tee /etc/nginx/conf.d/arayis-backend.conf > /dev/null << EOL
server {
    listen 80;
    server_name api.arayis-evreni.siyahkare.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOL

# Servisleri başlat
sudo systemctl enable arayis-backend
sudo systemctl start arayis-backend
sudo systemctl enable nginx
sudo systemctl restart nginx

# SSL için Certbot kur (opsiyonel)
sudo amazon-linux-extras install epel -y
sudo yum install -y certbot python-certbot-nginx
sudo certbot --nginx -d api.arayis-evreni.siyahkare.com
```

### 2️⃣ Frontend Deployment (Vercel)

```bash
# Frontend dizinine git
cd ../frontend

# Vercel CLI'yi yükle (eğer yoksa)
npm install -g vercel

# Node modüllerini yükle
npm install

# Üretim için build al
npm run build

# Vercel'e deploy et
vercel login
vercel --prod
```

### 3️⃣ Telegram Bot Kurulumu

1. BotFather üzerinden bot token'ını üretim için al
2. WebApp URL'ini yapılandır
3. Webhook'ları ayarla
4. İnline komutları yapılandır

### 4️⃣ TON Blockchain Kurulumu

1. NFT Koleksiyon Kontratını Deploy Et
2. AJX Jetton Kontratını Deploy Et
3. DAO Yönetim Kontratını Deploy Et

## 🖥️ Üretim Ortamı İzleme ve Bakım

### 📊 İzleme Araçları
- AWS CloudWatch: Sunucu metrikleri ve loglar
- Sentry: Hata izleme ve raporlama
- Datadog: Performans izleme (opsiyonel)
- Google Analytics: Kullanıcı davranışları

### 🔄 Düzenli Bakım Görevleri
- Veritabanı yedeklemeleri (günlük)
- Güvenlik güncellemeleri (haftalık)
- Performans ölçümleri (haftalık)
- Kullanıcı geri bildirimleri değerlendirmesi (haftalık)
- Bağımlılık güncellemeleri (aylık)

### 🛟 Acil Durum Planı
- **Rollback Stratejisi:** Sorunlu güncelleme durumunda önceki sürüme hızlı dönüş
- **Yedek Sunucu:** Fails over durumunda yedek sunucu devreye alma
- **İletişim Kanalı:** Ekip için acil durum iletişim planı

## 📞 Teknik Destek Bilgileri

- **Teknik Ekip:** tech@arayis-evreni.com
- **DevOps Sorumlusu:** devops@arayis-evreni.com
- **Acil Durum İletişim:** Telegram Grubu - "Arayis-SRE"

## 📅 Sürüm Notları

**Arayış Evreni v1.0.2**
- NFT API'leri (nft.py ve nfts.py) tek bir dosyada birleştirildi
- API endpoint'leri daha tutarlı hale getirildi
- Endpoint prefix'leri standardize edildi (/nfts)
- Geriye dönük uyumluluk için yönlendirmeler eklendi
- Yeni API yolları: `/metadata/list`, `/metadata/{id}`, `/details/{nft_id}`
- Frontend entegrasyonu doğrulandı ve test edildi

**Arayış Evreni v1.0.1**
- İlk resmi üretim sürümü hazırlığı
- Telegram Mini App entegrasyonu
- TON Blockchain entegrasyonu başlangıcı
- NFT galerisi ve koleksiyonu
- Görev sistemi ve XP/Seviye mekanizması

**Arayış Evreni v1.0.0**
- İlk resmi üretim sürümü
- Telegram Mini App tam entegrasyonu
- TON Blockchain entegrasyonu
- NFT galerisi ve koleksiyonu
- Görev sistemi ve XP/Seviye mekanizması

---

*Bu belge, Arayış Evreni ekibi tarafından hazırlanmıştır ve üretim ortamına geçiş sırasında sürekli güncellenmektedir. Son güncelleme: 12 Mayıs 2024.* 