import React from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';
import {
  HOSPITAL_PHONE_PRIMARY,
  HOSPITAL_PHONE_SECONDARY,
  HOSPITAL_EMAIL,
  HOSPITAL_MAPS_LINK,
  HOSPITAL_WHATSAPP_LINK,
} from '../../utils/appointmentHelper';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { staggerContainerVariants, staggerItemVariants } from '../../animations/variants';
import { defaultViewport } from '../../animations/motionConfig';

export const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-16 sm:py-20 bg-white border-t border-brand-line/60 overflow-hidden">
      <div className="container-custom">
        <SectionHeader eyebrow="Contact" title="Visit or contact us" />

        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8 items-stretch"
        >
          {/* Hospital Contact Details Card */}
          <motion.div
            variants={staggerItemVariants}
            className="p-7 sm:p-8 border border-brand-line rounded-card flex flex-col justify-between shadow-card bg-white"
          >
            <div>
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-brand-ink mb-5">
                Deccan Care Maternity & General Hospital
              </h4>

              {/* Address */}
              <div className="my-4">
                <b className="block text-sm font-bold text-brand-ink mb-0.5">Address</b>
                <span className="text-sm text-brand-muted leading-relaxed">
                  Near Quadri Chowk, Opp. Bharat Petrol Bunk, Sheikh Roza, Kalaburagi, Karnataka – 585101
                </span>
              </div>

              {/* Phone Numbers */}
              <div className="my-4">
                <b className="block text-sm font-bold text-brand-ink mb-0.5">Phone</b>
                <span className="text-sm text-brand-muted leading-relaxed block">
                  <a
                    href={`tel:${HOSPITAL_PHONE_PRIMARY}`}
                    className="hover:text-brand-blue font-medium block"
                  >
                    74111 40480
                  </a>
                  <a
                    href={`tel:${HOSPITAL_PHONE_SECONDARY}`}
                    className="hover:text-brand-blue font-medium block mt-0.5"
                  >
                    83103 65003
                  </a>
                </span>
              </div>

              {/* Email */}
              <div className="my-4">
                <b className="block text-sm font-bold text-brand-ink mb-0.5">Email</b>
                <span className="text-sm text-brand-muted leading-relaxed block break-all">
                  <a
                    href={`mailto:${HOSPITAL_EMAIL}`}
                    className="hover:text-brand-blue font-medium"
                  >
                    {HOSPITAL_EMAIL}
                  </a>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-brand-line/60">
              <Button
                href={HOSPITAL_MAPS_LINK}
                target="_blank"
                variant="primary"
                className="flex items-center gap-2 text-sm py-3 px-4.5"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                href={HOSPITAL_WHATSAPP_LINK}
                target="_blank"
                variant="alt"
                className="flex items-center gap-2 text-sm py-3 px-4.5"
              >
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span>WhatsApp</span>
              </Button>
            </div>
          </motion.div>

          {/* Map Location Card */}
          <motion.div
            variants={staggerItemVariants}
            className="min-h-[320px] rounded-card bg-gradient-to-br from-[#dff2f8] to-[#f8fcfd] border border-brand-line p-8 flex flex-col items-center justify-center text-center shadow-card"
          >
            <div className="text-5xl mb-3 select-none" aria-hidden="true">
              📍
            </div>
            <h4 className="font-serif text-xl sm:text-2xl font-bold text-brand-ink mb-2">
              Sheikh Roza, Kalaburagi
            </h4>
            <p className="text-sm text-brand-muted leading-relaxed max-w-sm mb-6">
              Near Quadri Chowk, Opp. Bharat Petrol Bunk
              <br />
              Kalaburagi, Karnataka – 585101
            </p>
            <Button
              href={HOSPITAL_MAPS_LINK}
              target="_blank"
              variant="primary"
              className="flex items-center gap-2"
            >
              <span>Get Directions</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
