"""
Arayış Evreni API başlatma scripti
"""
import os
import sys
import uvicorn

# Ana dizini PATH'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 8001))
    HOST = os.environ.get("HOST", "0.0.0.0")
    
    print(f"Arayış Evreni API {HOST}:{PORT} adresinde başlatılıyor...")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True) 