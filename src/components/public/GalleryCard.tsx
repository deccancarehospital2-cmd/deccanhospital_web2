import React from 'react';
import { motion } from 'framer-motion';
import { GalleryItem } from '../../types/gallery';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ImageIcon, ZoomIn } from 'lucide-react';
import { staggerItemVariants } from '../../animations/variants';

interface GalleryCardProps {
  item: GalleryItem;
  onClick: () => void;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ item, onClick }) => {
  const altText = item.alt || item.altText || item.caption;

  const fallbackPlaceholder = (
    <div
      className="w-full h-48 sm:h-56 bg-gradient-to-br from-[#eaf5f9] to-[#f4fafd] flex flex-col items-center justify-center text-brand-blue2 p-4 text-center"
      aria-label={altText}
    >
      <div className="p-3 bg-white/80 rounded-full shadow-sm mb-2 text-brand-blue">
        <ImageIcon className="w-6 h-6" />
      </div>
      <span className="text-xs font-semibold text-brand-muted line-clamp-1">
        {item.category || 'Hospital Facility'}
      </span>
    </div>
  );

  return (
    <motion.figure
      variants={staggerItemVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group m-0 bg-white border border-brand-line rounded-subcard overflow-hidden shadow-card hover:shadow-brand transition-shadow duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      tabIndex={0}
      role="button"
      aria-label={`View larger image of ${item.caption}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="relative w-full h-48 sm:h-56 bg-slate-100 overflow-hidden">
        <ImageWithFallback
          src={item.imageUrl || item.image}
          alt={altText}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallback={fallbackPlaceholder}
        />
        {/* Subtle hover overlay with zoom icon */}
        <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="p-2.5 bg-white/90 rounded-full text-brand-blue shadow-md scale-90 group-hover:scale-100 transition-transform duration-200">
            <ZoomIn className="w-5 h-5" />
          </div>
        </div>
      </div>
      <figcaption className="p-3.5 sm:p-4 font-bold text-xs sm:text-sm text-brand-ink border-t border-brand-line/60 bg-white group-hover:text-brand-blue2 transition-colors">
        {item.caption}
      </figcaption>
    </motion.figure>
  );
};
