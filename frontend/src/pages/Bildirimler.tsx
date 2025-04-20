import React, { useState, useEffect } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import { Bell, Swords, Gem, ShieldCheck, Info, Star, ArrowRight, Check, Clock, Filter, Search, Rocket, Sparkles, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale'; // Türkçe zaman formatı için
import Buton from '../components/Buton';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticFeedback } from '../utils/haptics';

// Bildirim arayüzü
interface Bildirim {
  id: string;
  message: string;
  timestamp: Date;
  category: 'gorev' | 'nft' | 'dao' | 'sistem';
  read: boolean;
  link?: string; // Bildirimin yönlendirdiği sayfa (opsiyonel)
}

// İkonları kategoriye göre eşleştir
const categoryIcons: Record<Bildirim['category'], React.ElementType> = {
  gorev: Swords,
  nft: Gem,
  dao: ShieldCheck,
  sistem: Rocket,
};

// Kategorilere renk eşleştirmesi
const categoryColors: Record<Bildirim['category'], { bg: string, text: string, icon: string, gradient: string }> = {
  gorev: { 
    bg: 'bg-indigo-500/10', 
    text: 'text-indigo-400', 
    icon: 'text-indigo-400', 
    gradient: 'from-indigo-600/20 to-blue-500/20'
  },
  nft: { 
    bg: 'bg-fuchsia-500/10', 
    text: 'text-fuchsia-400', 
    icon: 'text-fuchsia-400',
    gradient: 'from-fuchsia-600/20 to-pink-500/20'
  },
  dao: { 
    bg: 'bg-cyan-500/10', 
    text: 'text-cyan-400', 
    icon: 'text-cyan-400',
    gradient: 'from-cyan-600/20 to-blue-500/20'
  },
  sistem: { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-400', 
    icon: 'text-amber-400',
    gradient: 'from-amber-600/20 to-orange-500/20'
  },
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
    link: '/gorevler'
  },
  {
    id: 'n2',
    message: `"Kadim Muhafız" NFT'si başarıyla TON ağına mint edildi.`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 saat önce
    category: 'nft',
    read: false,
    link: '/galeri'
  },
  {
    id: 'n3',
    message: `Son DAO oylamasının sonuçları açıklandı. Teklif kabul edildi!`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 gün önce
    category: 'dao',
    read: true,
    link: '/dao'
  },
  {
    id: 'n4',
    message: `Hoş geldin! Arayış Evreni'ne ilk adımını attın.`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3), // 3 gün önce
    category: 'sistem',
    read: true
  },
  {
    id: 'n5',
    message: `Yeni "Şehir Geliştirme" görevi mevcut.`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 dakika önce
    category: 'gorev',
    read: false,
    link: '/gorevler'
  },
  {
    id: 'n6',
    message: `"Flörtöz Alev" NFT'sini claim ettiniz.`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5), // 5 saat önce
    category: 'nft',
    read: true,
    link: '/galeri'
  },
  {
    id: 'n7',
    message: `Yeni bir DAO önerisi eklendi: "Galaktik Hazine Dağıtımı"`,
    timestamp: new Date(now.getTime() - 1000 * 60 * 10), // 10 dakika önce
    category: 'dao',
    read: false,
    link: '/dao'
  },
];

