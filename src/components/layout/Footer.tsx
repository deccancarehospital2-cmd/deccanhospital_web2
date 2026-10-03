import React from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariants } from '../../animations/variants';
import { defaultViewport } from '../../animations/motionConfig';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-[#d8eaf0] py-9 border-t border-[#094c6d] overflow-hidden">
      <div className="container-custom">
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left"
        >
          <div>
            <div className="text-white font-serif text-xl font-bold">
              Deccan Care Maternity & General Hospital
            </div>
            <div className="text-xs text-[#a9c5cf] mt-1">
              Near Quadri Chowk • Sheikh Roza • Kalaburagi, Karnataka – 585101
            </div>
          </div>
          <div className="text-xs text-[#a9c5cf]">
            © {currentYear} Deccan Care Hospital. All rights reserved.
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
