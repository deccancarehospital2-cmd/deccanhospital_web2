import React, { useState, useEffect } from 'react';
import { GalleryItem } from '../../types/gallery';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../../lib/cloudinary';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { X, Upload, Trash2, AlertCircle, ImageIcon } from 'lucide-react';

interface GalleryFormProps {
  isOpen: boolean;
  initialData?: GalleryItem | null;
  nextDisplayOrder?: number;
  onSave: (galleryData: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
  onClose: () => void;
}

const COMMON_CATEGORIES = [
  'Clinical',
  'Procedure',
  'Surgery',
  'Care',
  'Diagnostics',
  'Doctor Profile',
  'Facility',
];

export const GalleryForm: React.FC<GalleryFormProps> = ({
  isOpen,
  initialData,
  nextDisplayOrder = 1,
  onSave,
  onClose,
}) => {
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [category, setCategory] = useState('Clinical');
  const [displayOrder, setDisplayOrder] = useState(nextDisplayOrder);
  const [isActive, setIsActive] = useState(true);

  // Photo state
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imagePublicId, setImagePublicId] = useState<string | undefined>(undefined);
  const [legacyImage, setLegacyImage] = useState<string | undefined>(undefined);

  // Upload & submission states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCaption(initialData.caption || '');
      setAltText(initialData.altText || initialData.alt || initialData.caption || '');
      setCategory(initialData.category || 'Clinical');
      setDisplayOrder(initialData.displayOrder ?? nextDisplayOrder);
      setIsActive(initialData.isActive ?? true);
      setImageUrl(initialData.imageUrl);
      setImagePublicId(initialData.imagePublicId);
      setLegacyImage(initialData.image);
    } else {
      setCaption('');
      setAltText('');
      setCategory('Clinical');
      setDisplayOrder(nextDisplayOrder);
      setIsActive(true);
      setImageUrl(undefined);
      setImagePublicId(undefined);
      setLegacyImage(undefined);
    }
    setErrorMessage(null);
  }, [initialData, nextDisplayOrder, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !isUploadingPhoto) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, isUploadingPhoto, onClose]);

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Invalid file format. Please select a JPG, PNG, or WebP image.');
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeInBytes) {
      setErrorMessage('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setErrorMessage(null);
    setIsUploadingPhoto(true);

    try {
      const uploadResult = await uploadToCloudinary(file, CLOUDINARY_FOLDERS.GALLERY);
      setImageUrl(uploadResult.secure_url);
      setImagePublicId(uploadResult.public_id);
      setLegacyImage(undefined);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload photo to Cloudinary.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setImageUrl(undefined);
    setImagePublicId(undefined);
    setLegacyImage(undefined);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!caption.trim()) {
      setErrorMessage('Image caption is required.');
      return;
    }

    // Require an image for new items if neither Cloudinary URL nor legacy image is present
    if (!initialData && !imageUrl && !legacyImage) {
      setErrorMessage('Please upload a gallery photograph before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'> = {
        caption: caption.trim(),
        altText: altText.trim() || caption.trim(),
        category: category.trim() || 'Clinical',
        displayOrder: Number(displayOrder) || 1,
        isActive,
        imageUrl: imageUrl || '',
        imagePublicId: imagePublicId || '',
        image: legacyImage || '',
      };

      await onSave(payload, initialData?.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to save gallery item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPhotoSrc = imageUrl || legacyImage;

  const placeholderElement = (
    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-brand-muted p-4 text-center">
      <ImageIcon className="w-8 h-8 mb-1 text-gray-400" />
      <span className="text-xs">No Image Uploaded</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-form-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white rounded-card shadow-2xl border border-brand-line z-10 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-line bg-brand-bg/50">
          <div>
            <h2 id="gallery-form-title" className="font-serif text-xl font-bold text-brand-ink">
              {initialData ? 'Edit Gallery Photo' : 'Add Hospital Gallery Photo'}
            </h2>
            <p className="text-xs text-brand-muted mt-0.5">
              {initialData ? `Editing: ${initialData.caption}` : 'Upload and caption hospital and clinical care visuals'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs sm:text-sm text-brand-red leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Image Upload / Preview Container */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
              Gallery Photograph {!initialData && <span className="text-brand-red">*</span>}
            </label>
            <div className="bg-brand-bg rounded-xl border border-brand-line p-4 flex flex-col items-center gap-4">
              <div className="w-full max-w-xs h-44 rounded-lg overflow-hidden border border-brand-line bg-white flex items-center justify-center shadow-sm">
                {currentPhotoSrc ? (
                  <ImageWithFallback
                    src={currentPhotoSrc}
                    alt={caption || 'Gallery preview'}
                    className="w-full h-full object-cover"
                    fallback={placeholderElement}
                  />
                ) : (
                  placeholderElement
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-brand-lightBlue border border-brand-line rounded-lg text-xs font-bold text-brand-blue cursor-pointer transition-colors shadow-sm focus-within:ring-2 focus-within:ring-brand-blue">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? 'Uploading to Cloudinary...' : currentPhotoSrc ? 'Change Photograph' : 'Upload Photograph'}</span>
                  <input
                    type="file"
                    accept="image/jpeg, image/jpg, image/png, image/webp"
                    className="sr-only"
                    disabled={isUploadingPhoto || isSubmitting}
                    onChange={handlePhotoSelect}
                  />
                </label>

                {currentPhotoSrc && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isUploadingPhoto || isSubmitting}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-brand-red hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <span className="text-[11px] text-brand-muted">
                Supported formats: JPG, PNG, WebP (Max 5MB)
              </span>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Caption */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="gal-caption" className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
                Caption <span className="text-brand-red">*</span>
              </label>
              <input
                id="gal-caption"
                type="text"
                required
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Surgical team in operating room"
                className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>

            {/* Alt Text */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="gal-alt" className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
                Accessible Description (Alt Text)
              </label>
              <input
                id="gal-alt"
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive text for screen readers (defaults to caption if left blank)"
                className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor="gal-cat" className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
                Category
              </label>
              <div className="flex gap-2">
                <input
                  id="gal-cat"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Surgery, Clinical"
                  list="common-categories"
                  className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                />
                <datalist id="common-categories">
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Display Order */}
            <div className="space-y-1.5">
              <label htmlFor="gal-order" className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
                Display Order
              </label>
              <input
                id="gal-order"
                type="number"
                min={1}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>

            {/* Active Toggle */}
            <div className="sm:col-span-2 pt-2 border-t border-brand-line">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-brand-blue rounded border-brand-line focus:ring-brand-blue"
                />
                <span className="text-sm font-semibold text-brand-ink">
                  Active (Visible on public hospital gallery)
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-brand-line flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploadingPhoto}
              className="px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingPhoto}
              className="px-6 py-2 text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Image...</span>
                </>
              ) : (
                <span>{initialData ? 'Save Changes' : 'Add to Gallery'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
