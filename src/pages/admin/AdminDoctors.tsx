import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Doctor } from '../../types/doctor';
import {
  fetchAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  toggleDoctorActive,
  importStaticDoctorsSafely,
} from '../../services/firestore';
import { doctorsData } from '../../data/doctors';
import { DoctorForm } from '../../components/admin/DoctorForm';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { MedicalPlaceholder } from '../../components/common/MedicalPlaceholder';
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  DownloadCloud,
  AlertCircle,
} from 'lucide-react';

export const AdminDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'doctors' | 'support'>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Load doctors from Firestore
  const loadDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllDoctors();
      setDoctors(data);
    } catch (err: any) {
      console.error('Error fetching doctors from Firestore:', err);
      setError('Unable to load doctors & team. Please verify your connection and permissions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Safe one-time import of the 21 existing brochure profiles
  const handleImportInitialData = async () => {
    const confirmed = window.confirm(
      'Import the 21 hospital brochure doctor/team profiles into Firestore?\n\nExisting records with the same IDs will be preserved and not overwritten.'
    );
    if (!confirmed) return;

    setIsImporting(true);
    try {
      const result = await importStaticDoctorsSafely(doctorsData);
      showToast(
        `Import complete: ${result.importedCount} profiles added, ${result.skippedCount} already existed.`
      );
      await loadDoctors();
    } catch (err: any) {
      console.error('Import error:', err);
      setError('Import failed: ' + (err?.message || 'Unable to write to Firestore'));
    } finally {
      setIsImporting(false);
    }
  };

  // Save Doctor (Create or Update)
  const handleSaveDoctor = async (
    formData: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    if (id) {
      await updateDoctor(id, formData);
      showToast('Doctor updated successfully.');
    } else {
      await createDoctor(formData);
      showToast('Doctor added successfully.');
    }
    await loadDoctors();
  };

  // Delete Doctor
  const handleConfirmDelete = async () => {
    if (!deletingDoctor) return;
    setIsDeleting(true);
    try {
      await deleteDoctor(deletingDoctor.id);
      showToast(`"${deletingDoctor.name}" deleted successfully.`);
      setDeletingDoctor(null);
      await loadDoctors();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError('Unable to delete this record. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (doctor: Doctor) => {
    try {
      await toggleDoctorActive(doctor.id, Boolean(doctor.isActive));
      showToast(`Status updated for ${doctor.name}.`);
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, isActive: !d.isActive } : d))
      );
    } catch (err: any) {
      console.error('Toggle status error:', err);
      setError('Unable to update active status. Please try again.');
    }
  };

  // Filter and sort doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // Search
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        doc.name.toLowerCase().includes(search) ||
        doc.role.toLowerCase().includes(search) ||
        (doc.qualifications && doc.qualifications.toLowerCase().includes(search)) ||
        (doc.description && doc.description.toLowerCase().includes(search));

      // Status
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && doc.isActive) ||
        (statusFilter === 'inactive' && !doc.isActive);

      // Type
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'doctors' && !doc.isSupportStaff) ||
        (typeFilter === 'support' && doc.isSupportStaff);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [doctors, searchQuery, statusFilter, typeFilter]);

  const nextOrder = useMemo(() => {
    if (doctors.length === 0) return 1;
    const max = Math.max(...doctors.map((d) => d.displayOrder || 0));
    return max + 1;
  }, [doctors]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-brand-dark text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#2786aa] animate-in slide-in-from-bottom duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-line">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
            Doctors & Medical Team
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Manage hospital medical professionals, clinical specializations, qualifications, and staff status.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {doctors.length === 0 && (
            <button
              type="button"
              onClick={handleImportInitialData}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs sm:text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
              title="One-time import of the 21 existing brochure profiles"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>{isImporting ? 'Importing...' : 'Import 21 Brochure Profiles'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingDoctor(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue2 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            <Plus className="w-4 h-4" />
            <span>Add Doctor / Staff</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3 text-sm text-brand-red"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDoctors}
            className="text-xs font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-brand-line shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, qualification..."
            className="w-full pl-9 pr-3 py-2 border border-brand-line rounded-lg text-xs sm:text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-brand-line rounded-lg text-xs font-semibold text-brand-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="all">Status: All</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-brand-line rounded-lg text-xs font-semibold text-brand-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="all">Type: All Staff</option>
            <option value="doctors">Medical Doctors</option>
            <option value="support">Patient Support / Physio</option>
          </select>

          {/* Reload Button */}
          <button
            type="button"
            onClick={loadDoctors}
            disabled={isLoading}
            className="p-2 border border-brand-line hover:bg-brand-bg text-brand-ink rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-50"
            title="Refresh list"
            aria-label="Refresh doctors list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-blue' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-brand-line p-12 text-center shadow-card">
          <div className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-brand-ink">Loading doctors & team...</p>
          <p className="text-xs text-brand-muted mt-1">Connecting to Firestore database</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-line p-12 text-center shadow-card">
          <div className="w-12 h-12 rounded-full bg-brand-lightBlue text-brand-blue flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-brand-ink mb-1">
            No doctors or team members have been added yet
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto mb-6">
            You can import the 21 existing brochure profiles into Firestore with one click, or start adding custom doctor records manually.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleImportInitialData}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm hover:bg-brand-blue2 transition-colors"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>{isImporting ? 'Importing...' : 'Import 21 Brochure Profiles'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingDoctor(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-line text-brand-ink rounded-lg text-xs sm:text-sm font-semibold hover:bg-brand-bg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Doctor Manually</span>
            </button>
          </div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-line p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-ink">No profiles matched your search or filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            className="mt-3 text-xs font-bold text-brand-blue hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /* Doctors List Table / Cards */
        <div className="bg-white rounded-xl border border-brand-line shadow-card overflow-hidden">
          {/* Table Header for Desktop */}
          <div className="hidden lg:grid grid-cols-[80px_1.2fr_1fr_80px_100px_120px] gap-4 px-6 py-3.5 bg-brand-bg border-b border-brand-line text-[11px] font-extrabold uppercase tracking-wider text-brand-muted">
            <span>Photo</span>
            <span>Name & Role</span>
            <span>Qualifications</span>
            <span className="text-center">Order</span>
            <span className="text-center">Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* List Items */}
          <div className="divide-y divide-brand-line">
            {filteredDoctors.map((doc) => {
              const photoSrc = doc.imageUrl || doc.image;
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:p-5 lg:px-6 lg:py-4 flex flex-col lg:grid lg:grid-cols-[80px_1.2fr_1fr_80px_100px_120px] gap-4 items-start lg:items-center hover:bg-slate-50/70 transition-colors"
                >
                  {/* Photo Thumbnail */}
                  <div className="w-16 h-18 sm:w-14 sm:h-16 rounded-xl bg-gradient-to-br from-[#e6f5fa] to-[#f8fcfd] border border-brand-line overflow-hidden shrink-0 flex items-center justify-center">
                    {photoSrc ? (
                      <ImageWithFallback
                        src={photoSrc}
                        alt={doc.name}
                        className="w-full h-full object-cover"
                        fallback={<MedicalPlaceholder type={doc.avatarType} />}
                      />
                    ) : (
                      <MedicalPlaceholder type={doc.avatarType} />
                    )}
                  </div>

                  {/* Name & Role */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-bold text-base text-brand-ink">
                        {doc.name}
                      </h3>
                      {doc.isSupportStaff && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                          Support Staff
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-brand-red uppercase tracking-wide mt-0.5">
                      {doc.role}
                    </div>
                    {doc.description && (
                      <p className="text-xs text-brand-muted line-clamp-1 mt-1">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Qualifications & Experience */}
                  <div className="text-xs text-brand-ink">
                    {doc.qualifications ? (
                      <span className="font-semibold block">{doc.qualifications}</span>
                    ) : (
                      <span className="text-gray-400 italic">No qualifications specified</span>
                    )}
                    {doc.experience && (
                      <span className="text-brand-muted block mt-0.5">{doc.experience}</span>
                    )}
                  </div>

                  {/* Display Order */}
                  <div className="text-center font-bold text-xs text-brand-muted bg-gray-100/70 py-1 px-2 rounded lg:mx-auto">
                    #{doc.displayOrder ?? 0}
                  </div>

                  {/* Active / Inactive Status Toggle */}
                  <div className="flex items-center lg:justify-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(doc)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                        doc.isActive
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300'
                      }`}
                      title={doc.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {doc.isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-gray-400" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center justify-end gap-1.5 w-full lg:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDoctor(doc);
                        setIsFormOpen(true);
                      }}
                      className="p-2 text-brand-blue hover:bg-brand-lightBlue rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      title="Edit doctor profile"
                      aria-label={`Edit ${doc.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingDoctor(doc)}
                      className="p-2 text-brand-red hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                      title="Delete doctor"
                      aria-label={`Delete ${doc.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* List Footer Count */}
          <div className="p-4 bg-brand-bg/60 border-t border-brand-line text-xs text-brand-muted flex items-center justify-between">
            <span>
              Showing {filteredDoctors.length} of {doctors.length} total team profiles
            </span>
            <span>
              {doctors.filter((d) => d.isActive).length} active on public website
            </span>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <DoctorForm
        isOpen={isFormOpen}
        initialData={editingDoctor}
        nextDisplayOrder={nextOrder}
        onSave={handleSaveDoctor}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDoctor(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingDoctor)}
        title="Delete Doctor / Team Member?"
        itemName={deletingDoctor?.name || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingDoctor(null)}
      />
    </div>
  );
};
