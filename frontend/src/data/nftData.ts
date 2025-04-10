// Bu dosya, frontend/public/assets/nft/ klasöründeki video dosyalarına dayanarak oluşturulmuştur.
import { Nft, NFTCategory } from '../types';

// Sora özel alt kategorilerin tipleri için type guard
type SoraSubcategory = 'hacker' | 'oracle' | 'warrior' | 'watcher';

export interface NFT {
  id: string; // Dosya adından türetilmiş (örn: nft-guardian-1)
  title: string; // Kategori ve numaradan türetilmiş (örn: Muhafız #1)
  description: string; // Kategoriye özel bilimkurgu açıklaması
  category: 'guardian' | 'flirt' | 'dao' | 'city' | 'sora_special'; // Dosya adından alınmış (küçük harf)
  subcategory?: SoraSubcategory; // Sora special için alt kategori (hacker, oracle, warrior, watcher)
  video_url: string; // Video dosyasının yolu (örn: /assets/nft/NFT-guardian-1.mp4)
  claim_cost: number; // Kategoriye göre belirlenmiş maliyet
  minted: boolean; // Başlangıçta false
  is_elite?: boolean; // Elit NFT mi? (Sora özel koleksiyonu için)
}

// Kategoriye özel açıklamalar
const descriptions = {
  guardian: "Siber düzlemin sarsılmaz koruyucuları. Dijital sınırları aşılmaz bir iradeyle savunurlar, kodun ve düzenin bekçileridirler.",
  flirt: "Duygu spektrumunda dans eden, dijital varlıklar. Çekicilikleri ve öngörülemez doğalarıyla bilginin akışını yönlendirirler.",
  dao: "Merkeziyetsizliğin somutlaşmış hali. Protokolün bilgeliğini taşır, kolektif bilincin kararlarını yansıtırlar.",
  city: "Neon ışıklı metropollerin ruhu. Şehrin sürekli değişen ritmini ve sibernetik yaşamın karmaşıklığını temsil ederler.",
  sora_special: "Sora'nın ustalıkla ürettiği eşsiz sanat eserleri. Yapay ve doğal zekânın kusursuz uyumu ile yaratılan benzersiz dijital eserler."
};

// Kategoriye özel maliyetler
const costs = {
  guardian: 100,
  flirt: 60,
  dao: 250, // Maliyet güncel
  city: 75,
  sora_special: 400
};

// Kategori isimlerini Türkçeleştirme (Başlık için)
const categoryTitles = {
  guardian: "Muhafız",
  flirt: "Flört",
  dao: "DAO",
  city: "Şehir",
  sora_special: "Sora"
};

// Sora özel alt kategori açıklamaları
const soraSubDescriptions: Record<SoraSubcategory, string> = {
  hacker: "Sistemlerin gizli açıklarını bulan karanlık kodun ustaları. Dijital dünyanın görünmez katmanlarında gezinen bu varlıklar sınırları zorlar.",
  oracle: "Geçmiş ve geleceği gören bilgelik kaynakları. Veri akışının içinde anlamları keşfeder, kararları bilgece yönlendirirler.",
  warrior: "Dijital savaşın ön saflarında savaşan cesur savaşçılar. Güçleri ve dayanıklılıklarıyla karanlık tehditlere karşı koyarlar.",
  watcher: "Her şeyi gören, her yerde var olan izleyiciler. Onların gözünden hiçbir veri akışı kaçamaz, hiçbir kod gizlenemez."
};

// Sora özel alt kategorilerin maliyetleri
const soraCosts: Record<SoraSubcategory, number> = {
  hacker: 450,
  oracle: 600,
  warrior: 550,
  watcher: 500
};

// Sora alt kategori başlıkları
const soraSubTitles: Record<SoraSubcategory, string> = {
  hacker: "Hacker",
  oracle: "Kahin",
  warrior: "Savaşçı",
  watcher: "İzleyici"
};

// Sora özel kategorilerine ait dosya adları
const soraCategoryMap: Record<string, string> = {
  'hacker': 'sora_special',
  'oracle': 'sora_special',
  'warrior': 'sora_special',
  'watcher': 'sora_special'
};

// Type guard for checking if a string is a valid SoraSubcategory
function isSoraSubcategory(key: string): key is SoraSubcategory {
  return key in soraSubDescriptions;
}

// frontend/public/assets/nft/ klasöründeki gerçek dosya adları
const actualFilenames: string[] = [
  // City kategorisi
  'NFT-city-4.mp4',
  'NFT-city-3.mp4',
  'NFT-city-2.mp4',
  'NFT-city-1.mp4',
  // DAO kategorisi
  'NFT-DAO-4.mp4',
  'NFT-DAO-3.mp4',
  'NFT-DAO-2.mp4',
  'NFT-DAO-1.mp4',
  // Flirt kategorisi
  'NFT-flirt-4.mp4',
  'NFT-flirt-3.mp4',
  'NFT-flirt-2.mp4',
  'NFT-flirt-1.mp4',
  // Guardian kategorisi
  'NFT-guardian-4.mp4',
  'NFT-guardian-3.mp4',
  'NFT-guardian-2.mp4',
  'NFT-guardian-1.mp4',
  // Sora Special - Hacker alt kategorisi
  'NFT-hacker-4.mp4',
  'NFT-hacker-3.mp4',
  'NFT-hacker-2.mp4',
  'NFT-hacker-1.mp4',
  // Sora Special - Oracle alt kategorisi
  'NFT-oracle-4.mp4',
  'NFT-oracle-3.mp4',
  'NFT-oracle-2.mp4',
  'NFT-oracle-1.mp4',
  // Sora Special - Warrior alt kategorisi 
  'NFT-warrior-4.mp4',
  'NFT-warrior-3.mp4',
  'NFT-warrior-2.mp4',
  'NFT-warrior-1.mp4',
  // Sora Special - Watcher alt kategorisi
  'NFT-watcher-4.mp4',
  'NFT-watcher-3.mp4',
  'NFT-watcher-2.mp4',
  'NFT-watcher-1.mp4'
];

