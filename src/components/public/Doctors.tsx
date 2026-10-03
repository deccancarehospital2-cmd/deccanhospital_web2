import React from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../common/SectionHeader';
import { DoctorCard } from './DoctorCard';
import { usePublicDoctors } from '../../hooks/usePublicDoctors';
import { staggerContainerVariants, fadeUpVariants } from '../../animations/variants';
import { defaultViewport } from '../../animations/motionConfig';
import { UserCheck } from 'lucide-react';

export const Doctors: React.FC = () => {
  const { doctors, isLoading, isEmpty } = usePublicDoctors();

  return (
    <section id="doctors" className="py-16 sm:py-20 bg-brand-bg">
      <div className="container-custom">
        <SectionHeader
          eyebrow="Medical Team"
          title="Our Doctors & Patient Support Team"
          description="Meet the doctors and patient-support professionals associated with Deccan Care Maternity & General Hospital. Doctor qualifications below are transcribed from the hospital brochure provided for this website, alongside the hospital’s patient-support and physiotherapy team."
        />

        {/* Loading Skeleton State */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6" aria-label="Loading medical team">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white border border-brand-line rounded-card p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start shadow-card animate-pulse"
              >
                <div className="w-[100px] h-[120px] sm:w-[120px] sm:h-[140px] rounded-[15px] bg-slate-100 shrink-0" />
                <div className="flex-1 w-full space-y-2.5">
                  <div className="h-3 bg-red-100 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                  <div className="h-3.5 bg-slate-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          /* Empty / Updating State */
          <div className="bg-white border border-brand-line rounded-card p-8 sm:p-12 text-center shadow-card max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-brand-lightBlue text-brand-blue flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-ink mb-1">
              Doctor Information Being Updated
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Our medical consultant directory is currently being updated. For doctor schedules, OPD timings, or emergency assistance, please contact our hospital front desk.
            </p>
          </div>
        ) : (
          /* Active Doctors Grid */
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6"
          >
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </motion.div>
        )}

        {/* Website Information / Verification Note */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="mt-8 bg-[#f3fafc] border-l-4 border-brand-blue p-4 sm:p-5 rounded-lg text-brand-muted text-xs sm:text-[13px] leading-relaxed"
        >
          <b className="text-brand-ink">Website information note: </b>
          Doctor names and qualifications shown above are based on the hospital brochure supplied by the hospital. Consultation timings, registration numbers, exact roles and availability should be confirmed by the hospital before publication. Patient-support staff do not diagnose, prescribe or change medicines; medication guidance should follow the treating doctor’s prescription and instructions.
        </motion.div>
      </div>
    </section>
  );
};
