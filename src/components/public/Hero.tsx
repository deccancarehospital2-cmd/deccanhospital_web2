import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import {
  fadeUpVariants,
  scaleInVariants,
  staggerContainerVariants,
} from '../../animations/variants';

export const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-[#e8f6fb] via-[#f4fbfe] to-white py-14 md:py-20 overflow-hidden border-b border-brand-line/50">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-center">
          {/* Left Column with Staggered Entrance */}
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start"
          >
            <motion.span
              variants={fadeUpVariants}
              className="inline-block text-brand-blue2 font-extrabold tracking-wider uppercase text-xs bg-brand-badgeBg py-2 px-3.5 rounded-full"
            >
              Compassionate healthcare in Kalaburagi
            </motion.span>

            <motion.h2
              variants={fadeUpVariants}
              className="font-serif text-4xl sm:text-5xl lg:text-[58px] leading-[1.08] my-4 sm:my-5 text-[#12394d] font-bold"
            >
              Care for every stage of life.
            </motion.h2>

            <motion.p
              variants={fadeUpVariants}
              className="text-base sm:text-lg text-brand-muted max-w-[650px] leading-relaxed"
            >
              Deccan Care Maternity & General Hospital provides maternity-focused and general healthcare in a patient-friendly environment, with convenient access to medical support for families.
            </motion.p>

            <motion.div
              variants={fadeUpVariants}
              className="flex flex-wrap gap-3.5 mt-7"
            >
              <Button href="#appointment" variant="primary">
                Book an Appointment
              </Button>
              <Button href="tel:+917411140480" variant="alt">
                Call 74111 40480
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Column / Hero Card */}
          <motion.div
            variants={scaleInVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.25 }}
            className="bg-white rounded-3xl p-7 sm:p-8 shadow-brand border border-[#e1eef2] transition-shadow duration-300 hover:shadow-2xl"
          >
            <div
              className="w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-2xl bg-[#edf8fb] flex items-center justify-center text-brand-red text-3xl sm:text-4xl font-extrabold mb-5"
              aria-hidden="true"
            >
              +
            </div>
            <h3 className="font-serif text-2xl sm:text-[28px] font-bold text-brand-ink mb-3 leading-snug">
              Mother & Family Care
            </h3>
            <p className="text-sm sm:text-[15px] text-brand-muted leading-relaxed mb-6">
              Dedicated maternity and women’s healthcare alongside general medical services. Contact the hospital to discuss your care needs and appointment options.
            </p>
            <Button href="#services" variant="primary" className="w-full sm:w-auto">
              Explore Services
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
