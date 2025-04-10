import React, { useState, useEffect } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import StarsBalance from '../components/StarsBalance';
import NFTKarti from '../components/NFTKarti';
import Buton from '../components/Buton';
import { UserWallet, TonWalletInfo, Nft, StarTransaction, StarTransactionHistoryResponse } from '../types';
import { fetchUserWallet, fetchTonWalletInfo, fetchOwnedNfts, mintNftOnTon, fetchStarTransactions } from '../utils/api';
import { Wallet as WalletIcon, Link as LinkIcon, Unlink, RefreshCw, AlertCircle, CheckCircle, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

const Wallet: React.FC = () => {
  const [walletData, setWalletData] = useState<UserWallet | null>(null);
  const [ownedNfts, setOwnedNfts] = useState<Nft[]>([]);
  const [tonInfo, setTonInfo] = useState<TonWalletInfo | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isLoadingTon, setIsLoadingTon] = useState(true);
  const [isLoadingNfts, setIsLoadingNfts] = useState(true);
  const [isMintingNftId, setIsMintingNftId] = useState<number | null>(null);
  const [mintResult, setMintResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<StarTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingWallet(true);
      setIsLoadingTon(true);
      setIsLoadingNfts(true);
      setIsLoadingTransactions(true);
      setError(null);
      setMintResult(null);

      try {
        const [walletRes, tonRes, ownedNftsRes, transactionsRes] = await Promise.allSettled([
          fetchUserWallet(),
          fetchTonWalletInfo(),
          fetchOwnedNfts(),
          fetchStarTransactions('me')
        ]);

        let errors: string[] = [];

        if (walletRes.status === 'fulfilled') {
          setWalletData(walletRes.value);
        } else {
          console.error("Cüzdan bilgisi yüklenirken hata:", walletRes.reason);
          errors.push(walletRes.reason?.message || "Cüzdan bilgisi yüklenemedi.");
        }

        if (tonRes.status === 'fulfilled') {
          setTonInfo(tonRes.value);
        } else {
          console.error("TON bilgisi yüklenirken hata:", tonRes.reason);
        }

         if (ownedNftsRes.status === 'fulfilled') {
           setOwnedNfts(ownedNftsRes.value);
         } else {
           console.error("Sahip olunan NFT'ler yüklenirken hata:", ownedNftsRes.reason);
           errors.push(ownedNftsRes.reason?.message || "NFT listesi yüklenemedi.");
         }

         if (transactionsRes.status === 'fulfilled') {
           setTransactions(transactionsRes.value.transactions);
         } else {
           console.error("İşlem geçmişi yüklenirken hata:", transactionsRes.reason);
           errors.push(transactionsRes.reason?.message || "İşlem geçmişi yüklenemedi.");
         }

         if (errors.length > 0) {
            setError(errors.join('\n'));
         }

      } catch (err: any) {
        console.error("Wallet sayfasında beklenmedik hata:", err);
        setError(err.message || "Veriler yüklenirken bilinmeyen bir hata oluştu.");
      } finally {
        setIsLoadingWallet(false);
        setIsLoadingTon(false);
        setIsLoadingNfts(false);
        setIsLoadingTransactions(false);
      }
    };

    loadData();
  }, []);

  const connectTonWallet = () => {
      alert("TON cüzdan entegrasyonu yakında gelecek! Şimdilik diğer özellikleri kullanabilirsiniz.");
  };

  const disconnectTonWallet = () => {
       alert("TON cüzdan bağlantısı yakında gelecek! Şimdilik diğer özellikleri kullanabilirsiniz.");
  };

   const handleMintNft = async (nftId: number) => {
       if (isMintingNftId) return;
       setIsMintingNftId(nftId);
       setMintResult(null);
       setError(null);

       try {
           const result = await mintNftOnTon(nftId);
           setMintResult({ success: true, message: result.message });
       } catch (err: any) {
           console.error(`NFT ${nftId} mint edilirken hata:`, err);
           setMintResult({ success: false, message: err.message || "NFT mint edilemedi." });
       } finally {
           setIsMintingNftId(null);
           setTimeout(() => setMintResult(null), 6000);
       }
   };

  // İşlem tarihini biçimlendirme fonksiyonu
  const formatTransactionDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const isPageLoading = isLoadingWallet || isLoadingNfts;

  return (
    <div className="p-4 max-w-3xl mx-auto pb-20">
      <SayfaBasligi title="Cüzdanım" icon={WalletIcon} />

      {isPageLoading && !error && ( 
         <div className="flex justify-center items-center py-10"> 
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div> 
         </div> 
      )} 

      {error && ( 
           <div className="p-3 bg-error/10 text-error text-center rounded-lg mb-4 border border-error/30 flex items-center justify-center"> 
               <AlertCircle size={20} className="mr-2"/> {error} 
           </div> 
       )} 

      {!isPageLoading && walletData && ( 
        <>
          <div className="mb-6 p-5 bg-surface rounded-xl shadow-lg border border-white/10"> 
              <h3 className="text-lg font-semibold text-textSecondary mb-4">Stars Bakiyesi</h3> 
              <StarsBalance balance={walletData.stars} className="text-3xl justify-center mb-2" /> 
              {!walletData.stars_enabled && ( 
                   <p className="text-xs text-center text-amber-500">(Stars kullanımı şu an kapalı)</p> 
              )} 
          </div> 

          <div className="mb-6 p-4 bg-surface rounded-xl shadow border border-white/10"> 
            <h3 className="text-lg font-semibold text-textSecondary mb-3 flex items-center">
                <img src="/ton_symbol.png" alt="TON Symbol" className="w-5 h-5 mr-2"/>
                TON Cüzdanı
            </h3> 
            {isLoadingTon ? ( 
                <p className="text-sm text-textSecondary">TON bilgileri yükleniyor...</p> 
            ) : tonInfo?.is_connected ? ( 
                <div className="space-y-2"> 
                    <p className="text-sm text-success flex items-center"> 
                        <CheckCircle size={16} className="mr-1"/> Bağlı: 
                        <span className="ml-1 font-mono text-xs bg-background px-1 py-0.5 rounded truncate">{tonInfo.address}</span> 
                    </p> 
                    {tonInfo.balance !== undefined && ( 
                        <p className="text-sm text-textSecondary">Bakiye: {tonInfo.balance.toFixed(2)} TON</p> 
                    )} 
                    <Buton onClick={disconnectTonWallet} variant="danger" size="sm" className="mt-2"> 
                        <Unlink size={14} className="mr-1"/> Bağlantıyı Kes 
                    </Buton> 
                </div> 
            ) : ( 
                 <div className="space-y-2"> 
                    <p className="text-sm text-textSecondary">NFT'lerinizi TON ağında mint etmek için cüzdanınızı bağlayın.</p> 
                    <Buton onClick={connectTonWallet} variant="secondary" size="sm" className="mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:brightness-110"> 
                         <LinkIcon size={14} className="mr-1"/> TON Cüzdanını Bağla 
                    </Buton> 
                 </div> 
            )} 
          </div>

          {mintResult && ( 
               <div className={`p-3 rounded-lg mb-4 border text-center text-sm ${mintResult.success ? 'bg-success/10 border-success/30 text-success' : 'bg-error/10 border-error/30 text-error'}`}> 
                   {mintResult.message} 
               </div> 
           )} 

          {/* Stars İşlem Geçmişi */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-textSecondary mb-4">Stars İşlem Geçmişi</h3>
            {isLoadingTransactions ? (
              <p className="text-sm text-center text-textSecondary">İşlem geçmişi yükleniyor...</p>
            ) : transactions.length > 0 ? (
              <div className="bg-surface rounded-xl shadow border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background text-textSecondary">
                      <tr>
                        <th className="py-2 px-4 text-left text-xs font-medium">İşlem</th>
                        <th className="py-2 px-4 text-left text-xs font-medium">Miktar</th>
                        <th className="py-2 px-4 text-left text-xs font-medium">Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id} className="border-t border-white/5">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className={`rounded-full p-1.5 mr-2 ${tx.type === 'credit' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                {tx.type === 'credit' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{tx.description}</div>
                                <div className="text-xs text-textSecondary">{tx.reason}</div>
                              </div>
                            </div>
                          </td>
                          <td className={`py-3 px-4 font-medium ${tx.type === 'credit' ? 'text-success' : 'text-error'}`}>
                            {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                          </td>
                          <td className="py-3 px-4 text-xs text-textSecondary">
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              {formatTransactionDate(tx.created_at)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-center text-textSecondary pt-6">Henüz hiç işlem yapmadınız.</p>
            )}
          </div>

          <div className="mb-6"> 
              <h3 className="text-lg font-semibold text-textSecondary mb-4">NFT Koleksiyonum ({ownedNfts.length})</h3> 
              {isLoadingNfts ? (
                  <p className="text-sm text-center text-textSecondary">NFT'ler yükleniyor...</p> 
              ) : ownedNfts.length > 0 ? ( 
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"> 
                      {ownedNfts.map(nft => ( 
                          <NFTKarti 
                              key={nft.id} 
                              nft={nft} 
                              isMinting={isMintingNftId === nft.id} 
                              onMint={handleMintNft}
                          /> 
                      ))} 
                  </div> 
              ) : ( 
                  <p className="text-center text-textSecondary pt-6">Henüz hiç NFT'niz yok.</p> 
              )} 
          </div>
        </> 
      )} 
    </div>
  );
};

export default Wallet; 