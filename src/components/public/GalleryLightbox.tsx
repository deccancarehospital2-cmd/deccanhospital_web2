import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryItem } from '../../types/gallery';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import {
  lightboxBackdropVariants,
  lightboxContentVariants,
} from '../../animations/variants';

interface GalleryLightboxProps {
  isOpen: boolean;
  currentIndex: number;
  items: GalleryItem[];
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  isOpen,
  currentIndex,
  items,
  onClose,
  onNavigate,
}) => {
  const currentItem = items[currentIndex];

  const handlePrev = useCallback(() => {
    onNavigate((currentIndex - 1 + items.length) % items.length);
  }, [currentIndex, items.length, onNavigate]);

  const handleNext = useCallback(() => {
    onNavigate((currentIndex + 1) % items.length);
  }, [currentIndex, items.length, onNavigate]);

  // Keyboard navigation & body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentItem) return null;

  const altText = currentItem.alt || currentItem.altText || currentItem.caption;

  const modalFallback = (
    <div className="w-full h-64 sm:h-96 bg-gradient-to-br from-[#eaf5f9] to-[#f4fafd] flex flex-col items-center justify-center text-brand-blue2 p-6 text-center">
      <div className="p-4 bg-white/80 rounded-full shadow-sm mb-3 text-brand-blue">
        <ImageIcon className="w-8 h-8" />
      </div>
      <p className="text-sm font-semibold text-brand-ink mb-1">{currentItem.caption}</p>
      <span className="text-xs text-brand-muted">{currentItem.category || 'Hospital Facility'}</span>
    </div>
  );

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={`Gallery Image: ${currentItem.caption}`}
      >
        {/* Backdrop */}
        <motion.div
          variants={lightboxBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Container */}
        <motion.div
          variants={lightboxContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-brand-dark text-white border-b border-[#094c6d]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-badgeBg bg-brand-blue2/50 py-1 px-2.5 rounded-full">
                {currentItem.category || 'Hospital Gallery'}
              </span>
              <span className="text-xs text-gray-300">
                ({currentIndex + 1} of {items.length})
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close image lightbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Image Area */}
          <div className="relative flex-1 bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[65vh] overflow-hidden">
            <ImageWithFallback
              src={currentItem.imageUrl || currentItem.image}
              alt={altText}
              className="max-h-[65vh] w-auto max-w-full object-contain mx-auto"
              loading="eager"
              fallback={modalFallback}
            />

            {/* Previous Button */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Caption Footer */}
          <div className="p-4 sm:p-5 bg-white border-t border-brand-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="font-serif font-bold text-base sm:text-lg text-brand-ink m-0">
              {currentItem.caption}
            </p>
            <span className="text-xs text-brand-muted">
              Use arrow keys to navigate • Esc to close
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
