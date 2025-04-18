import React from 'react';
import { LucideProps } from 'lucide-react';

interface SayfaBasligiProps {
  title: string;
  className?: string;
  icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}

const SayfaBasligi: React.FC<SayfaBasligiProps> = ({ title, className = '', icon: IconComponent }) => {
  return (
    <div className="relative mb-6">
      <h1
        className={`text-2xl font-bold text-text flex items-center justify-center
                    bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent
                    ${className}`}>
        {IconComponent && (
          <span className="inline-flex mr-3 p-2 rounded-full bg-primary/10 border border-primary/20">
            <IconComponent size={22} className="text-primary" />
          </span>
        )}
        {title}
      </h1>
      <div className="h-0.5 w-24 mx-auto mt-2 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-full"></div>
    </div>
  );
};

export default SayfaBasligi; 