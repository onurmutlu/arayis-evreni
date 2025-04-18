# 🚀 Arayış Evreni Frontend

Arayış Evreni uygulamasının frontend kısmı React, TypeScript ve Vite kullanılarak geliştirilmiştir. Bu dökümantasyon, frontend'in kurulumu, yapısı ve kullanımı hakkında bilgiler içerir.

## 📋 Kurulum

### Ön Koşullar
- Node.js (v18+)
- npm veya yarn

### Geliştirme Ortamı Kurulumu

```bash
# Bağımlılıkları yükleme
npm install
# veya
yarn install

# Ortam değişkenlerini yapılandırma
cp .env.example .env
# .env dosyasını düzenleyin (API_URL vb.)

# Geliştirme sunucusunu başlatma
npm run dev
# veya
yarn dev
```

## 🏗️ Proje Yapısı

```
frontend/
├── public/               # Statik dosyalar
│   ├── assets/           # Görseller ve medya dosyaları
│   │   └── nft/          # NFT videoları
│   └── badges/           # Rozet görüntüleri
├── src/
│   ├── components/       # Yeniden kullanılabilir bileşenler
│   │   ├── GorevKarti.tsx # Görev kart bileşeni
│   │   ├── NftCard.tsx   # NFT kart bileşeni
│   │   └── ...
│   ├── contexts/         # React context'leri
│   │   └── TelegramContext.tsx # Telegram WebApp entegrasyonu
│   ├── pages/            # Sayfa bileşenleri
│   │   ├── Gorevler.tsx  # Görevler sayfası
│   │   ├── Galeri.tsx    # NFT galerisi
│   │   ├── Profil.tsx    # Kullanıcı profili
│   │   └── ...
│   ├── utils/            # Yardımcı fonksiyonlar
│   │   ├── api.ts        # API istekleri
│   │   └── ...
│   ├── types/            # TypeScript tip tanımları
│   ├── App.tsx           # Ana uygulama bileşeni
│   └── main.tsx          # Giriş noktası
├── styles/               # Global stil dosyaları
├── tsconfig.json         # TypeScript yapılandırması
├── vite.config.ts        # Vite yapılandırması
└── uno.config.ts         # UnoCSS yapılandırması
```

## 🎨 Arayüz Bileşenleri

### 📱 Sayfa Bileşenleri
- **Gorevler.tsx**: Kullanıcının tamamlayabileceği görevleri listeleyen ana sayfa
- **Galeri.tsx**: Kullanıcının NFT koleksiyonunu ve satın alınabilir NFT'leri gösteren galeri
- **Profil.tsx**: Kullanıcı profili, seviyesi, rozetleri ve istatistikleri
- **Wallet.tsx**: Kullanıcının Stars bakiyesi ve işlem geçmişi

### 🧩 Ortak Bileşenler
- **Layout.tsx**: Sayfa düzeni ve navigasyon
- **GorevKarti.tsx**: Görev bilgilerini ve durumunu gösteren kart
- **NftCard.tsx**: NFT'leri gösteren ve etkileşim sağlayan kart
- **StarsBalance.tsx**: Stars bakiyesini gösteren bileşen
- **SayfaBasligi.tsx**: Sayfa başlığı ve üst kısım düzeni
- **Buton.tsx**: Özelleştirilmiş buton bileşeni

## 🔌 API Entegrasyonu

API istekleri için `src/utils/api.ts` kullanılır. Bu modül, backend'e yapılan tüm istekleri yönetir ve gerekli hata işleme mekanizmalarını içerir.

```javascript
// API isteği örneği
import { fetchAllNfts } from '../utils/api';

const NftListComponent = () => {
  const [nfts, setNfts] = useState([]);
  
  useEffect(() => {
    const loadNfts = async () => {
      try {
        const nftData = await fetchAllNfts();
        setNfts(nftData);
      } catch (error) {
        console.error("NFT'ler yüklenirken hata:", error);
      }
    };
    
    loadNfts();
  }, []);
  
  // ...
};
```

## 🔒 Telegram WebApp Entegrasyonu

Uygulama, Telegram Mini App olarak çalışmak üzere tasarlanmıştır. Telegram WebApp API'si, `TelegramContext.tsx` içinde yönetilir ve kullanıcı kimlik doğrulama için kullanılır.

```javascript
// Telegram WebApp kullanımı
import { useTelegram } from '../contexts/TelegramContext';

const MyComponent = () => {
  const { user, initDataUnsafe, showBackButton } = useTelegram();
  
  useEffect(() => {
    if (user) {
      console.log(`Hoşgeldin, ${user.first_name}!`);
    }
  }, [user]);
  
  // ...
};
```

## 🎭 Stil ve Tema

Uygulama, UnoCSS (Atomic CSS) kullanılarak stilize edilmiştir. Global stiller `styles/global.css` içinde tanımlanır.

```jsx
// Stil örneği
<div className="flex flex-col gap-4 p-4 bg-gradient-to-b from-primary to-secondary rounded-xl shadow-lg">
  <h2 className="text-xl font-bold text-white">NFT Koleksiyonum</h2>
  <div className="grid grid-cols-2 gap-2">
    {/* NFT kart bileşenleri */}
  </div>
</div>
```

## 📱 Responsive Tasarım

Uygulama, farklı ekran boyutlarına uyum sağlayacak şekilde tasarlanmıştır. UnoCSS'in duyarlı prefixleri kullanılarak responsive tasarım sağlanır.

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Duyarlı grid içeriği */}
</div>
```

## 🧪 Test

```bash
# Test çalıştırma (henüz test yoktur)
npm run test
# veya
yarn test
```

## 📦 Dağıtım

```bash
# Üretim derlemesi
npm run build
# veya
yarn build

# Derlenmiş dosyalar /dist dizininde oluşturulur
```

### Vercel ile Dağıtım

```bash
# Vercel CLI'yi yükleme
npm install -g vercel

# Dağıtım
vercel login
vercel
```

## 📚 Bağımlılıklar

Ana bağımlılıklar:
- React: UI kütüphanesi
- TypeScript: Tip güvenliği
- Vite: Build aracı
- UnoCSS: Atomic CSS kütüphanesi
- React Router: Sayfa yönlendirme

Daha detaylı liste için `package.json` dosyasına bakın.

## 🔄 Geliştirme İş Akışı

1. Feature branch oluşturun: `git checkout -b feature/yeni-ozellik`
2. Değişikliklerinizi yapın ve commit edin
3. Push yapın: `git push origin feature/yeni-ozellik`
4. Pull Request oluşturun
5. Code review sonrası merge edin

## 📝 Notlar ve Bilinen Sorunlar

- Telegram WebApp entegrasyonu belirli durumlarda önbellekleme sorunları yaşayabilir
- Bazı NFT videoları yüklenirken sorunlar olabilir
- API isteklerinde zaman zaman CORS hataları alınabilir, bu durumda backend CORS ayarlarının kontrol edilmesi gerekir
