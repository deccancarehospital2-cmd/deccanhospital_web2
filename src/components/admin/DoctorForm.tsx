import React, { useState, useEffect } from 'react';
import { Doctor } from '../../types/doctor';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../../lib/cloudinary';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { MedicalPlaceholder } from '../common/MedicalPlaceholder';
import { X, Upload, Trash2, AlertCircle } from 'lucide-react';

interface DoctorFormProps {
  isOpen: boolean;
  initialData?: Doctor | null;
  nextDisplayOrder?: number;
  onSave: (doctorData: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
  onClose: () => void;
}

export const DoctorForm: React.FC<DoctorFormProps> = ({
  isOpen,
  initialData,
  nextDisplayOrder = 1,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(nextDisplayOrder);
  const [isActive, setIsActive] = useState(true);
  const [isSupportStaff, setIsSupportStaff] = useState(false);
  const [avatarType, setAvatarType] = useState<'doctor' | 'femaleSupport' | 'maleSupport'>('doctor');

  // Photo state
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imagePublicId, setImagePublicId] = useState<string | undefined>(undefined);
  const [legacyImage, setLegacyImage] = useState<string | undefined>(undefined);

  // Status & validation states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setRole(initialData.role || '');
      setQualifications(initialData.qualifications || '');
      setExperience(initialData.experience || '');
      setDescription(initialData.description || '');
      setDisplayOrder(initialData.displayOrder ?? nextDisplayOrder);
      setIsActive(initialData.isActive ?? true);
      setIsSupportStaff(initialData.isSupportStaff ?? false);
      setAvatarType(initialData.avatarType || (initialData.isSupportStaff ? 'femaleSupport' : 'doctor'));
      setImageUrl(initialData.imageUrl);
      setImagePublicId(initialData.imagePublicId);
      setLegacyImage(initialData.image);
    } else {
      setName('');
      setRole('');
      setQualifications('');
      setExperience('');
      setDescription('');
      setDisplayOrder(nextDisplayOrder);
      setIsActive(true);
      setIsSupportStaff(false);
      setAvatarType('doctor');
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
      const uploadResult = await uploadToCloudinary(file, CLOUDINARY_FOLDERS.DOCTORS);
      setImageUrl(uploadResult.secure_url);
      setImagePublicId(uploadResult.public_id);
      setLegacyImage(undefined);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload photo to Cloudinary.');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input value so same file can be selected again if needed
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

    if (!name.trim()) {
      setErrorMessage('Doctor / Staff name is required.');
      return;
    }

    if (!role.trim()) {
      setErrorMessage('Role / Specialization is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        role: role.trim(),
        qualifications: qualifications.trim() || '',
        experience: experience.trim() || '',
        description: description.trim() || '',
        displayOrder: Number(displayOrder) || 1,
        isActive,
        isSupportStaff,
        avatarType,
        imageUrl: imageUrl || '',
        imagePublicId: imagePublicId || '',
        image: legacyImage || '',
      };

      await onSave(payload, initialData?.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to save doctor profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPhotoSrc = imageUrl || legacyImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-form-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-card shadow-2xl border border-brand-line z-10 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-line bg-brand-bg/50">
          <div>
            <h2 id="doctor-form-title" className="font-serif text-xl font-bold text-brand-ink">
              {initialData ? 'Edit Doctor / Team Profile' : 'Add New Doctor / Team Member'}
            </h2>
            <p className="text-xs text-brand-muted mt-0.5">
              {initialData ? `Updating records for ${initialData.name}` : 'Enter verified hospital qualifications and role'}
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

          {/* Photo Management Section */}
          <div className="bg-brand-bg p-4 rounded-xl border border-brand-line flex flex-col sm:flex-row items-center gap-5">
            {/* Photo preview container */}
            <div className="w-24 h-28 rounded-xl bg-white border border-brand-line overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
              {currentPhotoSrc ? (
                <ImageWithFallback
                  src={currentPhotoSrc}
                  alt={name || 'Doctor preview'}
                  className="w-full h-full object-cover"
                  fallback={<MedicalPlaceholder type={avatarType} />}
                />
              ) : (
                <MedicalPlaceholder type={avatarType} />
              )}
            </div>

            {/* Photo actions */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="text-xs font-bold text-brand-ink uppercase tracking-wide">
                Profile Photograph
              </div>
              <p className="text-xs text-brand-muted leading-relaxed">
                Upload a professional headshot. If omitted, the medical placeholder will be displayed.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-brand-lightBlue border border-brand-line rounded-lg text-xs font-bold text-brand-blue cursor-pointer transition-colors shadow-sm focus-within:ring-2 focus-within:ring-brand-blue">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? 'Uploading...' : currentPhotoSrc ? 'Change Photo' : 'Upload Photo'}</span>
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
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-brand-red hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="doc-name" className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
                Full Name <span className="text-brand-red">*</span>
              </label>
              <input
                id="doc-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Abdul Baseer"
                className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>

            {/* Specialization / Role */}
            <div className="space-y-1.5">
              <label htmlFor="doc-role" className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
                Specialization / Role <span className="text-brand-red">*</span>
              </label>
              <input
                id="doc-role"
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. General Surgery, Gynaecologist"
                className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>

            {/* Qualifications */}
            <div className="space-y-1.5">
              <label htmlFor="doc-qual" className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
                Qualifications
              </label>
              <input
                id="doc-qual"
                type="text"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. MBBS, DNB (Gen. Surg), FMAS"
                className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1.5">
              <label htmlFor="doc-exp" className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
                Experience
              </label>
              <input
                id="doc-exp"
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 8 years of experience"
                className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>

            {/* Display Order */}
            <div className="space-y-1.5">
              <label htmlFor="doc-order" className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
                Display Order
              </label>
              <input
                id="doc-order"
                type="number"
                min={1}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>

            {/* Description / Bio */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="doc-desc" className="block text-xs font-bold text-brand-ink uppercase tracking-wide">
                Description / Profile Bio
              </label>
              <textarea
                id="doc-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed clinical background or patient coordination scope..."
                className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue resize-y"
              />
            </div>

            {/* Classification & Status Checkboxes */}
            <div className="space-y-2 sm:col-span-2 pt-2 border-t border-brand-line">
              <div className="flex flex-wrap items-center gap-6">
                {/* Active Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-brand-blue rounded border-brand-line focus:ring-brand-blue"
                  />
                  <span className="text-sm font-semibold text-brand-ink">
                    Active (Visible on public website)
                  </span>
                </label>

                {/* Support Staff Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSupportStaff}
                    onChange={(e) => {
                      setIsSupportStaff(e.target.checked);
                      if (!e.target.checked) setAvatarType('doctor');
                    }}
                    className="w-4 h-4 text-brand-blue rounded border-brand-line focus:ring-brand-blue"
                  />
                  <span className="text-sm font-semibold text-brand-ink">
                    Patient Support / Physiotherapy Staff
                  </span>
                </label>
              </div>

              {/* Avatar Type Picker for Placeholders */}
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-bold text-brand-muted uppercase">
                  Placeholder Avatar Style:
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="avatarType"
                      value="doctor"
                      checked={avatarType === 'doctor'}
                      onChange={() => setAvatarType('doctor')}
                    />
                    <span>Medical Doctor (⚕)</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="avatarType"
                      value="femaleSupport"
                      checked={avatarType === 'femaleSupport'}
                      onChange={() => setAvatarType('femaleSupport')}
                    />
                    <span>Support Assistant (👩‍💼)</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="avatarType"
                      value="maleSupport"
                      checked={avatarType === 'maleSupport'}
                      onChange={() => setAvatarType('maleSupport')}
                    />
                    <span>Physiotherapist (🧑‍⚕️)</span>
                  </label>
                </div>
              </div>
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
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>{initialData ? 'Save Changes' : 'Create Profile'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