const Bildirimler: React.FC = () => {
  const [bildirimler, setBildirimler] = useState<Bildirim[]>(mockBildirimler);
  const [filteredBildirimler, setFilteredBildirimler] = useState<Bildirim[]>(mockBildirimler);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | Bildirim['category']>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);

  // Filtreleme
  useEffect(() => {
    let filtered = bildirimler;
    
    // Arama filtresi
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.message.toLowerCase().includes(query)
      );
    }
    
    // Kategori filtresi
    if (activeFilter === 'unread') {
      filtered = filtered.filter(b => !b.read);
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter(b => b.category === activeFilter);
    }
    
    // Tarih sıralaması (en yeni en üstte)
    filtered = [...filtered].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setFilteredBildirimler(filtered);
  }, [bildirimler, activeFilter, searchQuery]);

  // Bildirimi okundu olarak işaretle (simülasyon)
  const markAsRead = (id: string) => {
    setBildirimler(prev =>
      prev.map(b => (b.id === id ? { ...b, read: true } : b))
    );
    
    // Genişletilmiş bildirimi güncelle
    if (expandedNotification === id) {
      setExpandedNotification(null);
    }
    
    hapticFeedback('light');
    // Gerçek uygulamada API'ye istek gönderilebilir
  };

  // Tümünü okundu yap
  const markAllAsRead = () => {
    setIsMarkingAll(true);
    
    setTimeout(() => {
      setBildirimler(prev => prev.map(b => ({...b, read: true})));
      hapticFeedback('medium');
      setIsMarkingAll(false);
    }, 600);
  }

  // Bildirimi genişlet/daralt
  const toggleExpandNotification = (id: string) => {
    setExpandedNotification(prev => prev === id ? null : id);
    hapticFeedback('light');
  };

  const unreadCount = bildirimler.filter(b => !b.read).length;

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  // Filtreleme ayarları için renkleri belirle
  const getFilterClass = (filter: string) => {
    if (filter === activeFilter) {
      if (filter === 'all') return 'bg-primary/20 text-primary border-primary/30';
      if (filter === 'unread') return 'bg-red-500/20 text-red-400 border-red-500/30';
      return `${categoryColors[filter as Bildirim['category']].bg} ${categoryColors[filter as Bildirim['category']].text} border-${filter === 'gorev' ? 'indigo' : filter === 'nft' ? 'fuchsia' : filter === 'dao' ? 'cyan' : 'amber'}-500/30`;
    }
    return 'bg-surface/20 text-textSecondary hover:bg-surface/40 border-surface/20';
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Kozmik arka plan */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center" 
        style={{
          backgroundImage: `url('/assets/images/cosmic-bg.jpg')`,
          backgroundBlendMode: "overlay",
          backgroundColor: 'rgba(0,0,0,0.7)'
        }}
      >
        {/* Parlayan yıldızlar efekti */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.3,
                animation: `twinkle ${Math.random() * 10 + 5}s infinite alternate`
              }}
            />
          ))}
        </div>
        
        {/* Uzak galaksiler efekti */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={`galaxy-${i}`}
              className="absolute rounded-full bg-gradient-to-r from-purple-600/30 to-transparent blur-2xl"
              style={{
                width: `${Math.random() * 200 + 100}px`,
                height: `${Math.random() * 200 + 100}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Tümünü okundu yapma animasyonu */}
      <AnimatePresence>
        {isMarkingAll && (
          <motion.div 
            className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-primary/10 backdrop-blur-md rounded-full p-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Check size={48} className="text-primary" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative z-10 p-4 max-w-3xl mx-auto">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <SayfaBasligi 
            title="Bildirimler" 
            icon={Bell} 
            badge={unreadCount > 0 ? unreadCount : undefined} 
            badgeColor="bg-red-500"
          />
        </motion.div>
        
        {/* Arama ve Filtreleme */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={16} className="text-textSecondary" />
            </div>
            
            <input
              type="text"
              placeholder="Bildirimlerde ara..."
              className="w-full bg-surface/30 backdrop-blur-sm border border-primary/10 rounded-lg py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                hapticFeedback('light');
              }}
            />
          </div>
          
          {/* Filtreler */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div 
              className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all border ${getFilterClass('all')}`}
              onClick={() => {
                setActiveFilter('all');
                hapticFeedback('light');
              }}
            >
              Tümü
            </div>
            <div 
              className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all border ${getFilterClass('unread')}`}
              onClick={() => {
                setActiveFilter('unread');
                hapticFeedback('light');
              }}
            >
              <span className="flex items-center">
                <span className="relative mr-1.5">
                  <Bell size={14} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                </span>
                Okunmamış ({unreadCount})
              </span>
            </div>
            
            {Object.keys(categoryIcons).map((category) => {
              const CategoryIcon = categoryIcons[category as Bildirim['category']];
              return (
                <div 
                  key={category}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all border ${getFilterClass(category)}`}
                  onClick={() => {
                    setActiveFilter(category as Bildirim['category']);
                    hapticFeedback('light');
                  }}
                >
                  <span className="flex items-center">
                    <CategoryIcon size={14} className="mr-1.5" />
                    {category === 'gorev' ? 'Görevler' : 
                     category === 'nft' ? 'NFT' : 
                     category === 'dao' ? 'DAO' : 'Sistem'}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Tümünü okundu yap butonu */}
          {unreadCount > 0 && (
            <motion.div 
              className="flex justify-end"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Buton 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={isMarkingAll}
              >
                <Check size={14} className="mr-1.5" />
                Tümünü okundu işaretle
              </Buton>
            </motion.div>
          )}
        </motion.div>
        
        {/* Bildirim Listesi */}
        {filteredBildirimler.length > 0 ? (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredBildirimler.map((bildirim) => {
              const categoryColor = categoryColors[bildirim.category];
              const isExpanded = expandedNotification === bildirim.id;
              
              return (
                <motion.div 
                  key={bildirim.id}
                  className="group relative"
                  variants={itemVariants}
                  layout
                >
                  {/* Parıltılı arka plan efekti */}
                  <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${categoryColor.gradient} opacity-0 group-hover:opacity-50 blur transition-opacity duration-300`}></div>
                  
                  <div 
                    className={`relative flex flex-col backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 ${bildirim.read ? 'bg-surface/20' : 'bg-surface/30'} border ${bildirim.read ? 'border-primary/5' : 'border-primary/20'}`}
                  >
                    {/* Okunmadı işareti */}
                    {!bildirim.read && (
                      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    )}
                    
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpandNotification(bildirim.id)}
                    >
                      {/* Üst bölüm */}
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${categoryColor.bg} flex-shrink-0`}>
                          {React.createElement(categoryIcons[bildirim.category], { 
                            size: 20, 
                            className: categoryColor.icon,
                            strokeWidth: 1.5
                          })}
                        </div>
                        
                        <div className="flex-1">
                          <p className={`text-sm ${bildirim.read ? 'text-text/80' : 'text-text'} mb-1`}>
                            {bildirim.message}
                          </p>
                          
                          <div className="flex items-center gap-4">
                            <p className="text-xs text-textSecondary">
                              {formatDistanceToNow(bildirim.timestamp, { addSuffix: true, locale: tr })}
                            </p>
                            
                            {bildirim.category === 'gorev' && (
                              <span className="text-xs flex items-center text-indigo-400">
                                <Swords size={12} className="mr-1" />
                                Görev
                              </span>
                            )}
                            {bildirim.category === 'nft' && (
                              <span className="text-xs flex items-center text-fuchsia-400">
                                <Gem size={12} className="mr-1" />
                                NFT
                              </span>
                            )}
                            {bildirim.category === 'dao' && (
                              <span className="text-xs flex items-center text-cyan-400">
                                <ShieldCheck size={12} className="mr-1" />
                                DAO
                              </span>
                            )}
                            {bildirim.category === 'sistem' && (
                              <span className="text-xs flex items-center text-amber-400">
                                <Sparkles size={12} className="mr-1" />
                                Sistem
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Genişletilmiş alan */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 overflow-hidden"
                          >
                            <div className="pt-4 border-t border-primary/10">
                              {/* Detay bilgileri */}
                              <div className="flex flex-col gap-2 mb-4">
                                <div className="flex items-center">
                                  <Clock size={14} className="text-textSecondary mr-2" />
                                  <span className="text-xs text-textSecondary">
                                    {bildirim.timestamp.toLocaleString('tr-TR', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                                
                                {/* İlgili sayfaya link */}
                                {bildirim.link && (
                                  <div>
                                    <Link to={bildirim.link}>
                                      <Buton variant="ghost" size="sm" className="w-full justify-between group">
                                        <span className="flex items-center">
                                          <Zap size={14} className={categoryColor.icon + " mr-1.5"} />
                                          
                                          {bildirim.category === 'gorev' && "Görevlere git"}
                                          {bildirim.category === 'nft' && "Galeriye git"}
                                          {bildirim.category === 'dao' && "DAO sayfasına git"}
                                          {bildirim.category === 'sistem' && "Detayları gör"}
                                        </span>
                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                      </Buton>
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Okundu/Okunmadı */}
                    <div 
                      className={`border-t border-primary/10 py-1.5 px-4 flex justify-between items-center ${bildirim.read ? 'bg-surface/10' : 'bg-surface/20'}`}
                    >
                      <Buton
                        variant="ghost"
                        size="xs"
                        onClick={() => markAsRead(bildirim.id)}
                        className={`${bildirim.read ? 'opacity-60 hover:opacity-90' : 'opacity-90'}`}
                        disabled={bildirim.read}
                      >
                        {bildirim.read ? (
                          <span className="flex items-center text-textSecondary">
                            <Check size={14} className="mr-1.5" />
                            Okundu
                          </span>
                        ) : (
                          <span className="flex items-center text-primary">
                            <Check size={14} className="mr-1.5" />
                            Okundu olarak işaretle
                          </span>
                        )}
                      </Buton>
                      
                      <Buton
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => toggleExpandNotification(bildirim.id)}
                      >
                        <Info size={16} className="text-textSecondary" />
                      </Buton>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            className="bg-surface/20 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl p-8 border border-primary/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 bg-surface/40 flex items-center justify-center rounded-full mb-4">
              <Bell size={24} className="text-textSecondary" />
            </div>
            
            <h3 className="text-lg font-medium text-text mb-2">Bildirim Bulunamadı</h3>
            <p className="text-sm text-textSecondary text-center max-w-md">
              {activeFilter !== 'all'
                ? 'Seçili filtrelerde bildirim bulunamadı. Filtreleri değiştirmeyi deneyebilirsin.'
                : 'Görünüşe göre hiç bildirim yok. Yeni bildirimler geldiğinde burada görünecek.'}
            </p>
            
            {activeFilter !== 'all' && (
              <Buton 
                variant="secondary" 
                size="sm"
                className="mt-4"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                  hapticFeedback('medium');
                }}
              >
                <Filter size={14} className="mr-1.5" />
                Filtreleri Temizle
              </Buton>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Bildirimler; 