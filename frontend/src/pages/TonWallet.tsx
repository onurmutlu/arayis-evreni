import React, { useState } from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import Buton from '../components/Buton';
import { Wallet, Zap, Loader2, CheckCircle } from 'lucide-react'; // İkonları ekleyelim
import { Copy } from 'lucide-react'; // Kopyalama ikonu

// Basit bir modal bileşeni (örnek)
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-card rounded-lg shadow-xl p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-text">{title}</h2>
          <button onClick={onClose} className="text-textSecondary hover:text-text">&times;</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

const TonWallet: React.FC = () => {
  // Varsayılan TON cüzdan adresi (gerçek entegrasyon yakında eklenecek)
  const walletAddress = 'EQCDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY_';
  // Mock TON Bakiyesi
  const [balance] = useState<number>(12.345); // Örnek bakiye
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [mintSuccess, setMintSuccess] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleMint = async () => {
    setIsMinting(true);
    setMintSuccess(false);
    setIsModalOpen(true); // Modalı aç

    // Mint işlemini simüle et (örneğin 3 saniye)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simülasyon sonucu (başarılı varsayalım)
    setIsMinting(false);
    setMintSuccess(true);

    // Başarı mesajından sonra modalı kapatmak için birkaç saniye bekle
    setTimeout(() => {
        closeModal();
    }, 2000);

    // Gerçek TON blockchain entegrasyonu yakında eklenecek
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Modal kapanırken state'leri sıfırla
    setIsMinting(false);
    setMintSuccess(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // 1.5 saniye sonra 'Kopyalandı' durumunu sıfırla
    });
  };

  return (
    <div className="p-4 max-w-md mx-auto pb-20">
      <SayfaBasligi title="TON Cüzdanı" icon={Wallet} />

      <div className="mt-6 bg-card border border-border rounded-lg p-5 shadow-md">
        <div className="mb-4">
          <label className="block text-xs font-medium text-textSecondary mb-1">Cüzdan Adresiniz</label>
          <div className="flex items-center justify-between bg-background p-2 rounded border border-border">
            <span className="text-sm text-text font-mono truncate mr-2" title={walletAddress}>
              {walletAddress}
            </span>
            <button onClick={copyAddress} className="text-primary hover:text-primary/80 p-1 rounded" title="Adresi Kopyala">
                {copied ? <CheckCircle size={16} className="text-success"/> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-textSecondary mb-1">TON Bakiyeniz</label>
          <p className="text-2xl font-bold text-primary">{balance.toFixed(3)} TON</p>
        </div>

        {/* Şimdilik sadece bir NFT mint etmek için buton varsayalım */}
        <Buton
          onClick={handleMint}
          disabled={isMinting || mintSuccess} // Mint işlemi sırasında veya başarılı olunca devre dışı
          variant="primary"
          className="w-full flex items-center justify-center"
        >
          {isMinting ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Mint İşlemi Sürüyor...
            </>
          ) : mintSuccess ? (
              <>
                  <CheckCircle size={18} className="mr-2" />
                  Başarıyla Mint Edildi!
              </>
          ) : (
            <>
              <Zap size={18} className="mr-2" />
              Seçili NFT'yi TON'a Mint Et
            </>
          )
          }
        </Buton>
        <p className="text-xs text-textSecondary mt-2 text-center">Bu işlem ağ yoğunluğuna göre biraz zaman alabilir.</p>
      </div>

      {/* Mint Simülasyon Modalı */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="TON Mint İşlemi">
          {isMinting && (
              <div className="text-center py-4">
                  <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4"/>
                  <p className="text-textSecondary">NFT'niz TON ağına mint ediliyor...</p>
                  <p className="text-xs text-textSecondary mt-2">Lütfen bekleyin ve sayfayı kapatmayın.</p>
              </div>
          )}
          {mintSuccess && (
              <div className="text-center py-4">
                  <CheckCircle size={40} className="text-success mx-auto mb-4"/>
                  <p className="text-lg font-medium text-text">Mint Başarılı!</p>
                  <p className="text-textSecondary mt-1">NFT'niz artık TON cüzdanınızda.</p>
              </div>
          )}
          {/* Hata durumu da eklenebilir */}
      </Modal>

    </div>
  );
};

export default TonWallet; 