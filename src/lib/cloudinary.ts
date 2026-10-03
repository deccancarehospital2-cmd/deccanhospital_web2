export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim(),
  uploadPreset: (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim(),
};

export const isCloudinaryConfigured = Boolean(
  cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset
);

export const CLOUDINARY_FOLDERS = {
  DOCTORS: 'deccan-care/doctors',
  GALLERY: 'deccan-care/gallery',
} as const;
