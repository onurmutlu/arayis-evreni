import React from 'react';
import SayfaBasligi from '../components/SayfaBasligi';
import { ShieldCheck } from 'lucide-react'; // Örnek ikon

const Dao: React.FC = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto pb-20">
      <SayfaBasligi title="DAO" icon={ShieldCheck} />
      <div className="text-center mt-8 text-textSecondary">
        Topluluk yönetimi ve DAO özellikleri yakında burada olacak!
      </div>
      {/* DAO ile ilgili bileşenler buraya gelecek */}
    </div>
  );
};

export default Dao; 