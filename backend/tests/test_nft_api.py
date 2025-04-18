import pytest
from fastapi.testclient import TestClient
from main import app
import sys
import os

# Ana dizini içe aktarma yoluna ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Test istemcisi oluştur
client = TestClient(app)

def test_nft_list_endpoint():
    """
    /nft/list endpoint'inin doğru çalışıp çalışmadığını test eder.
    """
    response = client.get("/nft/list")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    
    # İlk NFT'nin beklenen alanlarını kontrol et
    first_nft = data[0]
    assert "id" in first_nft
    assert "category" in first_nft
    assert "level" in first_nft
    assert "name" in first_nft
    assert "video" in first_nft
    assert "rarity" in first_nft

def test_nft_detail_endpoint():
    """
    /nft/{id} endpoint'inin doğru çalışıp çalışmadığını test eder.
    """
    # Var olan bir ID ile test
    response = client.get("/nft/1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert "category" in data
    assert "level" in data
    assert "name" in data
    assert "video" in data
    assert "rarity" in data
    
    # Var olmayan bir ID ile test
    response = client.get("/nft/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "NFT not found"}

def test_nft_metadata_consistency():
    """
    Tüm NFT'lerin metadata'larının tutarlı olup olmadığını test eder.
    """
    response = client.get("/nft/list")
    data = response.json()
    
    for nft in data:
        # Her NFT için gerekli alanları kontrol et
        assert isinstance(nft["id"], int)
        assert isinstance(nft["category"], str)
        assert isinstance(nft["level"], int)
        assert isinstance(nft["name"], str)
        assert isinstance(nft["video"], str)
        assert nft["rarity"] in ["common", "uncommon", "rare", "epic", "legendary"]
        
        # Video URL'sinin doğru formatta olup olmadığını kontrol et
        assert nft["video"].startswith("https://") and nft["video"].endswith(".mp4")

if __name__ == "__main__":
    # Testleri manuel olarak çalıştırmak için
    pytest.main(["-xvs", __file__]) 