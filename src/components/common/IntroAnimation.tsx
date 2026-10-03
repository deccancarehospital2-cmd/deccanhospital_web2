import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  introContainerVariants,
  introLogoVariants,
  introTextVariants,
  introSubVariants,
} from '../../animations/variants';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user already saw the intro in this session
    const hasSeen = sessionStorage.getItem('deccan_intro_seen');
    if (hasSeen) {
      setIsVisible(false);
      onComplete();
      return;
    }

    // Run intro sequence for 1.4s total then fade out
    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('deccan_intro_seen', 'true');
      setTimeout(onComplete, 400); // Trigger completion as exit animation completes
    }, 1400);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="intro-screen"
          variants={introContainerVariants}
          initial="initial"
          exit="exit"
          className="fixed inset-0 z-[100] bg-gradient-to-br from-[#e8f6fb] via-[#f5fafc] to-white flex flex-col items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center text-center p-6">
            {/* Medical Cross Logo */}
            <motion.div
              variants={introLogoVariants}
              initial="initial"
              animate="animate"
              className="w-16 h-16 sm:w-20 sm:h-20 border-[3.5px] border-[#2786aa] rounded-full flex items-center justify-center text-brand-red font-extrabold text-3xl sm:text-4xl shadow-card bg-white mb-4"
            >
              +
            </motion.div>

            {/* Brand Title */}
            <motion.h1
              variants={introTextVariants}
              initial="initial"
              animate="animate"
              className="font-serif font-bold text-2xl sm:text-3xl text-brand-blue2 leading-tight"
            >
              Deccan Care
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={introSubVariants}
              initial="initial"
              animate="animate"
              className="text-[10px] sm:text-xs font-bold text-[#657782] tracking-[0.2em] uppercase mt-1"
            >
              MATERNITY & GENERAL HOSPITAL
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
