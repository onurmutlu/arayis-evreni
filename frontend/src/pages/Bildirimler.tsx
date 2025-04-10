import React, { useState, useEffect } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import { Bell, Swords, Gem, ShieldCheck, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale'; // Türkçe zaman formatı için

// Bildirim arayüzü
interface Bildirim {
  id: string;
  message: string;
  timestamp: Date;
  category: 'gorev' | 'nft' | 'dao' | 'sistem';
  read: boolean;
}

// İkonları kategoriye göre eşleştir
const categoryIcons: Record<Bildirim['category'], React.ElementType> = {
  gorev: Swords,
  nft: Gem,
  dao: ShieldCheck,
  sistem: Info,
};

// Mock bildirim verisi
const now = new Date();
const mockBildirimler: Bildirim[] = [
  {
    id: 'n1',
    message: `Yeni bir "Flört Ustası" görevi eklendi!`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 5), // 5 dakika önce
    category: 'gorev',
    read: false,
  },
  {
    id: 'n2',
    message: `"Kadim Muhafız" NFT'si başarıyla TON ağına mint edildi.`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 saat önce
    category: 'nft',
    read: false,
  },
  {
    id: 'n3',
    message: `Son DAO oylamasının sonuçları açıklandı. Teklif kabul edildi!`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 gün önce
    category: 'dao',
    read: true,
  },
  {
    id: 'n4',
    message: `Hoş geldin! Arayış Evreni'ne ilk adımını attın.`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3), // 3 gün önce
    category: 'sistem',
    read: true,
  },
    {
    id: 'n5',
    message: `Yeni "Şehir Geliştirme" görevi mevcut.`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 dakika önce
    category: 'gorev',
    read: false,
  },
    {
    id: 'n6',
    message: `"Flörtöz Alev" NFT'sini claim ettiniz.`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5), // 5 saat önce
    category: 'nft',
    read: true,
  },
];

const Bildirimler: React.FC = () => {
  const [bildirimler, setBildirimler] = useState<Bildirim[]>(mockBildirimler);

  // Bildirimi okundu olarak işaretle (simülasyon)
  const markAsRead = (id: string) => {
    setBildirimler(prev =>
      prev.map(b => (b.id === id ? { ...b, read: true } : b))
    );
    // Gerçek uygulamada API'ye istek gönderilebilir
  };

  // Tümünü okundu yap
  const markAllAsRead = () => {
      setBildirimler(prev => prev.map(b => ({...b, read: true})));
  }

  const unreadCount = bildirimler.filter(b => !b.read).length;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-4">
        <SayfaBasligi title="Bildirimler" icon={Bell} className="mb-0" />
        {unreadCount > 0 && (
             <button 
                onClick={markAllAsRead}
                className="text-sm text-primary hover:underline"
             >
                 Tümünü Okundu İşaretle
             </button>
        )}
      </div>


      {bildirimler.length === 0 ? (
        <p className="text-center text-textSecondary mt-8">Yeni bildiriminiz yok.</p>
      ) : (
        <div className="space-y-3">
          {bildirimler.map((bildirim) => {
            const Icon = categoryIcons[bildirim.category];
            const timeAgo = formatDistanceToNow(bildirim.timestamp, { addSuffix: true, locale: tr });

            return (
              <div
                key={bildirim.id}
                onClick={() => markAsRead(bildirim.id)} // Tıklayınca okundu yap
                className={`flex items-start p-4 border rounded-lg shadow-sm cursor-pointer transition-colors ${ 
                  bildirim.read 
                  ? 'bg-card border-border/50' 
                  : 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                }`}
              >
                {/* Okunmadıysa nokta göster */} 
                {!bildirim.read && (
                     <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                )} 
                <Icon size={20} className={`mr-3 mt-0.5 flex-shrink-0 ${bildirim.read ? 'text-textSecondary' : 'text-primary'}`} />
                <div className="flex-grow">
                  <p className={`text-sm ${bildirim.read ? 'text-textSecondary' : 'text-text font-medium'}`}>{bildirim.message}</p>
                  <p className={`text-xs mt-1 ${bildirim.read ? 'text-textMuted' : 'text-primary/80'}`}>{timeAgo}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bildirimler; 