import React from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../common/SectionHeader';
import { ServiceCard } from './ServiceCard';
import { servicesData } from '../../data/services';
import { staggerContainerVariants } from '../../animations/variants';
import { defaultViewport } from '../../animations/motionConfig';

export const Services: React.FC = () => {
  return (
    <section id="services" className="py-16 sm:py-20 bg-brand-bg">
      <div className="container-custom">
        <SectionHeader
          eyebrow="Healthcare Services"
          title="Medical services for your family"
          description="The following service categories are prepared as website content and should be confirmed by the hospital before publishing."
        />

        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {servicesData.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
