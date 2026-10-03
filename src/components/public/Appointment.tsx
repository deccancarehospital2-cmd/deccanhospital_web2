import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';
import { usePublicDoctors } from '../../hooks/usePublicDoctors';
import { DoctorSlot, Appointment as AppointmentType } from '../../types/appointment';
import {
  fetchSlotsForDoctorAndDate,
  bookAppointmentAtomic,
} from '../../services/firestore';
import { fadeUpVariants } from '../../animations/variants';
import { defaultViewport } from '../../animations/motionConfig';
import {
  Clock,
  AlertCircle,
  Check,
  RotateCcw,
} from 'lucide-react';

const DEPARTMENTS = [
  'Obstetrics & Gynaecology',
  'General Medicine',
  'General Surgery',
  'Pediatrics',
  'Orthopaedics',
  'Cardiology',
  'Urology',
  'ENT',
  'Dental',
  'Other',
];

export const Appointment: React.FC = () => {
  const { doctors, isLoading: isLoadingDoctors } = usePublicDoctors();

  // Clinical doctors list
  const clinicalDoctors = useMemo(() => {
    const list = doctors.filter((d) => !d.isSupportStaff);
    return list.length > 0 ? list : doctors;
  }, [doctors]);

  // Form Fields
  const [department, setDepartment] = useState<string>('Obstetrics & Gynaecology');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<DoctorSlot | null>(null);

  // Patient Fields
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [patientMessage, setPatientMessage] = useState<string>('');

  // Slots State
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success State
  const [submittedAppointment, setSubmittedAppointment] = useState<AppointmentType | null>(null);

  // Auto-select doctor when department changes or doctors load
  useEffect(() => {
    if (clinicalDoctors.length === 0) return;

    // Try to find a doctor in this department
    const matching = clinicalDoctors.filter((d) => {
      const role = (d.role || '').toLowerCase();
      if (department.includes('Gynaecology') && (role.includes('gyn') || role.includes('obg'))) return true;
      if (department.includes('Medicine') && role.includes('med')) return true;
      if (department.includes('Surgery') && role.includes('surg')) return true;
      if (department.includes('Pediatrics') && (role.includes('ped') || role.includes('peds'))) return true;
      if (department.includes('Orthopaedics') && role.includes('ortho')) return true;
      if (department.includes('Urology') && role.includes('uro')) return true;
      if (department.includes('ENT') && role.includes('ent')) return true;
      return false;
    });

    if (matching.length > 0) {
      setSelectedDoctorId(matching[0].id);
    } else if (clinicalDoctors.length > 0) {
      setSelectedDoctorId(clinicalDoctors[0].id);
    }
  }, [department, clinicalDoctors]);

  const selectedDoctor = useMemo(() => {
    return clinicalDoctors.find((d) => d.id === selectedDoctorId);
  }, [clinicalDoctors, selectedDoctorId]);

  // Load available slots for the selected doctor & date
  const loadSlots = useCallback(async () => {
    if (!selectedDoctorId || !date) return;
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    setSubmitError(null);
    try {
      const fetchedSlots = await fetchSlotsForDoctorAndDate(selectedDoctorId, date);
      setSlots(fetchedSlots);
    } catch (err) {
      console.warn('Could not fetch slots from Firestore:', err);
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedDoctorId, date]);

  useEffect(() => {
    if (selectedDoctorId && date) {
      loadSlots();
    }
  }, [selectedDoctorId, date, loadSlots]);

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!patientName.trim()) {
      newErrors.name = 'Please enter patient full name.';
    } else if (patientName.trim().length < 2) {
      newErrors.name = 'Patient name must be at least 2 characters.';
    }

    if (!patientPhone.trim()) {
      newErrors.phone = 'Please enter mobile number.';
    } else if (!/^[0-9+-\s]{7,15}$/.test(patientPhone.trim())) {
      newErrors.phone = 'Please enter a valid phone number.';
    }

    if (!patientEmail.trim()) {
      newErrors.email = 'Please enter an email address for appointment confirmation.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!selectedSlot) {
      newErrors.slot = 'Please select an available consultation time slot.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;
    if (!selectedDoctor || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const createdAppointment = await bookAppointmentAtomic({
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim(),
        doctorId: selectedDoctor.id,
        doctorNameSnapshot: selectedDoctor.name,
        doctorRoleSnapshot: selectedDoctor.role,
        department,
        date,
        slotId: selectedSlot.id,
        slotStart: selectedSlot.startTime,
        slotEnd: selectedSlot.endTime,
        patientMessage: patientMessage.trim() || undefined,
      });

      setSubmittedAppointment(createdAppointment);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setSubmitError(
        err?.message ||
          'This slot was just booked by another patient or is no longer available. Please select another slot.'
      );
      // Refresh slots
      await loadSlots();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedAppointment(null);
    setPatientName('');
    setPatientPhone('');
    setPatientEmail('');
    setPatientMessage('');
    setSelectedSlot(null);
    loadSlots();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <section id="appointment" className="py-16 sm:py-20 bg-brand-lightBlue overflow-hidden">
      <div className="container-custom">
        <SectionHeader
          eyebrow="Appointments"
          title="Book Doctor Consultation"
          description="Select your preferred specialist and choose an available consultation slot. Hospital staff will verify and confirm your appointment."
        />

        {/* Success Confirmation Card */}
        {submittedAppointment ? (
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="max-w-[700px] mx-auto bg-white p-7 sm:p-9 md:p-10 rounded-card shadow-brand border border-brand-line text-center space-y-6"
          >
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border-2 border-green-200">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block bg-amber-50 text-amber-800 text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-amber-200 mb-2">
                Status: Pending Hospital Confirmation
              </span>
              <h3 className="font-serif text-2xl font-bold text-brand-ink">
                Appointment Request Submitted!
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted mt-2 max-w-md mx-auto">
                Thank you, <b>{submittedAppointment.patientName}</b>. Your consultation request has been registered in our system. Our front desk will contact you to confirm the appointment.
              </p>
            </div>

            {/* Appointment Details Box */}
            <div className="bg-brand-lightBlue/60 border border-brand-line rounded-xl p-5 text-left text-xs sm:text-sm space-y-3">
              <div className="flex justify-between pb-2 border-b border-brand-line">
                <span className="text-brand-muted">Booking Reference:</span>
                <span className="font-mono font-bold text-brand-blue">{submittedAppointment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Specialist Doctor:</span>
                <span className="font-bold text-brand-ink">{submittedAppointment.doctorNameSnapshot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Department:</span>
                <span className="font-bold text-brand-ink">{submittedAppointment.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Consultation Date:</span>
                <span className="font-bold text-brand-ink">{submittedAppointment.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Reserved Time Slot:</span>
                <span className="font-bold text-brand-blue">
                  {submittedAppointment.slotStart} - {submittedAppointment.slotEnd}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Contact Mobile:</span>
                <span className="font-bold text-brand-ink">{submittedAppointment.patientPhone}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-brand-blue2 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Book Another Appointment</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* Main Interactive Booking Form */
          <motion.form
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            onSubmit={handleSubmit}
            className="max-w-[850px] mx-auto bg-white p-6 sm:p-9 md:p-10 rounded-card shadow-brand border border-brand-line space-y-6"
            noValidate
          >
            {/* Submit Error Banner */}
            {submitError && (
              <div
                role="alert"
                className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-brand-red"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <b className="block">Appointment Could Not Be Completed:</b>
                  <span>{submitError}</span>
                </div>
              </div>
            )}

            {/* Step 1 & Step 2: Department & Doctor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Preferred Department */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="department" className="text-xs sm:text-[13px] font-bold text-brand-ink">
                  1. Select Department <span className="text-brand-red">*</span>
                </label>
                <select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-3 border border-brand-line rounded-[9px] text-sm text-brand-ink bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specialist Doctor */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="doctor" className="text-xs sm:text-[13px] font-bold text-brand-ink">
                  2. Specialist Doctor <span className="text-brand-red">*</span>
                </label>
                {isLoadingDoctors ? (
                  <div className="h-11 bg-slate-100 rounded-[9px] animate-pulse" />
                ) : (
                  <select
                    id="doctor"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3.5 py-3 border border-brand-line rounded-[9px] text-sm text-brand-ink bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                  >
                    {clinicalDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Step 3: Consultation Date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className="text-xs sm:text-[13px] font-bold text-brand-ink flex items-center justify-between">
                <span>3. Consultation Date <span className="text-brand-red">*</span></span>
                <span className="text-[11px] text-brand-muted font-normal">Available for booking from today onward</span>
              </label>
              <input
                id="date"
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-3 border border-brand-line rounded-[9px] text-sm text-brand-ink bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors"
              />
            </div>

            {/* Step 4: Time Slot Selector */}
            <div className="flex flex-col gap-2 pt-1 border-t border-brand-line/60">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-[13px] font-bold text-brand-ink flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-blue" />
                  <span>4. Choose Consultation Time Slot <span className="text-brand-red">*</span></span>
                </label>
                {selectedSlot && (
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                    Selected: {selectedSlot.startTime} - {selectedSlot.endTime}
                  </span>
                )}
              </div>

              {isLoadingSlots ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center border border-brand-line">
                  <div className="w-6 h-6 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs font-semibold text-brand-muted">Checking doctor availability...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="p-6 bg-slate-50/80 rounded-xl text-center border border-dashed border-brand-line space-y-1">
                  <Clock className="w-6 h-6 text-brand-muted mx-auto mb-1" />
                  <p className="text-xs sm:text-sm font-bold text-brand-ink">
                    No scheduled slots released for this date
                  </p>
                  <p className="text-xs text-brand-muted max-w-md mx-auto">
                    Dr. {selectedDoctor?.name} does not have pre-released slots on {date}. You can pick another date or call our 24/7 reception desk at 08472-222244.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      const isAvailable = slot.status === 'available';

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            setSelectedSlot(slot);
                            if (errors.slot) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.slot;
                                return next;
                              });
                            }
                          }}
                          className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-brand-blue text-white border-brand-blue shadow-md scale-[1.02]'
                              : isAvailable
                              ? 'bg-white hover:bg-brand-lightBlue hover:border-brand-blue text-brand-ink border-brand-line'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <span>
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider ${
                              isSelected
                                ? 'text-white/90'
                                : isAvailable
                                ? 'text-green-600'
                                : 'text-gray-400'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : isAvailable ? 'Available' : slot.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.slot && (
                    <span className="text-xs text-brand-red font-semibold block">{errors.slot}</span>
                  )}
                </div>
              )}
            </div>

            {/* Step 5: Patient Details */}
            <div className="pt-2 border-t border-brand-line/60 space-y-4">
              <h4 className="text-xs sm:text-[13px] font-bold text-brand-ink">
                5. Patient Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="patientName" className="text-xs font-bold text-brand-muted">
                    Full Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    id="patientName"
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      if (errors.name) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.name;
                          return next;
                        });
                      }
                    }}
                    placeholder="Enter patient full name"
                    className={`w-full px-3.5 py-2.5 border rounded-[9px] text-sm text-brand-ink focus:outline-none focus:ring-2 transition-colors ${
                      errors.name
                        ? 'border-brand-red focus:ring-brand-red/30'
                        : 'border-brand-line focus:ring-brand-blue'
                    }`}
                  />
                  {errors.name && <span className="text-xs text-brand-red font-medium">{errors.name}</span>}
                </div>

                {/* Mobile Number */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="patientPhone" className="text-xs font-bold text-brand-muted">
                    Mobile Number <span className="text-brand-red">*</span>
                  </label>
                  <input
                    id="patientPhone"
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => {
                      setPatientPhone(e.target.value);
                      if (errors.phone) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.phone;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-3.5 py-2.5 border rounded-[9px] text-sm text-brand-ink focus:outline-none focus:ring-2 transition-colors ${
                      errors.phone
                        ? 'border-brand-red focus:ring-brand-red/30'
                        : 'border-brand-line focus:ring-brand-blue'
                    }`}
                  />
                  {errors.phone && <span className="text-xs text-brand-red font-medium">{errors.phone}</span>}
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="patientEmail" className="text-xs font-bold text-brand-muted">
                    Email Address <span className="text-brand-red">*</span>
                  </label>
                  <input
                    id="patientEmail"
                    type="email"
                    required
                    value={patientEmail}
                    onChange={(e) => {
                      setPatientEmail(e.target.value);
                      if (errors.email) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.email;
                          return next;
                        });
                      }
                    }}
                    placeholder="name@example.com"
                    className={`w-full px-3.5 py-2.5 border rounded-[9px] text-sm text-brand-ink focus:outline-none focus:ring-2 transition-colors ${
                      errors.email
                        ? 'border-brand-red focus:ring-brand-red/30'
                        : 'border-brand-line focus:ring-brand-blue'
                    }`}
                  />
                  {errors.email && <span className="text-xs text-brand-red font-medium">{errors.email}</span>}
                </div>

                {/* Message / Reason for Visit */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="patientMessage" className="text-xs font-bold text-brand-muted">
                    Message / Reason for Visit (Optional)
                  </label>
                  <textarea
                    id="patientMessage"
                    value={patientMessage}
                    onChange={(e) => setPatientMessage(e.target.value)}
                    placeholder="Briefly describe your symptoms or consultation requirement"
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-brand-line rounded-[9px] text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors resize-y min-h-[85px]"
                  />
                </div>
              </div>
            </div>

            {/* Submission Button */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !selectedSlot}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Submitting Request...' : 'Confirm Appointment Request'}
              </Button>
            </div>
          </motion.form>
        )}
      </div>
    </section>
  );
};
