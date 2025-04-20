import React, { useState, useEffect } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import Buton from '../components/Buton';
import { ShieldCheck, Vote, Users, TrendingUp, ChevronRight, Loader2, AlertCircle, ThumbsUp, ThumbsDown, Search, Star, Filter } from 'lucide-react';
import { DAOProposal, ProposalStatus } from '../types';
import { fetchDaoProposals, castVote } from '../utils/api';
import { triggerHapticFeedback, showNotification } from '../utils/hapticFeedback';

const Dao: React.FC = () => {
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ProposalStatus | 'all'>('all');
  const [votingProposalId, setVotingProposalId] = useState<number | null>(null);

  // Sahte verilerle doldurulan DAO bilgileri
  const daoStats = {
    totalProposals: 32,
    activeProposals: 4,
    totalMembers: 825,
    tokenHolders: 312,
    treasuryAmount: '285,000 STARS',
    participationRate: '68%'
  };

  // DAO önerileri yükleme fonksiyonu
  const loadProposals = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchDaoProposals();
      setProposals(data);
    } catch (err: any) {
      console.error("DAO proposals loading error:", err);
      setError("Öneriler yüklenirken bir hata oluştu");
      
      // Hata durumunda fallback (örnek veri)
      const now = new Date();
      setProposals([
        {
          id: 1,
          title: "Yeni NFT Koleksiyonu: 'Evrenin Kaşifleri'",
          description: "10 adet benzersiz NFT içeren galaktik temalı yeni bir koleksiyon oluşturulması.",
          status: ProposalStatus.ACTIVE,
          created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 gün önce
          end_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 gün sonra
          total_yes_power: 345,
          total_no_power: 125,
          user_voted: false
        },
        {
          id: 2,
          title: "Topluluk Fonu Kullanımı: Yeni Görev Mekanikleri",
          description: "Topluluk fonundan 50,000 STARS'ın yeni görev sistemleri geliştirmek için kullanılması.",
          status: ProposalStatus.PASSED,
          created_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 gün önce
          end_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 gün önce
          total_yes_power: 870,
          total_no_power: 230,
          user_voted: true,
          user_choice: true
        },
        {
          id: 3,
          title: "VIP Üyelik Avantajlarının Genişletilmesi",
          description: "VIP üyelere özel yeni içerikler ve ayrıcalıklar eklenebilmesi için oylama.",
          status: ProposalStatus.ACTIVE,
          created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 gün önce
          end_date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 gün sonra
          total_yes_power: 210,
          total_no_power: 95,
          user_voted: true,
          user_choice: true
        },
        {
          id: 4,
          title: "Görev Ödüllerinin Artırılması Önerisi",
          description: "Görevlerden kazanılan XP ve Stars ödüllerinin %20 artırılması.",
          status: ProposalStatus.REJECTED,
          created_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 gün önce
          end_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 gün önce
          total_yes_power: 310,
          total_no_power: 680,
          user_voted: true,
          user_choice: false
        },
        {
          id: 5,
          title: "Yeni Gezegen Keşfi: Arayış Evreni Genişlemesi",
          description: "Arayış Evreni'nde yeni bir dijital gezegen alanının oluşturulması ve NFT sahiplerine özel erişim.",
          status: ProposalStatus.ACTIVE,
          created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 gün önce
          end_date: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 gün sonra
          total_yes_power: 520,
          total_no_power: 85,
          user_voted: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Öneriye oy verme fonksiyonu
  const handleVote = async (proposalId: number, choice: boolean) => {
    setVotingProposalId(proposalId);
    
    try {
      await castVote(proposalId, choice);
      triggerHapticFeedback('medium');
      showNotification('success', 'Oyunuz kaydedildi!');
      
      // Önerileri yeniden yükle
      await loadProposals();
    } catch (err) {
      console.error("Voting error:", err);
      triggerHapticFeedback('error');
      showNotification('error', 'Oy kullanılırken bir hata oluştu');
    } finally {
      setVotingProposalId(null);
    }
  };

  // Filtreleme fonksiyonu
  const getFilteredProposals = () => {
    if (activeFilter === 'all') return proposals;
    return proposals.filter(p => p.status === activeFilter);
  };

  // İlk yüklemede verileri getir
  useEffect(() => {
    loadProposals();
  }, []);

  // Önerinin durumuna göre stil
  const getStatusStyle = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.ACTIVE:
        return { text: 'Aktif', color: 'text-blue-400 bg-blue-400/10' };
      case ProposalStatus.PASSED:
        return { text: 'Kabul Edildi', color: 'text-green-400 bg-green-400/10' };
      case ProposalStatus.REJECTED:
        return { text: 'Reddedildi', color: 'text-red-400 bg-red-400/10' };
      case ProposalStatus.CLOSED:
        return { text: 'Kapandı', color: 'text-gray-400 bg-gray-400/10' };
      default:
        return { text: 'Bilinmiyor', color: 'text-gray-400 bg-gray-400/10' };
    }
  };

  // Oy yüzdelerini hesapla
  const calculatePercentage = (yes: number, no: number, isYes: boolean) => {
    const total = yes + no;
    if (total === 0) return 0;
    return isYes ? Math.round((yes / total) * 100) : Math.round((no / total) * 100);
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Evren temalı arka plan */}
      <div 
        className="fixed inset-0 z-0 bg-gradient-to-b from-background to-black opacity-30" 
        style={{
          backgroundImage: `url('/assets/images/cosmic-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      
      {/* Ana içerik */}
      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <SayfaBasligi title="DAO" icon={ShieldCheck} />
        
        {/* DAO İstatistikleri */}
        <div className="bg-card/60 backdrop-blur-sm rounded-xl shadow-lg border border-primary/20 p-5 mb-6 relative overflow-hidden">
          {/* Dekoratif elementler */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-primary/5 blur-xl"></div>
          <div className="absolute -left-10 -top-10 w-20 h-20 rounded-full bg-secondary/5 blur-xl"></div>
          
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <Star className="mr-2 text-amber-400" size={20} />
            Arayış Evreni DAO İstatistikleri
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-surface/40 p-3 rounded-lg border border-primary/10">
              <div className="flex items-center text-xs text-textSecondary mb-1">
                <Vote size={14} className="mr-1 text-primary" />
                Toplam Öneri
              </div>
              <p className="text-xl font-semibold">{daoStats.totalProposals}</p>
            </div>
            
            <div className="bg-surface/40 p-3 rounded-lg border border-primary/10">
              <div className="flex items-center text-xs text-textSecondary mb-1">
                <TrendingUp size={14} className="mr-1 text-blue-400" />
                Aktif Öneriler
              </div>
              <p className="text-xl font-semibold">{daoStats.activeProposals}</p>
            </div>
            
            <div className="bg-surface/40 p-3 rounded-lg border border-primary/10">
              <div className="flex items-center text-xs text-textSecondary mb-1">
                <Users size={14} className="mr-1 text-purple-400" />
                Toplam Üye
              </div>
              <p className="text-xl font-semibold">{daoStats.totalMembers}</p>
            </div>
            
            <div className="bg-surface/40 p-3 rounded-lg border border-primary/10">
              <div className="flex items-center text-xs text-textSecondary mb-1">
                <ShieldCheck size={14} className="mr-1 text-green-400" />
                Token Sahipleri
              </div>
              <p className="text-xl font-semibold">{daoStats.tokenHolders}</p>
            </div>
            
            <div className="bg-surface/40 p-3 rounded-lg border border-primary/10">
              <div className="flex items-center text-xs text-textSecondary mb-1">
                <Star size={14} className="mr-1 text-amber-400" />
                Hazine
              </div>
              <p className="text-xl font-semibold">{daoStats.treasuryAmount}</p>
            </div>
            
            <div className="bg-surface/40 p-3 rounded-lg border border-primary/10">
              <div className="flex items-center text-xs text-textSecondary mb-1">
                <Vote size={14} className="mr-1 text-red-400" />
                Katılım Oranı
              </div>
              <p className="text-xl font-semibold">{daoStats.participationRate}</p>
            </div>
          </div>
        </div>
        
        {/* Arama ve Filtreleme */}
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h2 className="text-lg font-bold mb-2">Topluluk Önerileri</h2>
          
          <div className="flex space-x-2 mb-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Önerilerde ara..." 
                className="bg-surface/60 border border-border rounded-md py-1 pl-8 pr-3 text-sm w-full max-w-[180px] backdrop-blur-sm"
              />
              <Search size={14} className="absolute left-2.5 top-2 text-textSecondary" />
            </div>
            
            <div className="relative">
              <select 
                className="bg-surface/60 border border-border rounded-md py-1 px-8 text-sm appearance-none cursor-pointer backdrop-blur-sm"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as ProposalStatus | 'all')}
              >
                <option value="all">Tümü</option>
                <option value={ProposalStatus.ACTIVE}>Aktif</option>
                <option value={ProposalStatus.PASSED}>Kabul</option>
                <option value={ProposalStatus.REJECTED}>Red</option>
                <option value={ProposalStatus.CLOSED}>Kapandı</option>
              </select>
              <Filter size={14} className="absolute left-2.5 top-2 text-textSecondary" />
            </div>
          </div>
        </div>
        
        {/* Öneriler Listesi */}
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span className="ml-3 text-textSecondary">Öneriler yükleniyor...</span>
          </div>
        ) : error ? (
          <div className="bg-card/60 backdrop-blur-sm rounded-xl shadow-lg border border-red-400/20 p-6 text-center">
            <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
            <p className="text-textSecondary">{error}</p>
            <Buton variant="secondary" size="sm" className="mt-4" onClick={loadProposals}>
              Yeniden Dene
            </Buton>
          </div>
        ) : getFilteredProposals().length === 0 ? (
          <div className="bg-card/60 backdrop-blur-sm rounded-xl shadow-lg border border-primary/20 p-8 text-center">
            <Vote size={48} className="mx-auto mb-3 text-textSecondary opacity-40" />
            <p className="text-lg font-medium text-textSecondary mb-1">Bu filtrede öneri bulunamadı</p>
            <p className="text-sm text-textMuted">Lütfen başka bir filtre seçin veya yeni öneriler için daha sonra tekrar kontrol edin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredProposals().map((proposal) => {
              const statusStyle = getStatusStyle(proposal.status);
              const yesPercentage = calculatePercentage(proposal.total_yes_power, proposal.total_no_power, true);
              const noPercentage = calculatePercentage(proposal.total_yes_power, proposal.total_no_power, false);
              const isActive = proposal.status === ProposalStatus.ACTIVE;
              const endDate = new Date(proposal.end_date);
              const today = new Date();
              const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div 
                  key={proposal.id} 
                  className="bg-card/60 backdrop-blur-sm rounded-xl shadow-lg border border-primary/20 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="p-5">
                    {/* Başlık ve Durum */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-md font-bold group-hover:text-primary transition-colors">{proposal.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusStyle.color}`}>
                        {statusStyle.text}
                      </span>
                    </div>
                    
                    {/* Açıklama */}
                    <p className="text-sm text-textSecondary mb-4">{proposal.description}</p>
                    
                    {/* Oylar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span>Onay: {proposal.total_yes_power} ({yesPercentage}%)</span>
                        <span>Red: {proposal.total_no_power} ({noPercentage}%)</span>
                      </div>
                      
                      <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-400 transition-all" 
                          style={{ width: `${yesPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Zaman/Tarih ve Oylama Butonları */}
                    <div className="flex flex-wrap justify-between items-center mt-4">
                      <div className="text-xs text-textSecondary">
                        {isActive ? (
                          <span>Kalan süre: <span className="text-primary font-medium">{daysLeft} gün</span></span>
                        ) : (
                          <span>Sonuçlandı: <span className="font-medium">{new Date(proposal.end_date).toLocaleDateString('tr-TR')}</span></span>
                        )}
                      </div>
                      
                      {isActive && !proposal.user_voted && (
                        <div className="flex space-x-2 mt-2 sm:mt-0">
                          <Buton 
                            variant="secondary" 
                            size="sm"
                            className="flex items-center text-xs"
                            onClick={() => handleVote(proposal.id, true)}
                            disabled={votingProposalId === proposal.id}
                          >
                            {votingProposalId === proposal.id ? (
                              <Loader2 size={14} className="mr-1 animate-spin" />
                            ) : (
                              <ThumbsUp size={14} className="mr-1" />
                            )}
                            Onay
                          </Buton>
                          
                          <Buton 
                            variant="secondary" 
                            size="sm"
                            className="flex items-center text-xs"
                            onClick={() => handleVote(proposal.id, false)}
                            disabled={votingProposalId === proposal.id}
                          >
                            {votingProposalId === proposal.id ? (
                              <Loader2 size={14} className="mr-1 animate-spin" />
                            ) : (
                              <ThumbsDown size={14} className="mr-1" />
                            )}
                            Red
                          </Buton>
                        </div>
                      )}
                      
                      {proposal.user_voted && (
                        <div className="text-xs flex items-center text-textSecondary bg-surface/60 px-2 py-1 rounded-full">
                          <Vote size={12} className="mr-1 text-secondary" />
                          Oyunuz: <span className={`ml-1 font-medium ${proposal.user_choice ? 'text-green-400' : 'text-red-400'}`}>
                            {proposal.user_choice ? 'Onay' : 'Red'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Yeni Öneri Butonu */}
        <div className="mt-8 text-center">
          <Buton variant="primary" className="mx-auto flex items-center">
            <Vote size={16} className="mr-2" />
            Yeni Öneri Oluştur
            <ChevronRight size={16} className="ml-1" />
          </Buton>
          <p className="text-xs text-textSecondary mt-2">
            Öneri oluşturmak için en az 100 STARS tokene sahip olmalısınız
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dao; 