// Dosya adlarından NFT verilerini oluştur
export const mockNFTData: NFT[] = actualFilenames.map(filename => {
  const parts = filename.replace('.mp4', '').split('-'); // ['NFT', 'category', 'number']
  if (parts.length !== 3) {
      console.error(`Invalid filename format: ${filename}`);
      return null;
  }
  
  let categoryFromFile = parts[1];
  let subcategory: SoraSubcategory | undefined;
  
  // Sora özel kategorileri için alt kategori belirle
  const lowerCategory = categoryFromFile.toLowerCase();
  if (lowerCategory in soraCategoryMap) {
    if (isSoraSubcategory(lowerCategory)) {
      subcategory = lowerCategory;
      categoryFromFile = soraCategoryMap[lowerCategory];
    }
  }
  
  const categoryLower = categoryFromFile.toLowerCase() as NFT['category']; // Karşılaştırma ve atama için küçük harf
  const number = parseInt(parts[2], 10);

  // Küçük harfe çevrilmiş kategori ile kontrol yap
  if (!categoryLower || isNaN(number) || !descriptions[categoryLower] || !costs[categoryLower] || !categoryTitles[categoryLower]) {
      console.error(`Invalid number or unknown category ('${categoryLower}') in: ${filename}`);
      return null; 
  }

  const id = subcategory 
    ? `nft-${subcategory}-${number}` 
    : `nft-${categoryLower}-${number}`; // ID'de küçük harf kullan
    
  const title = subcategory 
    ? `${categoryTitles[categoryLower]} ${soraSubTitles[subcategory]} #${number}` 
    : `${categoryTitles[categoryLower]} #${number}`;
    
  const description = subcategory 
    ? `${descriptions[categoryLower]} ${soraSubDescriptions[subcategory]}` 
    : descriptions[categoryLower];
    
  const video_url = `/assets/nft/${filename}`; // URL için orijinal dosya adını kullan
  
  const claim_cost = subcategory 
    ? soraCosts[subcategory] 
    : costs[categoryLower];

  const nft: NFT = {
    id,
    title,
    description,
    category: categoryLower, // Kategori olarak küçük harfi sakla
    video_url,
    claim_cost,
    minted: false, // Başlangıçta tümü mint edilmemiş
    is_elite: categoryLower === 'sora_special' // Sora özel NFT'ler elit
  };
  
  // Alt kategori varsa ekle
  if (subcategory) {
    nft.subcategory = subcategory;
  }
  
  return nft;
}).filter((item): item is NFT => item !== null); // Hatalı parse edilenleri filtrele

// Veri oluşturulduğunu kontrol et (Opsiyonel)
if (mockNFTData.length !== actualFilenames.length) {
  console.warn("Some NFT filenames could not be processed correctly. Check logs for errors.");
}

// NFT'leri numaralarına göre sırala (isteğe bağlı, ID'ye göre de olabilir)
mockNFTData.sort((a, b) => {
  const numA = parseInt(a.id.split('-')[2], 10);
  const numB = parseInt(b.id.split('-')[2], 10);
  return numA - numB;
});

// Tür dönüşümleri için yardımcı fonksiyonlar - NFTCategory ayarlaması için
const mockCategoryToNFTCategory: Record<string, NFTCategory> = {
  'guardian': NFTCategory.GENERAL,
  'flirt': NFTCategory.GENERAL,
  'dao': NFTCategory.VOTE_BASIC,
  'city': NFTCategory.GENERAL,
  'sora_special': NFTCategory.SORA_VIDEO
};

/**
 * mockNFTData'yı types/index.ts içindeki Nft tipine dönüştürür.
 * Bu fonksiyon arayüz değişmeden önceki verileri korumak için kullanılır.
 */
export const convertToNftType = (mockNft: NFT): Nft => {
  const idMatch = mockNft.id.match(/nft-(\w+)-(\d+)/);
  const numericId = idMatch ? parseInt(idMatch[2], 10) : 0;
  const categoryKey = mockNft.category as keyof typeof mockCategoryToNFTCategory;
  const category = mockCategoryToNFTCategory[categoryKey] || NFTCategory.GENERAL;
  
  return {
    id: numericId,
    name: mockNft.title,
    description: mockNft.description,
    video_url: mockNft.video_url,
    category, // NFTCategory türüyle uyumlu
    price_stars: mockNft.claim_cost,
    is_active: true,
    created_at: new Date().toISOString(),
    mintable: true,
    is_owned: mockNft.minted,
    is_minted: mockNft.minted,
    is_elite: mockNft.is_elite,
    subcategory: mockNft.subcategory
  };
}; 