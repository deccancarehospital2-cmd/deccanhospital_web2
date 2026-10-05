import { Timestamp } from 'firebase/firestore';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface DoctorWeeklySchedule {
  enabled: boolean;
  days: DayOfWeek[];
  startTime: string; // HH:MM (24h format, e.g. "09:00")
  endTime: string; // HH:MM (24h format, e.g. "13:00")
  durationMinutes: number; // e.g. 30
  blockedDates?: string[]; // Array of YYYY-MM-DD for holidays / leaves
}

export const DEFAULT_DOCTOR_SCHEDULE: DoctorWeeklySchedule = {
  enabled: true,
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  startTime: '09:00',
  endTime: '13:00',
  durationMinutes: 30,
  blockedDates: [],
};

export interface Doctor {
  id: string;
  name: string;
  role: string;
  qualifications?: string;
  description?: string;
  experience?: string;
  displayOrder?: number;
  isActive?: boolean;
  image?: string; // Legacy / static asset path fallback
  imageUrl?: string; // Cloudinary secure HTTPS URL
  imagePublicId?: string; // Cloudinary public_id for asset management
  isSupportStaff?: boolean;
  avatarType?: 'doctor' | 'femaleSupport' | 'maleSupport';
  schedule?: DoctorWeeklySchedule;
  createdAt?: Timestamp | string | Date;
  updatedAt?: Timestamp | string | Date;
}
