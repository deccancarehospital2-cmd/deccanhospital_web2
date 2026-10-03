import React from 'react';
import { motion } from 'framer-motion';
import { Service } from '../../types/service';
import { staggerItemVariants } from '../../animations/variants';
import {
  HeartPulse,
  Baby,
  Smile,
  Bone,
  Stethoscope,
  Scissors,
  Droplets,
  Ear,
  Heart,
  Sparkles,
  Pill,
  Activity,
  Microscope,
  Ambulance,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface ServiceCardProps {
  service: Service;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const getIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6 text-brand-blue2 group-hover:text-brand-blue transition-colors' };
    switch (iconName) {
      case 'heart-pulse':
        return <HeartPulse {...props} />;
      case 'baby':
        return <Baby {...props} />;
      case 'smile':
        return <Smile {...props} />;
      case 'bone':
        return <Bone {...props} />;
      case 'stethoscope':
        return <Stethoscope {...props} />;
      case 'scissors':
        return <Scissors {...props} />;
      case 'droplets':
        return <Droplets {...props} />;
      case 'ear':
        return <Ear {...props} />;
      case 'heart':
        return <Heart {...props} />;
      case 'sparkles':
        return <Sparkles {...props} />;
      case 'pill':
        return <Pill {...props} />;
      case 'activity':
        return <Activity {...props} />;
      case 'microscope':
        return <Microscope {...props} />;
      case 'ambulance':
        return <Ambulance {...props} />;
      case 'check-circle-2':
        return <CheckCircle2 {...props} />;
      default:
        return <HelpCircle {...props} />;
    }
  };

  return (
    <motion.article
      variants={staggerItemVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-white p-6 sm:p-7 rounded-subcard border border-brand-line shadow-card hover:shadow-brand transition-shadow duration-200 flex flex-col justify-start"
    >
      <div
        className="w-12 h-12 rounded-[13px] bg-[#eaf7fb] group-hover:bg-[#dff2f8] flex items-center justify-center mb-4 shrink-0 transition-colors duration-200"
        aria-hidden="true"
      >
        {getIcon(service.iconName)}
      </div>
      <h4 className="text-base sm:text-lg font-bold text-brand-ink mb-2 leading-snug group-hover:text-brand-blue2 transition-colors">
        {service.title}
      </h4>
      <p className="text-sm text-brand-muted leading-relaxed">
        {service.description}
      </p>
    </motion.article>
  );
};
