import React, { useState, useEffect, useMemo } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import { fetchLeaderboard } from '../utils/api';
import { LeaderboardEntry } from '../types';
import { Trophy, User, Activity, AlertCircle, ChevronDown, Star, ShieldCheck } from 'lucide-react'; // İkonlar güncellendi
import Buton from '../components/Buton';

type LeaderboardCategory = 'xp' | 'missions_completed'; // | 'stars_spent'; // Desteklenen kategoriler

// Kategori bilgileri (label ve ikon)
const categoryDetails: Record<LeaderboardCategory, { label: string; icon: React.ElementType }> = {
  xp: { label: 'En Yüksek XP', icon: Star }, // XP için Star ikonu daha uygun
  missions_completed: { label: 'En Çok Görev Tamamlayanlar', icon: ShieldCheck }, // Görev için kalkan
  // stars_spent: { label: 'En Çok Stars Harcayanlar', icon: Gem } // Stars harcaması eklenecekse
};

const Leaderboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('xp');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      setShowCategorySelector(false); // Yeni veri yüklenirken seçiciyi kapat
      try {
        const response = await fetchLeaderboard(selectedCategory, 50); // İlk 50 kişiyi getir
        setLeaderboardData(response.entries);
      } catch (err: any) {
        console.error(`Sıralama (${selectedCategory}) yüklenirken hata:`, err);
        setError(err.message || `Sıralama (${categoryDetails[selectedCategory].label}) yüklenemedi.`);
        setLeaderboardData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [selectedCategory]);

  const handleCategoryChange = (category: LeaderboardCategory) => {
      setSelectedCategory(category);
  };

  // Mevcut seçili kategorinin detaylarını al
  const currentCategoryDetail = categoryDetails[selectedCategory];

  return (
    <div className="p-4 max-w-2xl mx-auto pb-20">
      <SayfaBasligi title="Liderlik Tablosu" icon={Trophy} />

      {/* Kategori Seçici */} 
      <div className="mb-5 relative"> 
         <Buton 
             variant="secondary" 
             onClick={() => setShowCategorySelector(!showCategorySelector)} 
             className="w-full flex justify-between items-center px-4 py-2 shadow-sm" 
         > 
             <span className="flex items-center"> 
                <currentCategoryDetail.icon size={18} className="mr-2 opacity-80" /> 
                {currentCategoryDetail.label} 
             </span> 
             <ChevronDown size={20} className={`transition-transform ${showCategorySelector ? 'rotate-180' : ''}`} /> 
         </Buton> 
         {showCategorySelector && ( 
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/10 rounded-lg shadow-xl z-10 p-2"> 
               {Object.entries(categoryDetails).map(([key, detail]) => { 
                    const catKey = key as LeaderboardCategory; 
                    return ( 
                        <button 
                            key={catKey} 
                            onClick={() => handleCategoryChange(catKey)} 
                            className={`w-full text-left px-3 py-2 rounded hover:bg-primary/10 flex items-center ${selectedCategory === catKey ? 'text-primary font-semibold' : 'text-textSecondary'}`} 
                        > 
                            <detail.icon size={16} className="mr-2"/> 
                            {detail.label} 
                        </button> 
                    ); 
               })} 
            </div> 
         )} 
      </div> 


      {/* Yükleme veya Hata Durumu */} 
      {isLoading ? ( 
         <div className="flex justify-center items-center py-16"> 
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div> 
         </div> 
      ) : error ? ( 
        <div className="p-4 bg-error/10 text-error text-center rounded-lg border border-error/30 flex items-center justify-center"> 
            <AlertCircle size={20} className="mr-2"/> 
            {error} 
        </div> 
      ) : (
          /* Sıralama Listesi */ 
          <div className="space-y-2"> 
            {leaderboardData.length > 0 ? ( 
                leaderboardData.map((entry, index) => ( 
                  <div 
                    key={entry.user_id || index} 
                    className="flex items-center justify-between p-3 bg-surface/80 rounded-lg border border-white/5 shadow-sm animate-fade-in" 
                    style={{ animationDelay: `${index * 50}ms` }} 
                  > 
                    <div className="flex items-center overflow-hidden"> 
                      <span className={`w-8 text-center font-bold mr-3 flex-shrink-0 ${ 
                          entry.rank === 1 ? 'text-amber-400' : 
                          entry.rank === 2 ? 'text-gray-400' : 
                          entry.rank === 3 ? 'text-orange-400' : 'text-textSecondary' 
                      }`}> 
                        {entry.rank}. 
                      </span> 
                      {/* Kullanıcı ikonu veya avatarı eklenebilir */}
                      {/* <img src={...} alt="avatar" className="w-6 h-6 rounded-full mr-2"/> */}
                      <User size={18} className="text-textSecondary mr-2 flex-shrink-0"/> 
                      <span className="text-sm font-medium text-text truncate">{entry.username || `Ajan ${entry.user_id}`}</span> 
                    </div> 
                    <span className={`text-sm font-semibold ml-2 flex-shrink-0 ${selectedCategory === 'xp' ? 'text-primary' : 'text-secondary'}`}> 
                        {entry.value.toLocaleString()} {selectedCategory === 'xp' ? 'XP' : 'Görev'} 
                    </span> 
                  </div> 
                )) 
            ) : ( 
                <p className="text-center text-textSecondary pt-8">Bu kategoride sıralama verisi bulunamadı.</p> 
            )} 
          </div> 
        ) 
      } 

    </div> 
  );
};

export default Leaderboard; 