#!/bin/bash

# Arayış Evreni API Sunucu Başlatma Betiği
# EC2 üzerinde kullanım için

echo "Arayış Evreni API başlatılıyor..."

# Uygulama dizinine git
cd /home/ec2-user/arayis-evreni/backend

# Sanal ortamı etkinleştir
source venv/bin/activate

# Bağımlılıkları güncelle (opsiyonel - her başlatmada gerekli olmayabilir)
pip install -r requirements.txt

# Veritabanı migrasyonlarını uygula
alembic upgrade head

# Log dizininin var olduğundan emin ol
mkdir -p ../logs

# Sunucuyu başlat (Gunicorn ile)
# Arka planda çalıştır ve log dosyasına yönlendir
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --daemon \
  --access-logfile ../logs/api-access.log \
  --error-logfile ../logs/api-error.log \
  --log-level info \
  --timeout 120

echo "Sunucu başlatıldı!"
echo "Loglar için:"
echo "  Access log: tail -f ../logs/api-access.log"
echo "  Error log: tail -f ../logs/api-error.log"
echo "Sunucu durumu: ps aux | grep gunicorn" 