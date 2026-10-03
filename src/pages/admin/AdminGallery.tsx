import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GalleryItem } from '../../types/gallery';
import {
  fetchAllGallery,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  toggleGalleryActive,
  importStaticGallerySafely,
} from '../../services/firestore';
import { galleryData } from '../../data/gallery';
import { GalleryForm } from '../../components/admin/GalleryForm';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  DownloadCloud,
  AlertCircle,
  Tag,
} from 'lucide-react';

export const AdminGallery: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Load gallery items from Firestore
  const loadGallery = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllGallery();
      setGalleryItems(data);
    } catch (err: any) {
      console.error('Error fetching gallery from Firestore:', err);
      setError('Unable to load hospital gallery. Please verify your connection and permissions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Safe one-time import of the 11 existing brochure gallery records
  const handleImportInitialData = async () => {
    const confirmed = window.confirm(
      'Import the 11 existing hospital gallery records into Firestore?\n\nExisting records with the same IDs will be preserved and not overwritten.'
    );
    if (!confirmed) return;

    setIsImporting(true);
    try {
      const result = await importStaticGallerySafely(galleryData);
      showToast(
        `Import complete: ${result.importedCount} gallery items added, ${result.skippedCount} already existed.`
      );
      await loadGallery();
    } catch (err: any) {
      console.error('Import error:', err);
      setError('Import failed: ' + (err?.message || 'Unable to write to Firestore'));
    } finally {
      setIsImporting(false);
    }
  };

  // Save Gallery Item (Create or Update)
  const handleSaveItem = async (
    formData: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    if (id) {
      await updateGalleryItem(id, formData);
      showToast('Gallery image updated successfully.');
    } else {
      await createGalleryItem(formData);
      showToast('Gallery image added successfully.');
    }
    await loadGallery();
  };

  // Delete Gallery Item
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await deleteGalleryItem(deletingItem.id);
      showToast(`"${deletingItem.caption}" deleted successfully.`);
      setDeletingItem(null);
      await loadGallery();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError('Unable to delete this gallery item. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (item: GalleryItem) => {
    try {
      await toggleGalleryActive(item.id, Boolean(item.isActive));
      showToast(`Gallery status updated.`);
      setGalleryItems((prev) =>
        prev.map((g) => (g.id === item.id ? { ...g, isActive: !g.isActive } : g))
      );
    } catch (err: any) {
      console.error('Toggle status error:', err);
      setError('Unable to update active status. Please try again.');
    }
  };

  // Derived unique categories
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    galleryItems.forEach((g) => {
      if (g.category) cats.add(g.category);
    });
    return Array.from(cats);
  }, [galleryItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return galleryItems.filter((item) => {
      // Search
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.caption.toLowerCase().includes(search) ||
        (item.altText && item.altText.toLowerCase().includes(search)) ||
        (item.category && item.category.toLowerCase().includes(search));

      // Status
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.isActive) ||
        (statusFilter === 'inactive' && !item.isActive);

      // Category
      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [galleryItems, searchQuery, statusFilter, categoryFilter]);

  const nextOrder = useMemo(() => {
    if (galleryItems.length === 0) return 1;
    const max = Math.max(...galleryItems.map((g) => g.displayOrder || 0));
    return max + 1;
  }, [galleryItems]);

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
            Hospital Gallery
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Manage hospital photography, clinical visuals, events, and facility images.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {galleryItems.length === 0 && (
            <button
              type="button"
              onClick={handleImportInitialData}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs sm:text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
              title="One-time import of the 11 existing gallery entries"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>{isImporting ? 'Importing...' : 'Import 11 Existing Items'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue2 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            <Plus className="w-4 h-4" />
            <span>Add Gallery Image</span>
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
            onClick={loadGallery}
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
            placeholder="Search by caption, category..."
            className="w-full pl-9 pr-3 py-2 border border-brand-line rounded-lg text-xs sm:text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-brand-line rounded-lg text-xs font-semibold text-brand-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="all">Category: All</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

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

          {/* Reload Button */}
          <button
            type="button"
            onClick={loadGallery}
            disabled={isLoading}
            className="p-2 border border-brand-line hover:bg-brand-bg text-brand-ink rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-50"
            title="Refresh gallery"
            aria-label="Refresh gallery list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-blue' : ''}`} />
          </button>
        </div>
      </div>

      {/* Gallery Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-brand-line p-12 text-center shadow-card">
          <div className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-brand-ink">Loading hospital gallery...</p>
          <p className="text-xs text-brand-muted mt-1">Connecting to Firestore database</p>
        </div>
      ) : galleryItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-line p-12 text-center shadow-card">
          <div className="w-12 h-12 rounded-full bg-brand-lightBlue text-brand-blue flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-brand-ink mb-1">
            No gallery images have been added yet
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto mb-6">
            Import the 11 existing clinical care and procedure photographs with one click, or upload new facility photography.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleImportInitialData}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm hover:bg-brand-blue2 transition-colors"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>{isImporting ? 'Importing...' : 'Import 11 Existing Items'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-line text-brand-ink rounded-lg text-xs sm:text-sm font-semibold hover:bg-brand-bg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Image Manually</span>
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-line p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-ink">No gallery images matched your search or filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
            className="mt-3 text-xs font-bold text-brand-blue hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /* Gallery Responsive Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const photoSrc = item.imageUrl || item.image;
            const fallbackElement = (
              <div className="w-full h-48 bg-slate-100 flex flex-col items-center justify-center text-brand-muted p-4 text-center">
                <ImageIcon className="w-8 h-8 mb-1 text-gray-400" />
                <span className="text-xs font-medium">{item.category || 'Hospital Facility'}</span>
              </div>
            );

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-brand-line shadow-card overflow-hidden flex flex-col justify-between hover:shadow-brand transition-shadow duration-200"
              >
                {/* Image Container with Badges */}
                <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                  <ImageWithFallback
                    src={photoSrc}
                    alt={item.altText || item.alt || item.caption}
                    className="w-full h-full object-cover"
                    fallback={fallbackElement}
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-bold text-brand-ink shadow-sm">
                      <Tag className="w-3 h-3 text-brand-blue" />
                      <span>{item.category || 'General'}</span>
                    </span>

                    <span className="bg-brand-dark/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm">
                      #{item.displayOrder ?? 0}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-brand-ink leading-snug">
                      {item.caption}
                    </h3>
                    {item.altText && item.altText !== item.caption && (
                      <p className="text-xs text-brand-muted line-clamp-1 mt-1">
                        Alt: {item.altText}
                      </p>
                    )}
                  </div>

                  {/* Actions & Status */}
                  <div className="mt-4 pt-3 border-t border-brand-line flex items-center justify-between">
                    {/* Active/Inactive Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                        item.isActive
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300'
                      }`}
                      title={item.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {item.isActive ? (
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

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 text-brand-blue hover:bg-brand-lightBlue rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                        title="Edit gallery item"
                        aria-label={`Edit ${item.caption}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 text-brand-red hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                        title="Delete gallery item"
                        aria-label={`Delete ${item.caption}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <GalleryForm
        isOpen={isFormOpen}
        initialData={editingItem}
        nextDisplayOrder={nextOrder}
        onSave={handleSaveItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        title="Delete Gallery Image?"
        itemName={deletingItem?.caption || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
};
