# 🤝 Arayış Evreni'ne Katkıda Bulunma

Arayış Evreni projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Bu rehber, projeye nasıl katkıda bulunabileceğinizi ve geliştirme süreçlerimizi açıklar.

## 📋 Katkıda Bulunma Süreci

1. Projeyi forklayın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 🔍 Pull Request Süreci

1. PR açmadan önce projeyi güncel upstream ile senkronize edin
2. Mümkünse, değişiklikleriniz için testler ekleyin
3. Değişikliklerinizin mevcut testleri geçtiğinden emin olun
4. PR açtığınızda, değişikliklerinizin amacını ve kapsamını açık bir şekilde belirtin
5. PR'ınız incelenene kadar sabırlı olun - en geç 2-3 iş günü içinde geri dönüş yapılacaktır

## 💻 Kod Standartları

### Genel Kurallar
- Temiz, okunabilir ve anlaşılır kod yazın
- Kodunuzun projede var olan kodlama stili ile uyumlu olmasına dikkat edin
- Fonksiyonlarınızı ve değişkenlerinizi açıklayıcı isimlerle adlandırın
- Karmaşık kod bloklarını açıklayan yorumlar ekleyin

### Frontend (React/TypeScript)
- React bileşenleri için fonksiyonel bileşenler kullanın
- TypeScript tip tanımlarını eksiksiz yapın
- UnoCSS class isimlerini tutarlı biçimde kullanın
- Component props için uygun tiplerle interface tanımlayın
- React hooks kurallarına dikkat edin

```typescript
// İyi örnek
interface ButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  text, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}) => {
  return (
    <button 
      className={`btn btn-${variant}`} 
      onClick={onClick} 
      disabled={disabled}
    >
      {text}
    </button>
  );
};
```

### Backend (Python/FastAPI)
- PEP 8 kurallarına uyun
- Fonksiyonlar ve sınıflar için docstring ekleyin
- FastAPI router ve endpoint'lerini mantıklı şekilde gruplandırın
- Pydantic modelleri için uygun tip tanımları yapın
- Güvenlik ve performans en iyi uygulamalarını takip edin

```python
# İyi örnek
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Belirli bir kullanıcının bilgilerini getiren endpoint.
    
    Args:
        user_id: Kullanıcı ID'si
        db: Veritabanı oturumu
        
    Returns:
        UserResponse: Kullanıcı bilgileri
        
    Raises:
        HTTPException: Kullanıcı bulunamazsa 404
    """
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

## 📚 Commit Mesajları

Commit mesajlarınızı [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) formatını takip ederek yazın:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Tipleri
- **feat**: Yeni bir özellik
- **fix**: Bir hata düzeltme
- **docs**: Sadece dokümantasyon değişiklikleri
- **style**: Kod davranışını etkilemeyen değişiklikler (boşluk, formatlama vb.)
- **refactor**: Hata düzeltmeyen ve yeni özellik eklemeyen kod değişikliği
- **perf**: Performansı artıran değişiklikler
- **test**: Test ekleme veya düzeltme
- **chore**: Yapılandırma, derleme süreci vb. değişiklikler

Örnekler:
```
feat(nft): add NFT minting feature
fix(auth): resolve JWT token expiration issue
docs: update API documentation
style: format code with prettier
```

## 🧪 Test Kuralları

- Yeni özellikler veya hata düzeltmeleri için testler ekleyin
- Backend için pytest kullanın
- Frontend için React Testing Library ile bileşen testleri yazın
- Entegrasyon testlerini dahil edin

## 🛣️ Geliştirme Yol Haritası

Katkıda bulunmak isteyebileceğiniz açık konuları görmek için [ROADMAP.md](./ROADMAP.md) dosyasına göz atın veya [Issues](https://github.com/username/arayis-evreni/issues) bölümüne bakın.

## 📝 Lisans

Katkıda bulunarak, katkılarınızın projenin lisansı altında yayınlanacağını kabul etmiş olursunuz.

## 🤔 Sorular?

Sorularınız veya önerileriniz varsa, bir issue açarak veya iletişim kanallarımızdan bize ulaşabilirsiniz.

Katkılarınız için teşekkür ederiz! 🙏 