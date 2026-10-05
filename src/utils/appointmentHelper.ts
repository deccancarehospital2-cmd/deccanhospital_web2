import { AppointmentFormData } from '../types/appointment';

export const HOSPITAL_EMAIL = 'deccancarehospital.24hrs@gmail.com';
export const HOSPITAL_PHONE_PRIMARY = '+917411140480';
export const HOSPITAL_PHONE_SECONDARY = '+918310365003';
export const HOSPITAL_WHATSAPP_LINK = 'https://wa.me/917411140480';
export const HOSPITAL_MAPS_LINK = 'https://www.google.com/maps/search/?api=1&query=Deccan+Care+Maternity+%26+General+Hospital+Kalaburagi+Karnataka+585101';

/**
 * Creates a mailto: link from appointment form data.
 * Isolated here so future API or Firestore submission can replace this seamlessly.
 */
export function sendAppointmentEmail(formData: AppointmentFormData): void {
  const patient = formData.name.trim();
  const phone = formData.phone.trim();
  const dept = formData.department || 'General Medicine';
  const date = formData.date || 'Not specified';
  const msg = (formData.message || '').trim() || 'Not specified';

  const body = `Appointment Request%0A%0APatient: ${encodeURIComponent(patient)}%0AMobile: ${encodeURIComponent(phone)}%0ADepartment: ${encodeURIComponent(dept)}%0APreferred date: ${encodeURIComponent(date)}%0AMessage: ${encodeURIComponent(msg)}`;
  const subject = `Appointment Request - ${encodeURIComponent(patient)}`;

  window.location.href = `mailto:${HOSPITAL_EMAIL}?subject=${subject}&body=${body}`;
}
