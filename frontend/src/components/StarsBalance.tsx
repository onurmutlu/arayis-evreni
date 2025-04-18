import React from 'react';
import { Link } from 'react-router-dom'; // Sayfa yönlendirmesi için
import Buton from './Buton';
import { Wallet } from 'lucide-react'; // Wallet ikonu ekliyorum

interface StarsBalanceProps {
  balance: number;
  showAddButton?: boolean;
  className?: string;
}

const StarsBalance: React.FC<StarsBalanceProps> = ({ balance, showAddButton = true, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 p-2 bg-card-gradient rounded-lg shadow-md card-glow ${className}`}>
      <span className="text-xl text-amber-400">⭐</span>
      <span className="font-semibold text-lg text-text">{balance.toLocaleString()}</span>
      <span className="text-sm text-textSecondary mr-auto">Stars</span>
      {showAddButton && (
        <Link to="/wallet"> {/* Wallet sayfasına yönlendir */}
          <Buton size="sm" variant="secondary" className="ml-2 flex items-center">
            <Wallet size={14} className="mr-1" />
            Cüzdan
          </Buton>
        </Link>
      )}
    </div>
  );
};

export default StarsBalance; 