import { cloudinaryConfig, isCloudinaryConfigured } from '../lib/cloudinary';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  original_filename?: string;
  resource_type?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

/**
 * Uploads an image file directly to Cloudinary using an unsigned upload preset.
 *
 * @param file The image File object from browser file input
 * @param folder Target folder inside Cloudinary (e.g. 'deccan-care/doctors')
 */
export async function uploadToCloudinary(
  file: File,
  folder?: string
): Promise<CloudinaryUploadResponse> {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Cloudinary configuration is missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your environment.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);

  if (folder) {
    formData.append('folder', folder);
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let message = errorData?.error?.message || 'Failed to upload image to Cloudinary.';
    if (message.toLowerCase().includes('unknown api key')) {
      message = `Invalid or missing unsigned upload configuration. Please verify that the Cloud Name "${cloudinaryConfig.cloudName}" is correct and that the Upload Preset "${cloudinaryConfig.uploadPreset}" exists and is set to Signing Mode: "Unsigned" in your Cloudinary Dashboard Settings → Upload → Upload presets.`;
    }
    throw new Error(`Cloudinary Upload Error: ${message}`);
  }

  const data = await response.json();

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    original_filename: data.original_filename,
    resource_type: data.resource_type,
    format: data.format,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
  };
}
