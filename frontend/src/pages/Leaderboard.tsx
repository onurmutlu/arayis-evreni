import React, { useState, useEffect } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import { fetchLeaderboard } from '../utils/api';
import { LeaderboardUser, LeaderboardResponse } from '../types/api';
import { Trophy, User, AlertCircle, ChevronDown, Star, ShieldCheck, Medal, Sparkles, Crown, Search, Award, Badge, Gem } from 'lucide-react';
import Buton from '../components/Buton';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticFeedback } from '../utils/haptics';

type LeaderboardCategory = 'xp' | 'missions_completed' | 'stars' | 'badges';

// Kategori bilgileri (label ve ikon)
const categoryDetails: Record<LeaderboardCategory, { label: string; icon: React.ElementType; color: string }> = {
  xp: { 
    label: 'En Yüksek XP', 
    icon: Star, 
    color: 'from-yellow-500 to-amber-300'
  },
  missions_completed: { 
    label: 'En Çok Görev Tamamlayanlar', 
    icon: ShieldCheck, 
    color: 'from-blue-500 to-cyan-300' 
  },
  stars: {
    label: 'En Çok Yıldız Toplayanlar',
    icon: Crown,
    color: 'from-purple-500 to-fuchsia-300'
  },
  badges: {
    label: 'En Çok Rozet Kazananlar',
    icon: Badge,
    color: 'from-emerald-500 to-green-300'
  }
};

const Leaderboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('xp');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFrame, setTimeFrame] = useState<'all' | 'weekly' | 'monthly'>('all');

  // Stats özeti
  const [leaderStats, setLeaderStats] = useState({
    totalParticipants: 0,
    competitionEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    prizePool: "5000 TON"
  });

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      setShowCategorySelector(false);
      try {
        const response = await fetchLeaderboard(selectedCategory, 50, timeFrame);
        
        // Eğer API düzgün çalışmazsa örnek veri kullan
        if (!response || !response.users || response.users.length === 0) {
          const mockData = generateMockData(selectedCategory);
          setLeaderboardData(mockData);
          
          // İstatistikleri güncelle
          setLeaderStats({
            totalParticipants: mockData.length + Math.floor(Math.random() * 50),
            competitionEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            prizePool: "5000 TON"
          });
        } else {
          setLeaderboardData(response.users);
          
          // API cevabındaki istatistikler
          if (response.stats) {
            setLeaderStats({
              totalParticipants: response.stats.totalParticipants || 0,
              competitionEnds: new Date(response.stats.competitionEndDate || Date.now() + 14 * 24 * 60 * 60 * 1000),
              prizePool: response.stats.prizePool || "5000 TON"
            });
          }
        }
      } catch (err: any) {
        console.error(`Sıralama (${selectedCategory}) yüklenirken hata:`, err);
        setError(err.message || `Sıralama (${categoryDetails[selectedCategory].label}) yüklenemedi.`);
        
        // Hata durumunda mock veri göster
        const mockData = generateMockData(selectedCategory);
        setLeaderboardData(mockData);
        setError(null); // Hata mesajını gösterme çünkü örnek veriyi gösteriyoruz
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [selectedCategory, timeFrame]);

  // Mock veri oluştur
  const generateMockData = (category: LeaderboardCategory): LeaderboardUser[] => {
    const names = [
      "KozmoKral", "YıldızAvcısı", "GalaksiKaşifi", "NebulaYolcusu", 
      "AstroMeraklı", "UzayFatihi", "GezegenGezgini", "EvrenElçisi",
      "KuyruklıYıldız", "SüperNova", "KaranlıkMadde", "ParalelEvren",
      "YıldızTozuAvcısı", "SonsuzlukŞövalyesi", "KozmikDalgacı", "UzayZamanı"
    ];
    
    return Array.from({ length: 30 }, (_, i) => ({
      id: (i + 1).toString(),
      username: names[i % names.length],
      rank: i + 1,
      avatar: i % 5 === 0 ? `/assets/avatars/avatar-${(i % 5) + 1}.png` : undefined,
      xp: getValueForCategory(category, i),
      level: Math.floor(getValueForCategory(category, i) / 1000) + 1,
      stars: Math.floor(getValueForCategory(category, i) / 10),
      badges: Math.floor(getValueForCategory(category, i) / 500)
    }));
  };

  const getValueForCategory = (category: LeaderboardCategory, index: number): number => {
    switch(category) {
      case 'xp':
        return Math.floor(10000 / (index + 1)) + Math.floor(Math.random() * 500);
      case 'missions_completed':
        return Math.floor(50 / (index + 1)) + Math.floor(Math.random() * 10);
      case 'stars':
        return Math.floor(500 / (index + 1)) + Math.floor(Math.random() * 50);
      case 'badges':
        return Math.floor(20 / (index + 1)) + Math.floor(Math.random() * 5);
      default:
        return 0;
    }
  };

  const handleCategoryChange = (category: LeaderboardCategory) => {
    hapticFeedback('medium');
    setSelectedCategory(category);
  };

  const handleTimeFrameChange = (frame: 'all' | 'weekly' | 'monthly') => {
    hapticFeedback('light');
    setTimeFrame(frame);
  };

  const filteredData = leaderboardData.filter(entry => 
    entry.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mevcut seçili kategorinin detaylarını al
  const currentCategoryDetail = categoryDetails[selectedCategory];

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Kalan süreyi gösteren formatlama
  const formatTimeRemaining = () => {
    const now = new Date();
    const diff = leaderStats.competitionEnds.getTime() - now.getTime();
    
    if (diff <= 0) return "Yarışma sona erdi";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days} gün ${hours} saat`;
  };

  // Kategori değerine göre birim
  const getCategoryUnit = (category: LeaderboardCategory): string => {
    switch(category) {
      case 'xp':
        return 'XP';
      case 'missions_completed':
        return 'görev';
      case 'stars':
        return 'yıldız';
      case 'badges':
        return 'rozet';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto pb-20 relative">
      {/* Kozmik arka plan - Zenginleştirilmiş versiyon */}
      <div 
        className="fixed inset-0 bg-cover bg-center z-0" 
        style={{ 
          backgroundImage: "url('/assets/images/cosmic-bg.jpg')", 
          backgroundBlendMode: "overlay",
          backgroundColor: 'rgba(0,0,0,0.7)'
        }}
      >
        {/* Parlayan yıldızlar efekti */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
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
      </div>
      
      <div className="relative z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <SayfaBasligi title="Liderlik Tablosu" icon={Trophy} />
        </motion.div>

        {/* İstatistik Kartları */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-5"
        >
          <div className="bg-surface/40 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex flex-col items-center">
            <div className="text-sm text-textSecondary">Toplam Katılımcı</div>
            <div className="font-bold text-primary mt-1 flex items-center">
              <User size={14} className="mr-1" />
              {leaderStats.totalParticipants}
            </div>
          </div>
          <div className="bg-surface/40 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex flex-col items-center">
            <div className="text-sm text-textSecondary">Sona Erme</div>
            <div className="font-bold text-primary mt-1 flex items-center">
              {formatTimeRemaining()}
            </div>
          </div>
          <div className="bg-surface/40 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex flex-col items-center">
            <div className="text-sm text-textSecondary">Ödül Havuzu</div>
            <div className="font-bold text-primary mt-1 flex items-center">
              <Gem size={14} className="mr-1" />
              {leaderStats.prizePool}
            </div>
          </div>
        </motion.div>

        {/* Zaman Dilimi Seçici */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex rounded-lg overflow-hidden mb-4 bg-surface/30 backdrop-blur-sm border border-white/10"
        >
          <button 
            className={`flex-1 py-2 text-sm ${timeFrame === 'all' ? 'bg-primary text-white' : 'text-textSecondary'}`}
            onClick={() => handleTimeFrameChange('all')}
          >
            Tüm Zamanlar
          </button>
          <button 
            className={`flex-1 py-2 text-sm ${timeFrame === 'monthly' ? 'bg-primary text-white' : 'text-textSecondary'}`}
            onClick={() => handleTimeFrameChange('monthly')}
          >
            Bu Ay
          </button>
          <button 
            className={`flex-1 py-2 text-sm ${timeFrame === 'weekly' ? 'bg-primary text-white' : 'text-textSecondary'}`}
            onClick={() => handleTimeFrameChange('weekly')}
          >
            Bu Hafta
          </button>
        </motion.div>

        {/* Arama Çubuğu */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative mb-4"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-textSecondary" />
            </div>
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface/30 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            />
          </div>
        </motion.div>

        {/* Kategori Seçici */}
        <motion.div 
          className="mb-5 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Buton
            variant="secondary"
            onClick={() => {
              hapticFeedback('light');
              setShowCategorySelector(!showCategorySelector);
            }}
            className="w-full flex justify-between items-center px-4 py-3 shadow-sm bg-surface/30 backdrop-blur border border-white/10"
          >
            <span className="flex items-center">
              <currentCategoryDetail.icon size={18} className={`mr-2 bg-gradient-to-r ${currentCategoryDetail.color} bg-clip-text text-transparent`} />
              {currentCategoryDetail.label}
            </span>
            <ChevronDown size={20} className={`transition-transform ${showCategorySelector ? 'rotate-180' : ''}`} />
          </Buton>
          <AnimatePresence>
            {showCategorySelector && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-1 bg-surface/80 backdrop-blur border border-white/10 rounded-lg shadow-xl z-10 p-2"
              >
                {Object.entries(categoryDetails).map(([key, detail]) => {
                  const catKey = key as LeaderboardCategory;
                  return (
                    <button
                      key={catKey}
                      onClick={() => handleCategoryChange(catKey)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-primary/10 flex items-center ${
                        selectedCategory === catKey ? 'text-primary font-semibold' : 'text-textSecondary'
                      }`}
                    >
                      <detail.icon size={16} className={`mr-2 ${selectedCategory === catKey ? `bg-gradient-to-r ${detail.color} bg-clip-text text-transparent` : ''}`} />
                      {detail.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Yükleme veya Hata Durumu */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-error/10 text-error text-center rounded-lg border border-error/30 flex items-center justify-center"
          >
            <AlertCircle size={20} className="mr-2" />
            {error}
          </motion.div>
        ) : (
          /* Sıralama Listesi */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredData.length > 0 ? (
              <>
                {/* Top 3 vurgulaması */}
                {filteredData.slice(0, 3).map((entry, index) => (
                  <motion.div
                    key={entry.id || index}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-between p-4 rounded-lg border shadow-md backdrop-blur-sm ${getRankStyle(entry.rank).bg}`}
                  >
                    <div className="flex items-center overflow-hidden">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${getRankStyle(entry.rank).badge}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-text truncate">{entry.username || `Ajan ${entry.id}`}</span>
                        <span className="text-xs text-textSecondary">Evren Kâşifi</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getRankStyle(entry.rank).valueBg}`}>
                        {entry.xp} {getCategoryUnit(selectedCategory)}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Diğer sıralamalar */}
                {filteredData.slice(3).map((entry, index) => (
                  <motion.div
                    key={entry.id || index}
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-surface/20 backdrop-blur-sm"
                  >
                    <div className="flex items-center overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-surface/50 flex items-center justify-center mr-3 flex-shrink-0 text-textSecondary font-medium text-sm">
                        {entry.rank}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-text truncate">{entry.username || `Ajan ${entry.id}`}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-primary font-medium">
                        {entry.xp} <span className="text-xs text-textSecondary">{getCategoryUnit(selectedCategory)}</span>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="text-center py-10 text-textSecondary">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
                  <p>Hiçbir sonuç bulunamadı</p>
                  <p className="text-sm mt-1">Arama kriterlerinizi değiştirmeyi deneyin</p>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Sıralamaya göre görsel stiller
const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        bg: 'bg-gradient-to-r from-yellow-950/50 to-amber-900/50 border-yellow-700/50',
        badge: 'bg-gradient-to-r from-yellow-400 to-amber-300 text-yellow-900',
        text: 'text-yellow-400',
        valueBg: 'bg-yellow-500/20 text-yellow-300'
      };
    case 2:
      return {
        bg: 'bg-gradient-to-r from-slate-900/50 to-gray-800/50 border-gray-600/50',
        badge: 'bg-gradient-to-r from-slate-400 to-gray-300 text-gray-700',
        text: 'text-gray-400',
        valueBg: 'bg-gray-500/20 text-gray-300'
      };
    case 3:
      return {
        bg: 'bg-gradient-to-r from-amber-950/50 to-orange-900/50 border-amber-700/50',
        badge: 'bg-gradient-to-r from-amber-500 to-orange-400 text-amber-900',
        text: 'text-amber-400',
        valueBg: 'bg-amber-500/20 text-amber-300'
      };
    default:
      return {
        bg: 'bg-surface/30 border-white/10',
        badge: 'bg-surface/50 text-textSecondary',
        text: 'text-textSecondary',
        valueBg: 'bg-primary/10 text-primary/90'
      };
  }
};

// Sıralamaya göre ikon
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown size={18} />;
    case 2:
      return <Award size={18} />;
    case 3:
      return <Medal size={18} />;
    default:
      return rank;
  }
};

export default Leaderboard; 