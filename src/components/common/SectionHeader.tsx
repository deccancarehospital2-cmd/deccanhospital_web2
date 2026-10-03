import React from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariants } from '../../animations/variants';
import { headerViewport } from '../../animations/motionConfig';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  className = '',
}) => {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={headerViewport}
      className={`text-center max-w-[730px] mx-auto mb-10 md:mb-12 ${className}`}
    >
      {eyebrow && (
        <span className="inline-block text-brand-blue2 font-extrabold tracking-wider uppercase text-xs bg-brand-badgeBg py-2 px-3.5 rounded-full mb-2">
          {eyebrow}
        </span>
      )}
      <h3 className="font-serif text-3xl sm:text-4xl text-brand-ink my-2 font-bold leading-tight">
        {title}
      </h3>
      {description && (
        <p className="text-brand-muted text-sm sm:text-base leading-relaxed mt-2.5">
          {description}
        </p>
      )}
    </motion.div>
  );
};
