import React from 'react';
import Buton from './Buton';

interface VIPLockProps {
  cost: number; // Kilidi açma bedeli (Stars)
  onUnlock: () => Promise<void>; // Kilit açma fonksiyonu
  isUnlocking?: boolean;
  className?: string;
  message?: string; // Kilit mesajı
}

const VIPLock: React.FC<VIPLockProps> = ({
  cost,
  onUnlock,
  isUnlocking = false,
  className = '',
  message = 'Bu içeriğe erişmek için kilidi açmalısınız.'
}) => {
  return (
    <div className={`relative p-6 border-2 border-dashed border-amber-500/50 rounded-lg bg-surface/50 text-center backdrop-blur-sm ${className}`}>
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-surface px-2">
        <span className="text-2xl" role="img" aria-label="lock">🔒</span>
      </div>
      <p className="text-textSecondary mb-4">{message}</p>
      <Buton
        variant="primary"
        onClick={onUnlock}
        isLoading={isUnlocking}
        disabled={isUnlocking}
        className="bg-gradient-to-r from-amber-500 to-primary hover:from-amber-600 hover:to-primary/90"
      >
        {isUnlocking ? 'Açılıyor...' : `Kilidi Aç (${cost} ⭐)`}
      </Buton>
    </div>
  );
};

export default VIPLock; 