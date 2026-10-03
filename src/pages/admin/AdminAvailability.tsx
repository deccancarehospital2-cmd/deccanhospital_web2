import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Doctor } from '../../types/doctor';
import { DoctorSlot, SlotStatus } from '../../types/appointment';
import {
  fetchAllDoctors,
  fetchSlotsForDoctorAndDate,
  generateDoctorSlots,
  updateSlotStatus,
  deleteSlot,
} from '../../services/firestore';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const AdminAvailability: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Slot Generation Form State
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('13:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);

  // Slots Data State
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState<boolean>(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load doctors on mount
  useEffect(() => {
    async function loadDocs() {
      setIsLoadingDoctors(true);
      try {
        const docs = await fetchAllDoctors();
        // Only include clinical doctors (excluding purely support roles if needed, or all)
        const clinicalDocs = docs.filter((d) => d.isActive !== false && !d.isSupportStaff);
        setDoctors(clinicalDocs.length > 0 ? clinicalDocs : docs);
        if (clinicalDocs.length > 0) {
          setSelectedDoctorId(clinicalDocs[0].id);
        } else if (docs.length > 0) {
          setSelectedDoctorId(docs[0].id);
        }
      } catch (err) {
        console.error('Failed to load doctors for slot management:', err);
        setError('Unable to load doctor profiles. Please check database permissions.');
      } finally {
        setIsLoadingDoctors(false);
      }
    }
    loadDocs();
  }, []);

  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => d.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  // Load slots for selected doctor and date
  const loadSlots = useCallback(async () => {
    if (!selectedDoctorId || !selectedDate) return;
    setIsLoadingSlots(true);
    setError(null);
    try {
      const fetchedSlots = await fetchSlotsForDoctorAndDate(selectedDoctorId, selectedDate);
      setSlots(fetchedSlots);
    } catch (err: any) {
      console.error('Error fetching slots:', err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        setError(
          'Firestore permission error: Please copy and publish the updated firestore.rules in Firebase Console to grant access to the slots collection.'
        );
      } else {
        setError(err?.message || 'Unable to load slots for the selected date.');
      }
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedDoctorId, selectedDate]);

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      loadSlots();
    }
  }, [selectedDoctorId, selectedDate, loadSlots]);

  // Calculate preview slots
  const previewSlots = useMemo(() => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startTotal = (startH || 0) * 60 + (startM || 0);
    const endTotal = (endH || 0) * 60 + (endM || 0);

    if (endTotal <= startTotal || durationMinutes <= 0) return [];

    const calculated: { start: string; end: string }[] = [];
    for (let cur = startTotal; cur + durationMinutes <= endTotal; cur += durationMinutes) {
      const sH = Math.floor(cur / 60).toString().padStart(2, '0');
      const sM = (cur % 60).toString().padStart(2, '0');
      const eH = Math.floor((cur + durationMinutes) / 60).toString().padStart(2, '0');
      const eM = ((cur + durationMinutes) % 60).toString().padStart(2, '0');
      calculated.push({ start: `${sH}:${sM}`, end: `${eH}:${eM}` });
    }
    return calculated;
  }, [startTime, endTime, durationMinutes]);

  // Generate Slots
  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate) {
      setError('Please select a doctor and date first.');
      return;
    }

    if (previewSlots.length === 0) {
      setError('Please specify valid start and end times.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDoctorSlots(
        selectedDoctor.id,
        selectedDoctor.name,
        selectedDate,
        startTime,
        endTime,
        durationMinutes
      );

      if (result.createdCount > 0) {
        showToast(
          `Successfully created ${result.createdCount} slot(s). ${
            result.duplicateCount > 0 ? `(${result.duplicateCount} duplicate skipped)` : ''
          }`
        );
      } else {
        showToast(`All ${result.duplicateCount} calculated slots already exist for this date.`);
      }
      await loadSlots();
    } catch (err: any) {
      console.error('Error generating slots:', err);
      setError(err?.message || 'Failed to generate slots.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Slot Block/Unblock Status
  const handleToggleBlock = async (slot: DoctorSlot) => {
    const newStatus: SlotStatus = slot.status === 'blocked' ? 'available' : 'blocked';
    try {
      await updateSlotStatus(slot.id, newStatus);
      showToast(`Slot marked as ${newStatus}.`);
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, status: newStatus } : s))
      );
    } catch (err: any) {
      console.error('Error updating slot status:', err);
      setError('Failed to update slot status.');
    }
  };

  // Delete Slot
  const handleDeleteSlot = async (slot: DoctorSlot) => {
    if (slot.status === 'booked') {
      alert('Cannot delete a booked slot. Please cancel or reject the appointment first.');
      return;
    }

    const confirmed = window.confirm(
      `Delete slot ${slot.startTime} - ${slot.endTime} for ${selectedDoctor?.name}?`
    );
    if (!confirmed) return;

    try {
      await deleteSlot(slot.id);
      showToast('Slot deleted successfully.');
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
    } catch (err: any) {
      console.error('Error deleting slot:', err);
      setError(err?.message || 'Failed to delete slot.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
            Availability & Slots
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Configure doctor-specific consultation schedules and manage available booking slots.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSlots}
          disabled={isLoadingSlots}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-brand-line bg-white hover:bg-brand-bg rounded-lg text-xs sm:text-sm font-semibold text-brand-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingSlots ? 'animate-spin text-brand-blue' : ''}`} />
          <span>Refresh Slots</span>
        </button>
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
            onClick={() => setError(null)}
            className="text-xs font-bold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Doctor & Date Selection Controls */}
      <div className="bg-white p-5 rounded-card border border-brand-line shadow-card grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Doctor Selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="doctorSelect" className="text-xs sm:text-sm font-bold text-brand-ink flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-brand-blue" />
            <span>Consultant Doctor</span>
          </label>
          {isLoadingDoctors ? (
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ) : (
            <select
              id="doctorSelect"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} — {doc.role}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Consultation Date */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dateSelect" className="text-xs sm:text-sm font-bold text-brand-ink flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-blue" />
            <span>Consultation Date</span>
          </label>
          <input
            id="dateSelect"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      {/* Main Grid: Slot Generator & Scheduled Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Slot Generator Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-card border border-brand-line shadow-card">
          <div className="flex items-center gap-2 pb-4 border-b border-brand-line mb-4">
            <Sparkles className="w-5 h-5 text-brand-blue" />
            <h3 className="font-serif font-bold text-base text-brand-ink">
              Generate Slot Schedule
            </h3>
          </div>

          <form onSubmit={handleGenerateSlots} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Start Time */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-muted">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-3 py-2 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              {/* End Time */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-muted">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="px-3 py-2 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            {/* Slot Duration */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-brand-muted">Slot Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="px-3 py-2 border border-brand-line rounded-lg text-sm text-brand-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
              </select>
            </div>

            {/* Preview Box */}
            <div className="p-3 bg-brand-lightBlue/60 border border-brand-line/80 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-brand-blue2">
                <span>Calculated Slots:</span>
                <span className="bg-brand-blue text-white px-2 py-0.5 rounded-md">
                  {previewSlots.length} Slots
                </span>
              </div>
              <p className="text-brand-muted leading-relaxed">
                Will create {durationMinutes}-minute intervals from {startTime} to {endTime} for{' '}
                <b className="text-brand-ink">{selectedDoctor?.name || 'Selected Doctor'}</b> on {selectedDate}.
              </p>
            </div>

            <button
              type="submit"
              disabled={isGenerating || previewSlots.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue2 text-white font-bold rounded-lg text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isGenerating ? 'Creating Slots...' : `Create ${previewSlots.length} Slots`}</span>
            </button>
          </form>
        </div>

        {/* Scheduled Slots Display (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-card border border-brand-line shadow-card min-h-[360px]">
          <div className="flex items-center justify-between pb-4 border-b border-brand-line mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-brand-ink">
                Released Slots on {selectedDate}
              </h3>
              <p className="text-xs text-brand-muted">
                {selectedDoctor?.name} • {slots.length} total slot(s)
              </p>
            </div>

            {slots.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  {slots.filter((s) => s.status === 'available').length} Avail
                </span>
                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {slots.filter((s) => s.status === 'booked').length} Booked
                </span>
                <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-bold">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  {slots.filter((s) => s.status === 'blocked').length} Blocked
                </span>
              </div>
            )}
          </div>

          {isLoadingSlots ? (
            <div className="p-10 text-center">
              <div className="w-7 h-7 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-brand-muted">Loading scheduled slots...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-brand-line rounded-xl bg-slate-50/50">
              <Clock className="w-8 h-8 text-brand-muted/60 mx-auto mb-2" />
              <h4 className="font-serif font-bold text-sm text-brand-ink mb-1">
                No slots configured for this date
              </h4>
              <p className="text-xs text-brand-muted max-w-sm mx-auto">
                Use the generator on the left to release consultation slots for patients on the public booking portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
              {slots.map((slot) => {
                const isBooked = slot.status === 'booked';
                const isBlocked = slot.status === 'blocked';

                return (
                  <div
                    key={slot.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isBooked
                        ? 'bg-amber-50/60 border-amber-200'
                        : isBlocked
                        ? 'bg-gray-50 border-gray-200 opacity-80'
                        : 'bg-white border-brand-line hover:border-brand-blue'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isBooked
                            ? 'bg-amber-100 text-amber-700'
                            : isBlocked
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-brand-lightBlue text-brand-blue'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-brand-ink block">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wide inline-block ${
                            isBooked
                              ? 'text-amber-700'
                              : isBlocked
                              ? 'text-gray-500'
                              : 'text-green-600'
                          }`}
                        >
                          {slot.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isBooked && (
                        <button
                          type="button"
                          onClick={() => handleToggleBlock(slot)}
                          className="p-1.5 text-brand-muted hover:text-brand-ink hover:bg-slate-100 rounded-lg transition-colors"
                          title={isBlocked ? 'Unblock Slot' : 'Block Slot'}
                          aria-label={isBlocked ? 'Unblock Slot' : 'Block Slot'}
                        >
                          {isBlocked ? (
                            <Unlock className="w-4 h-4 text-green-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      )}

                      {!isBooked && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot)}
                          className="p-1.5 text-brand-red hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete slot"
                          aria-label="Delete slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
