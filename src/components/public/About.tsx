import React from 'react';
import { motion } from 'framer-motion';
import {
  slideFromLeftVariants,
  slideFromRightVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from '../../animations/variants';
import { defaultViewport } from '../../animations/motionConfig';

export const About: React.FC = () => {
  const valuePoints = [
    'Maternity-focused care',
    'General healthcare',
    'Easy appointment request',
    'Accessible contact details',
  ];

  return (
    <section id="about" className="py-16 sm:py-20 bg-white border-y border-brand-line/60 overflow-hidden">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-center">
          {/* Left Highlight Box */}
          <motion.div
            variants={slideFromLeftVariants}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="bg-gradient-to-br from-[#e9f7fb] to-white border border-brand-line p-8 sm:p-10 rounded-3xl shadow-sm"
          >
            <div className="text-6xl sm:text-[70px] font-extrabold text-brand-blue leading-none mb-3">
              24×7
            </div>
            <h4 className="font-serif text-2xl font-bold text-brand-ink mb-2">
              Hospital contact
            </h4>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              For urgent medical situations, call the hospital directly at the numbers provided on the official letterhead.
            </p>
          </motion.div>

          {/* Right Text Content */}
          <motion.div
            variants={slideFromRightVariants}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            <span className="inline-block text-brand-blue2 font-extrabold tracking-wider uppercase text-xs bg-brand-badgeBg py-2 px-3.5 rounded-full mb-3">
              About Deccan Care
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl text-brand-ink font-bold leading-tight mb-4">
              Patient-focused care, close to home.
            </h3>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed mb-3">
              Deccan Care Maternity & General Hospital is located near Quadri Chowk in Sheikh Roza, Kalaburagi, Karnataka. The hospital’s identity combines maternity care with general hospital services.
            </p>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed mb-6">
              This website is designed to make it easy for patients and families to find services, contact the hospital and request an appointment.
            </p>

            {/* 4 Value Checkmarks with subtle stagger */}
            <motion.div
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
            >
              {valuePoints.map((point) => (
                <motion.div
                  key={point}
                  variants={staggerItemVariants}
                  className="flex items-center gap-2.5 text-sm font-semibold text-brand-ink"
                >
                  <span className="text-brand-red font-bold text-base select-none">✓</span>
                  <span>{point}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
