import React from 'react';
import { motion } from 'framer-motion';
import { Doctor } from '../../types/doctor';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { MedicalPlaceholder } from '../common/MedicalPlaceholder';
import { staggerItemVariants } from '../../animations/variants';

interface DoctorCardProps {
  doctor: Doctor;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const photoSrc = doctor.imageUrl || doctor.image;
  const avatarFallbackType = doctor.avatarType || (doctor.isSupportStaff ? 'femaleSupport' : 'doctor');

  return (
    <motion.article
      variants={staggerItemVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-white border border-brand-line rounded-card p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start shadow-card hover:shadow-brand transition-shadow duration-200"
    >
      {/* Photo / Medical Placeholder Container with subtle scale on hover */}
      <div className="w-[100px] h-[120px] sm:w-[120px] sm:h-[140px] rounded-[15px] bg-gradient-to-br from-[#e6f5fa] to-[#f8fcfd] border border-brand-line overflow-hidden shrink-0 flex items-center justify-center">
        {photoSrc ? (
          <ImageWithFallback
            src={photoSrc}
            alt={doctor.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            fallback={<MedicalPlaceholder type={avatarFallbackType} />}
          />
        ) : (
          <MedicalPlaceholder type={avatarFallbackType} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-brand-red font-extrabold text-xs sm:text-[13px] uppercase tracking-wide">
          {doctor.role}
        </div>
        <h4 className="font-serif text-xl sm:text-[22px] font-bold text-brand-ink mt-0.5 mb-1 leading-snug group-hover:text-brand-blue2 transition-colors">
          {doctor.name}
        </h4>

        {doctor.qualifications && (
          <p className="text-xs sm:text-sm text-brand-ink font-bold leading-relaxed mb-1">
            {doctor.qualifications}
            {doctor.experience && ` • ${doctor.experience}`}
          </p>
        )}

        {!doctor.qualifications && doctor.experience && (
          <p className="text-xs sm:text-sm text-brand-ink font-bold leading-relaxed mb-1">
            {doctor.experience}
          </p>
        )}

        {doctor.description && (
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed mt-2">
            {doctor.description}
          </p>
        )}
      </div>
    </motion.article>
  );
};
