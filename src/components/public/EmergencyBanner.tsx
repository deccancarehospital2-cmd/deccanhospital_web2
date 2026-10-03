import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import { PhoneCall } from 'lucide-react';
import { fadeUpVariants } from '../../animations/variants';
import { defaultViewport } from '../../animations/motionConfig';

export const EmergencyBanner: React.FC = () => {
  return (
    <section className="bg-brand-dark text-white py-12 sm:py-14 border-y border-[#094c6d] overflow-hidden" aria-label="Emergency Contact Banner">
      <div className="container-custom">
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8"
        >
          <div>
            <h3 className="font-serif text-3xl sm:text-[38px] font-bold text-white mb-2 leading-tight">
              Need medical assistance?
            </h3>
            <p className="text-sm sm:text-base text-[#cfe4ec] m-0">
              For emergencies or urgent concerns, contact the hospital directly.
            </p>
          </div>
          <Button
            href="tel:+917411140480"
            variant="danger"
            className="flex items-center gap-2 shrink-0 py-3.5 px-6 font-bold"
          >
            <PhoneCall className="w-5 h-5" />
            Call 74111 40480
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
