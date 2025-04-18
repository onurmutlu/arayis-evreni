import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-text font-sans">
      {/* Logo ve Header */}
      <header className="flex justify-center py-4">
        <Link to="/" className="flex flex-col items-center">
          <img src="/assets/logo.svg" alt="Arayış Evreni Logo" className="w-16 h-16 drop-shadow-lg filter brightness-110" />
          <span className="mt-1 text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Arayış Evreni</span>
        </Link>
      </header>

      <main className="pb-20 pt-2"> {/* Üstten az boşluk çünkü logo header var */}
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