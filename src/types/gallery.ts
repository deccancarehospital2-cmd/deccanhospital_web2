import { Timestamp } from 'firebase/firestore';

export interface GalleryItem {
  id: string;
  image?: string; // Legacy / static asset path fallback
  imageUrl?: string; // Cloudinary secure HTTPS URL
  imagePublicId?: string; // Cloudinary public_id for asset management
  alt?: string;
  altText?: string;
  caption: string;
  category?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: Timestamp | string | Date;
  updatedAt?: Timestamp | string | Date;
}
