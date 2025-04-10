import React from 'react';
import { LucideProps } from 'lucide-react';

interface SayfaBasligiProps {
  title: string;
  className?: string;
  icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}

const SayfaBasligi: React.FC<SayfaBasligiProps> = ({ title, className = '', icon: IconComponent }) => {
  return (
    <h1
      className={`text-2xl font-semibold text-text mb-6 flex items-center justify-center
                  bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent
                  ${className}`}>
      {IconComponent && <IconComponent size={24} className="mr-2 opacity-80" />}
      {title}
    </h1>
  );
};

export default SayfaBasligi; 