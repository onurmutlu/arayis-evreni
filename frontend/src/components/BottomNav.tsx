import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Swords, Gem, ShieldCheck, Trophy, Bell, User } from 'lucide-react'; // İkonlar

const navItems = [
  { path: '/profil', label: 'Profil', icon: User },
  { path: '/gorevler', label: 'Görevler', icon: Swords },
  { path: '/galeri', label: 'Galeri', icon: Gem },
  { path: '/dao', label: 'DAO', icon: ShieldCheck },
  { path: '/leaderboard', label: 'Sıralama', icon: Trophy },
  { path: '/bildirimler', label: 'Bildirimler', icon: Bell },
  // Diğer sayfalar eklenebilir (Wallet, VIP, Claim vb.)
];

const BottomNav: React.FC = () => {
  const activeClass = 'text-primary scale-110'; // Aktif link stili
  const inactiveClass = 'text-textSecondary hover:text-text'; // Pasif link stili

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-md border-t border-white/10 shadow-top-lg z-40">
      <div className="flex justify-around items-center h-full max-w-md mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            // end prop'u sadece ana sayfa (/) linki için gerekebilir, diğerleri için genelde gerekmez.
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-center px-2 pt-1 transition-all duration-200 ${isActive ? activeClass : inactiveClass}`
            }
          >
            <item.icon size={22} strokeWidth={1.75} />
            <span className="text-xs mt-0.5 font-medium">{item.label}</span> {/* font-medium eklendi */}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav; 