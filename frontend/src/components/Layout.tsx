import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-text font-sans">
      {/* Sayfa içeriği */}
      {/* Telegram Mini App'te genellikle header olmaz ama gerekirse buraya eklenebilir */}
      {/* <header>...</header> */}

      <main className="pb-20 pt-4 sm:pt-6"> {/* Üstten biraz boşluk */}
        {/* İçeriğin max genişliğini sınırlamak isteyebiliriz */}
        {/* <div className="max-w-screen-lg mx-auto px-4"> */} 
             <Outlet /> {/* Router içindeki Route'lar buraya render edilecek */} 
        {/* </div> */} 
      </main>

      {/* Alt Navigasyon */}
      <BottomNav />
    </div>
  );
};

export default Layout; 