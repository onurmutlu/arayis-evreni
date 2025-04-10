import React, { useState, useEffect, useCallback } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import Buton from '../components/Buton';
import {
    Star, Lock, Unlock, Loader2, AlertTriangle, Crown, CheckCircle
} from 'lucide-react';

// Backend'deki VipTaskState modeline uygun arayüz
interface VipTaskState {
  id: string;
  title: string;
  description: string;
  unlockCost: number;
  isLocked: boolean;
}

// API yanıtları için arayüzler
interface WalletData { stars: number; }
interface UnlockVipResult { message: string; new_stars_balance: number; }

// API base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

// const VIP_STORAGE_KEY = 'unlockedVipTasks'; // localStorage kaldırıldı

const VIP: React.FC = () => {
  const [userStars, setUserStars] = useState<number | null>(null);
  const [vipTasks, setVipTasks] = useState<VipTaskState[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Başarı mesajı state'i
  const userId = 'user123'; // Simüle edilmiş kullanıcı ID'si

  // Başlangıçta görevleri ve kullanıcı yıldızını yükle
  const loadVipData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null); // Mesajları temizle
    try {
      const [tasksResponse, walletResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/vip_tasks/${userId}`),
        fetch(`${API_BASE_URL}/wallet/${userId}`)
      ]);

      if (!tasksResponse.ok) throw new Error("VIP görevleri yüklenemedi.");
      if (!walletResponse.ok) throw new Error("Kullanıcı bakiyesi yüklenemedi.");

      const tasksData: VipTaskState[] = await tasksResponse.json();
      const walletData: WalletData = await walletResponse.json();

      setVipTasks(tasksData);
      setUserStars(walletData.stars);

    } catch (err: any) {
      console.error("VIP verileri yüklenirken hata:", err);
      setError(err.message || "Veriler yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadVipData();
  }, [loadVipData]);

  // Görevin kilidini açma fonksiyonu (API isteği ile)
  const handleUnlock = async (taskToUnlock: VipTaskState) => {
    if (unlockingId || userStars === null || userStars < taskToUnlock.unlockCost || !taskToUnlock.isLocked) return;

    setUnlockingId(taskToUnlock.id);
    setError(null);
    setSuccessMessage(null);

    try {
        const response = await fetch(`${API_BASE_URL}/unlock_vip_task/${userId}/${taskToUnlock.id}`, {
            method: 'POST'
        });

        const resultData = await response.json();

        if (!response.ok) {
            throw new Error(resultData.detail || `VIP görev kilidi açılamadı: ${response.status}`);
        }

        const result: UnlockVipResult = resultData;

        // Başarı durumunu güncelle
        setUserStars(result.new_stars_balance); // Yıldız bakiyesini güncelle
        // Görev listesini güncelle (kilidi açıldı olarak işaretle)
        setVipTasks(prevTasks =>
            prevTasks.map(t => 
                t.id === taskToUnlock.id ? { ...t, isLocked: false } : t
            )
        );
        setSuccessMessage(result.message); // Başarı mesajını göster

        // Mesajı birkaç saniye sonra kaldır
        setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err: any) {
        console.error(`VIP görev ${taskToUnlock.id} kilidi açılırken hata:`, err);
        setError(err.message || "VIP görev kilidi açılırken bir sorun oluştu.");
         // Hata mesajını da kaldırabiliriz
        setTimeout(() => setError(null), 5000);
    } finally {
        setUnlockingId(null);
    }
  };

  // --- Render Yardımcıları --- 
   const renderLoading = () => (
    <div className="flex justify-center items-center py-10"> 
        <Loader2 size={32} className="animate-spin text-primary"/> 
        <span className="ml-3 text-lg text-textSecondary">VIP alanı yükleniyor...</span> 
    </div> 
  );

  const renderError = () => (
       <div className="p-4 bg-error/10 text-error text-center rounded-lg mb-4 border border-error/30 flex flex-col items-center justify-center">
          <AlertTriangle size={32} className="mb-2"/>
          <p className="mb-3">{error}</p>
          <Buton onClick={loadVipData} size="sm" variant="danger">Yeniden Dene</Buton>
      </div>
  );

  return (
    <div className="p-4 max-w-3xl mx-auto pb-20">
      <SayfaBasligi title="VIP Alanı" icon={Crown} />

      {/* Kullanıcı Yıldız Bakiyesi */} 
      <div className="mb-8 p-4 bg-gradient-to-r from-yellow-400/10 via-amber-500/10 to-orange-500/10 border border-yellow-600/30 rounded-lg flex justify-between items-center shadow-sm">
          <span className="text-lg font-medium text-amber-600">Yıldız Bakiyeniz:</span>
           {userStars === null && isLoading ? (
              <Loader2 size={20} className="animate-spin text-yellow-600"/>
           ) : userStars !== null ? (
              <div className="flex items-center text-xl font-bold text-yellow-600">
                  <Star size={20} className="mr-1.5 fill-yellow-500 text-yellow-600"/>
                  {userStars}
              </div>
           ) : (
               <span className="text-xs text-error">!</span> // Hata durumunda bakiye gösterilemez
           )}
      </div>

       {/* Hata Mesajı (API veya işlem hatası) - renderError içinde gösterilecek */} 
      {/* {error && !isLoading && (...)} */}
      
      {/* Başarı Mesajı (Unlock sonrası) */} 
       {successMessage && (
           <div className="mb-4 p-3 bg-success/10 text-success rounded-md text-center flex items-center justify-center">
                <CheckCircle size={18} className="mr-2" />
                {successMessage}
            </div>
       )}

      {/* VIP Görev Listesi */} 
      <h2 className="text-xl font-semibold text-text mb-4">Özel VIP Görevleri</h2>
      
      {isLoading ? (
          renderLoading()
      ) : error ? (
          renderError()
      ) : ( /* Yüklenmiyor ve hata yoksa burası render edilecek */
          <div className="space-y-4">
            {vipTasks.length === 0 && (
              <p className="text-center text-textSecondary mt-8">Aktif VIP görevi bulunmamaktadır.</p>
            )}

            {vipTasks.map((gorev) => {
              const canAfford = userStars !== null && userStars >= gorev.unlockCost;
              const isUnlockingThis = unlockingId === gorev.id;

              return (
                <div 
                  key={gorev.id} 
                  className={`p-4 border rounded-lg shadow-sm transition-all ${gorev.isLocked ? 'bg-card border-border' : 'bg-primary/5 border-primary/30'}`}
                > 
                  <div className={`flex items-center justify-between ${!gorev.isLocked ? 'mb-2' : ''}`}> 
                    <h3 className={`text-lg font-semibold ${gorev.isLocked ? 'text-textSecondary' : 'text-primary'}`}>{gorev.title}</h3> 
                     {gorev.isLocked ? ( 
                         <div className="text-right ml-4 flex-shrink-0"> 
                             <p className="text-md font-bold text-primary flex items-center justify-end"> 
                                 <Lock size={16} className="mr-1.5"/> 
                                 {gorev.unlockCost} <Star size={14} className="ml-1 fill-yellow-400 text-yellow-500" /> 
                             </p> 
                             {!canAfford && userStars !== null && (
                                 <div className="text-xs text-warning flex items-center justify-end mt-1">
                                     <AlertTriangle size={12} className="mr-1" />
                                     Yetersiz Yıldız
                                 </div>
                             )}
                             <Buton
                                onClick={() => handleUnlock(gorev)}
                                disabled={!canAfford || !!unlockingId || userStars === null}
                                size="sm"
                                variant={canAfford ? "primary" : "secondary"}
                                className={`mt-2 min-w-[120px] flex items-center justify-center ${!canAfford || userStars === null ? 'opacity-60 cursor-not-allowed' : ''}`}
                             > 
                                {isUnlockingThis ? ( 
                                    <> 
                                        <Loader2 size={16} className="animate-spin mr-1.5" /> 
                                        Açılıyor... 
                                    </> 
                                ) : ( 
                                    'Yıldız ile Aç' 
                                )} 
                             </Buton> 
                         </div> 
                     ) : ( 
                         <div className="text-sm text-success font-medium flex items-center"> 
                             <Unlock size={16} className="mr-1.5"/> 
                             Kilidi Açıldı 
                         </div> 
                     )} 
                  </div> 
                  {!gorev.isLocked && (
                    <>
                      <p className="text-sm text-textSecondary pl-1">{gorev.description}</p> 
                      {/* Açılan görev için yapılacaklar buraya eklenebilir */}
                    </>
                  )} 
                </div>
              );
            })}
          </div>
        ) /* Koşulun parantezi bitti */ }
    </div>
  );
};

export default VIP; 