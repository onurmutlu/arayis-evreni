#!/bin/bash

# Uygulamanın kök dizinini belirle
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR" || exit 1

# Çalışan uvicorn süreçlerini kontrol et ve sonlandır
echo "Çalışan uvicorn süreçleri kontrol ediliyor..."
pkill -f "uvicorn main:app" || true

# Ortam değişkenleri ve bağımlılıklar
echo "Ortam değişkenleri kontrol ediliyor..."
if [ ! -f .env.development ]; then
    echo ".env.development dosyası bulunamadı, .env.example'den kopyalanıyor..."
    cp .env.example .env.development
fi

# Virtual environment kontrol et
echo "Virtual environment kontrol ediliyor..."
if [ ! -d "venv" ]; then
    echo "Virtual environment oluşturuluyor..."
    python3 -m venv venv
fi

# Virtual environment'ı aktifleştir
echo "Virtual environment aktifleştiriliyor..."
source venv/bin/activate || {
    echo "Virtual environment aktifleştirilemedi!"
    exit 1
}

# Bağımlılıkları yükle
echo "Bağımlılıklar yükleniyor..."
pip install -r requirements.txt

# Python modulü olarak görünürlüğü sağla
export PYTHONPATH="$APP_DIR:$PYTHONPATH"

# Portu belirle
PORT=${1:-8000}

# Sunucuyu başlat
echo "Uygulama $PORT portunda başlatılıyor..."
python -m uvicorn main:app --reload --host 0.0.0.0 --port $PORT

# Virtual environment'ı deaktif et
deactivate 