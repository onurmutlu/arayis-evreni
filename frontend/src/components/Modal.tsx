import React from 'react';
import Buton from './Buton'; // Buton import edildi (kapatma için kullanılmasa da ileride gerekebilir)

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Modal dışına tıklayınca kapatma
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    // Portal kullanmak genellikle daha iyi bir pratiktir, ama basitlik için şimdilik doğrudan render edelim.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in animate-duration-200ms animate-ease-out" // UnoCSS fade-in
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-surface rounded-lg shadow-2xl w-full ${sizeClasses[size]} flex flex-col max-h-[85vh] overflow-hidden
                   transform transition-transform animate-zoom-in animate-duration-300ms animate-ease-out`} // UnoCSS zoom-in (scale+opacity)
        onClick={(e) => e.stopPropagation()} // İçeriğe tıklayınca kapanmasını engelle
      >
        {/* Modal Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
            <h3 className="text-lg font-semibold text-text">{title}</h3>
            <button
              onClick={onClose}
              className="text-textSecondary hover:text-text transition-colors p-1 -mr-1 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Kapat"
            >
              {/* X ikonu (Inline SVG) */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-grow">
          {children}
        </div>

        {/* Modal Footer (Opsiyonel) */}

      </div>
    </div>
  );
};

export default Modal;

// Not: UnoCSS preset-uno animasyonları otomatik olarak sağlar.
// Özel keyframes gerekmez. 