import { Timestamp, FieldValue } from 'firebase/firestore';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorNameSnapshot: string;
  doctorRoleSnapshot: string;
  department: string;
  date: string; // Format: YYYY-MM-DD
  slotId: string;
  slotStart: string; // Format: HH:MM or HH:MM AM/PM
  slotEnd: string; // Format: HH:MM or HH:MM AM/PM
  status: AppointmentStatus;
  patientMessage?: string;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt?: Timestamp | FieldValue | string | Date;
  updatedAt?: Timestamp | FieldValue | string | Date;
  confirmedAt?: Timestamp | FieldValue | string | Date;
  cancelledAt?: Timestamp | FieldValue | string | Date;
}

export type SlotStatus = 'available' | 'booked' | 'blocked';

export interface DoctorSlot {
  id: string;
  doctorId: string;
  doctorNameSnapshot: string;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:MM (24-hour or 12-hour format string)
  endTime: string; // Format: HH:MM (24-hour or 12-hour format string)
  status: SlotStatus;
  appointmentId?: string | null;
  createdAt?: Timestamp | string | Date;
  updatedAt?: Timestamp | string | Date;
}

export interface AppointmentFormData {
  name: string;
  phone: string;
  email: string;
  department: string;
  doctorId: string;
  date: string;
  slotId: string;
  message?: string;
}
