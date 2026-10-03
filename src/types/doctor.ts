import { Timestamp } from 'firebase/firestore';

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
  createdAt?: Timestamp | string | Date;
  updatedAt?: Timestamp | string | Date;
}
