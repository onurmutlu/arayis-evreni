#!/usr/bin/env python
import os
import sys

# Backend dizinini Python modül arama yoluna ekle
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_path)

# Main modülünü çalıştır
from backend import main

# FastAPI uygulamasını başlat (Uvicorn ile)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True) 