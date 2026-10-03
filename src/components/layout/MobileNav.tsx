import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../common/Button';
import { X, Phone } from 'lucide-react';
import { lightboxBackdropVariants } from '../../animations/variants';

interface NavLinkItem {
  name: string;
  href: string;
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLinkItem[];
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  navLinks,
}) => {
  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          {/* Backdrop */}
          <motion.div
            variants={lightboxBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl p-6 flex flex-col justify-between z-10"
          >
            <div>
              {/* Header with brand and close button */}
              <div className="flex items-center justify-between pb-6 border-b border-brand-line">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-[#2786aa] rounded-full flex items-center justify-center text-brand-red font-extrabold text-xl relative">
                    +
                  </div>
                  <div>
                    <span className="font-serif font-bold text-lg text-brand-blue2 block leading-none">Deccan Care</span>
                    <span className="text-[9px] text-gray-500 font-semibold tracking-wider block mt-1">MATERNITY & GENERAL</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-brand-muted hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-lg"
                  aria-label="Close navigation menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="mt-6 flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={onClose}
                    className="text-base font-semibold text-brand-ink hover:text-brand-blue py-2.5 px-3 rounded-lg hover:bg-brand-bg transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </nav>
            </div>

            {/* Footer actions inside mobile menu */}
            <div className="pt-6 border-t border-brand-line space-y-3">
              <Button
                href="tel:+917411140480"
                variant="cta"
                className="w-full flex items-center justify-center gap-2 py-3 font-bold"
                onClick={onClose}
              >
                <Phone className="w-4 h-4" />
                Call Now (74111 40480)
              </Button>
              <div className="text-center text-xs text-brand-muted">
                Kalaburagi, Karnataka • 24×7
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
