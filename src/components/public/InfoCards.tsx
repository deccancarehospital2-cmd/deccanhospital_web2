import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail } from 'lucide-react';
import { staggerContainerVariants, staggerItemVariants } from '../../animations/variants';
import { defaultViewport } from '../../animations/motionConfig';

export const InfoCards: React.FC = () => {
  return (
    <div className="container-custom -mt-7 sm:-mt-8 relative z-10">
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
      >
        {/* Card 1 */}
        <motion.div
          variants={staggerItemVariants}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 sm:p-6 rounded-[15px] shadow-info border border-brand-line flex items-start gap-3.5"
        >
          <div className="p-2.5 rounded-xl bg-brand-lightBlue text-brand-blue shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <b className="block text-brand-ink text-sm sm:text-base font-bold mb-1">
              📍 Convenient Location
            </b>
            <span className="text-xs sm:text-sm text-brand-muted leading-relaxed block">
              Near Quadri Chowk, Opp. Bharat Petrol Bunk, Sheikh Roza, Kalaburagi
            </span>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          variants={staggerItemVariants}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 sm:p-6 rounded-[15px] shadow-info border border-brand-line flex items-start gap-3.5"
        >
          <div className="p-2.5 rounded-xl bg-brand-lightBlue text-brand-blue shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <b className="block text-brand-ink text-sm sm:text-base font-bold mb-1">
              📞 Call the Hospital
            </b>
            <span className="text-xs sm:text-sm text-brand-muted leading-relaxed block">
              <a href="tel:+917411140480" className="hover:text-brand-blue font-medium">74111 40480</a>
              {' • '}
              <a href="tel:+918310365003" className="hover:text-brand-blue font-medium">83103 65003</a>
            </span>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div
          variants={staggerItemVariants}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 sm:p-6 rounded-[15px] shadow-info border border-brand-line flex items-start gap-3.5"
        >
          <div className="p-2.5 rounded-xl bg-brand-lightBlue text-brand-blue shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <b className="block text-brand-ink text-sm sm:text-base font-bold mb-1">
              ✉ Contact by Email
            </b>
            <span className="text-xs sm:text-sm text-brand-muted leading-relaxed block break-all">
              <a href="mailto:deccancarehospital.24ths@gmail.com" className="hover:text-brand-blue">
                deccancarehospital.24ths@gmail.com
              </a>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
