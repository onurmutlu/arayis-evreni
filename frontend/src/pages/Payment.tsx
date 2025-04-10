import React, { useState } from 'react';
import { adminGrantStars } from '../utils/api';
import { 
  Wallet, 
  CreditCard, 
  Check, 
  X, 
  ExternalLink, 
  QrCode, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';

// Ödeme durumu için tip
type PaymentStatus = 'idle' | 'waiting' | 'success' | 'failed' | null;

// Sahte QR kod komponenti
const FakeQRCode: React.FC<{ payment: 'ton' | 'stripe' }> = ({ payment }) => {
  return (
    <div className="flex flex-col items-center justify-center border border-gray-300 rounded-lg p-4 w-64 h-64 mx-auto my-4">
      <QrCode className="w-32 h-32 text-gray-400 mb-2" />
      <p className="text-sm text-center text-gray-500">
        {payment === 'ton' 
          ? 'TON Wallet için QR kod (simülasyon)' 
          : 'Stripe ödeme için QR kod (simülasyon)'}
      </p>
    </div>
  );
};

// Sahte Stripe formu
const FakeStripeForm: React.FC = () => {
  return (
    <div className="border border-gray-300 rounded-lg p-4 mb-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Kart Numarası</label>
        <input
          type="text"
          placeholder="4242 4242 4242 4242"
          className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
          defaultValue="4242 4242 4242 4242"
        />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Son Kullanma</label>
          <input
            type="text"
            placeholder="MM/YY"
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
            defaultValue="12/25"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
          <input
            type="text"
            placeholder="123"
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
            defaultValue="123"
          />
        </div>
      </div>
    </div>
  );
};

const Payment: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'ton' | 'stripe' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);

  // Modal açma/kapama
  const openModal = () => setModalOpen(true);
  const closeModal = () => {
    if (paymentStatus !== 'waiting') {
      setModalOpen(false);
      setPaymentMethod(null);
      setPaymentStatus('idle');
      setErrorMessage(null);
    }
  };

  // Ödeme metodunu seçme
  const selectPaymentMethod = (method: 'ton' | 'stripe' | null) => {
    setPaymentMethod(method);
    // Eğer null ise modal kapanır, değilse seçilen ödeme yöntemi gösterilir
    if (method === null) {
      setModalOpen(false);
    }
  };

  // Stars ekleme API çağrısı
  const addStarsToUser = async (amount: number) => {
    try {
      console.log(`${amount} Stars kullanıcıya ekleniyor...`);
      // Gerçek API çağrısı - kullanıcı ID'si ve neden ekliyoruz
      await adminGrantStars(1, amount, 'payment');
      console.log(`${amount} Stars başarıyla eklendi!`);
      setPaymentStatus('success');
    } catch (err) {
      console.error('Stars eklenirken hata oluştu:', err);
      setPaymentStatus('failed');
      setErrorMessage('Stars eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  // Ödeme simülasyonu
  const simulatePayment = () => {
    setPaymentStatus('waiting');
    setErrorMessage(null);
    
    setTimeout(() => {
      // %80 başarı oranı
      if (Math.random() < 0.8) {
        // Başarılı ödeme
        setPaymentStatus('success');
        addStarsToUser(selectedAmount);
      } else {
        // Başarısız ödeme
        setPaymentStatus('failed');
        setErrorMessage('Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.');
      }
    }, 3000); // 3 saniye bekletme
  };

  // Durum gösterimi için stiller ve içerik
  const statusContent: Record<string, { icon: React.ReactNode; text: string; bgColor: string; textColor: string }> = {
    idle: {
      icon: <AlertCircle className="w-5 h-5 text-gray-500" />,
      text: 'Ödeme bekleniyor...',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700'
    },
    waiting: {
      icon: <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />,
      text: 'Ödeme işlemi bekleniyor...',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    success: {
      icon: <Check className="w-5 h-5 text-green-500" />,
      text: 'Ödeme başarıyla tamamlandı! 100 Stars hesabınıza eklendi.',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    failed: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      text: errorMessage || 'Ödeme işlemi başarısız oldu.',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Ödeme Sayfası</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">100 Stars</h2>
            <p className="text-gray-500 text-sm">Hesabınıza 100 Stars ekleyin</p>
          </div>
          <div className="text-xl font-bold">5 USDT</div>
        </div>
        
        <button
          onClick={openModal}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
        >
          Satın Al
        </button>
      </div>
      
      {/* Ödeme Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Ödeme Yap</h2>
              <button 
                onClick={closeModal}
                disabled={paymentStatus === 'waiting'}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {/* Ödeme Yöntemi Seçimi */}
              {paymentStatus === 'idle' && !paymentMethod && (
                <div>
                  <p className="text-gray-600 mb-4">Ödeme yöntemi seçin:</p>
                  
                  <button 
                    onClick={() => selectPaymentMethod('ton')}
                    className="w-full flex items-center justify-between border border-gray-300 rounded-lg p-3 mb-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <Wallet className="w-5 h-5 text-blue-500 mr-3" />
                      <span>TON Wallet</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  <button 
                    onClick={() => selectPaymentMethod('stripe')}
                    className="w-full flex items-center justify-between border border-gray-300 rounded-lg p-3 mb-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-purple-500 mr-3" />
                      <span>Kredi Kartı</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}
              
              {/* TON Wallet Ödeme */}
              {paymentStatus === 'idle' && paymentMethod === 'ton' && (
                <div>
                  <button 
                    onClick={() => selectPaymentMethod(null)} 
                    className="flex items-center text-blue-600 mb-4 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M19 12H5M12 19l-7-7 7-7"></path>
                    </svg>
                    Geri Dön
                  </button>
                  
                  <p className="text-gray-600 mb-2">TON Wallet QR Kodu:</p>
                  <FakeQRCode payment="ton" />
                  
                  <p className="text-sm text-gray-500 mb-4 text-center">
                    QR kodu TON Wallet uygulamasıyla tarayın
                  </p>
                  
                  <button
                    onClick={simulatePayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                  >
                    Ödemeyi Simüle Et
                  </button>
                </div>
              )}
              
              {/* Stripe Ödeme */}
              {paymentStatus === 'idle' && paymentMethod === 'stripe' && (
                <div>
                  <button 
                    onClick={() => selectPaymentMethod(null)} 
                    className="flex items-center text-blue-600 mb-4 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M19 12H5M12 19l-7-7 7-7"></path>
                    </svg>
                    Geri Dön
                  </button>
                  
                  <p className="text-gray-600 mb-2">Kart Bilgilerinizi Girin:</p>
                  <FakeStripeForm />
                  
                  <button
                    onClick={simulatePayment}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                  >
                    5 USDT Öde
                  </button>
                </div>
              )}
              
              {/* Ödeme Durumu */}
              {paymentStatus !== 'idle' && paymentStatus !== null && statusContent[paymentStatus] && (
                <div className={`${statusContent[paymentStatus].bgColor} ${statusContent[paymentStatus].textColor} p-4 rounded-lg flex items-center`}>
                  {statusContent[paymentStatus].icon}
                  <span className="ml-2">{statusContent[paymentStatus].text}</span>
                </div>
              )}
              
              {/* Başarılı ödeme sonrası buton */}
              {paymentStatus === 'success' && (
                <button
                  onClick={closeModal}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 mt-4"
                >
                  Tamam
                </button>
              )}
              
              {/* Başarısız ödeme sonrası buton */}
              {paymentStatus === 'failed' && (
                <button
                  onClick={() => setPaymentStatus('idle')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 mt-4"
                >
                  Tekrar Dene
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment; 