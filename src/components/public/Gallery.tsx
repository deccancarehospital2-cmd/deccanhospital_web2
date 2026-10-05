import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../common/SectionHeader';
import { GalleryCard } from './GalleryCard';
import { GalleryLightbox } from './GalleryLightbox';
import { usePublicGallery } from '../../hooks/usePublicGallery';
import { staggerContainerVariants } from '../../animations/variants';
import { defaultViewport } from '../../animations/motionConfig';
import { Image as ImageIcon } from 'lucide-react';

export const Gallery: React.FC = () => {
  const { galleryItems, isLoading, isEmpty } = usePublicGallery();
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  return (
    <section id="gallery" className="py-16 sm:py-20 bg-white border-b border-brand-line/60">
      <div className="container-custom">
        <SectionHeader
          eyebrow="Hospital Gallery"
          title="Clinical care & hospital activity"
          description="Photos supplied for the hospital website showing clinical procedures, diagnostic imaging and medical care."
        />

        {/* Loading Skeleton Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Loading hospital gallery">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white border border-brand-line rounded-subcard overflow-hidden shadow-card animate-pulse flex flex-col justify-between"
              >
                <div className="w-full h-48 sm:h-56 bg-slate-100" />
                <div className="p-3.5 sm:p-4 border-t border-brand-line/60 bg-white">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          /* Empty / Updating State */
          <div className="bg-white border border-brand-line rounded-card p-8 sm:p-12 text-center shadow-card max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-brand-lightBlue text-brand-blue flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-ink mb-1">
              Gallery Photographs Being Updated
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Our hospital activity, clinical facilities, and procedure photography are currently being updated.
            </p>
          </div>
        ) : (
          /* Active Gallery Grid */
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {galleryItems.map((item, index) => (
              <GalleryCard
                key={item.id}
                item={item}
                onClick={() => setActiveLightboxIndex(index)}
              />
            ))}
          </motion.div>
        )}

        {/* Lightbox Modal with dynamic items */}
        {galleryItems.length > 0 && (
          <GalleryLightbox
            isOpen={activeLightboxIndex !== null}
            currentIndex={activeLightboxIndex ?? 0}
            items={galleryItems}
            onClose={() => setActiveLightboxIndex(null)}
            onNavigate={(newIndex) => setActiveLightboxIndex(newIndex)}
          />
        )}
      </div>
    </section>
  );
};
