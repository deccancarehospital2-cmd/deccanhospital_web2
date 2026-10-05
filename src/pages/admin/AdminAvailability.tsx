import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Doctor, DayOfWeek, DoctorWeeklySchedule, DEFAULT_DOCTOR_SCHEDULE } from '../../types/doctor';
import { DoctorSlot, SlotStatus } from '../../types/appointment';
import {
  fetchAllDoctors,
  fetchSlotsForDoctorAndDate,
  updateDoctorSchedule,
  toggleDoctorBlockedDate,
  updateSlotStatus,
  getDayOfWeekFromDateString,
  parseTimeToMinutes,
  formatMinutesToTime,
} from '../../services/firestore';
import {
  Calendar,
  Clock,
  Save,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarOff,
  Plus,
  Trash2,
} from 'lucide-react';

const ALL_DAYS: { id: DayOfWeek; label: string; short: string }[] = [
  { id: 'monday', label: 'Monday', short: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday', label: 'Thursday', short: 'Thu' },
  { id: 'friday', label: 'Friday', short: 'Fri' },
  { id: 'saturday', label: 'Saturday', short: 'Sat' },
  { id: 'sunday', label: 'Sunday', short: 'Sun' },
];

export const AdminAvailability: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Schedule Form State
  const [isScheduleEnabled, setIsScheduleEnabled] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('13:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  // Blocked date input state
  const [newBlockedDate, setNewBlockedDate] = useState<string>('');

  // Date Inspector State
  const [inspectDate, setInspectDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [inspectSlots, setInspectSlots] = useState<DoctorSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // General Loading & Feedback State
  const [isLoadingDoctors, setIsLoadingDoctors] = useState<boolean>(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);
  const [isUpdatingDateOverride, setIsUpdatingDateOverride] = useState<boolean>(false);
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
        const clinicalDocs = docs.filter((d) => d.isActive !== false && !d.isSupportStaff);
        const list = clinicalDocs.length > 0 ? clinicalDocs : docs;
        setDoctors(list);
        if (list.length > 0) {
          setSelectedDoctorId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load doctors for schedule management:', err);
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

  // Sync form state when selected doctor changes
  useEffect(() => {
    if (!selectedDoctor) return;
    const schedule = selectedDoctor.schedule || DEFAULT_DOCTOR_SCHEDULE;
    setIsScheduleEnabled(schedule.enabled !== false);
    setSelectedDays(schedule.days || DEFAULT_DOCTOR_SCHEDULE.days);
    setStartTime(schedule.startTime || DEFAULT_DOCTOR_SCHEDULE.startTime);
    setEndTime(schedule.endTime || DEFAULT_DOCTOR_SCHEDULE.endTime);
    setDurationMinutes(schedule.durationMinutes || DEFAULT_DOCTOR_SCHEDULE.durationMinutes);
    setBlockedDates(schedule.blockedDates || []);
  }, [selectedDoctor]);

  // Load live slots for the inspector date
  const loadInspectSlots = useCallback(async () => {
    if (!selectedDoctorId || !inspectDate) return;
    setIsLoadingSlots(true);
    try {
      const scheduleSnapshot: DoctorWeeklySchedule = {
        enabled: isScheduleEnabled,
        days: selectedDays,
        startTime,
        endTime,
        durationMinutes,
        blockedDates,
      };
      const fetchedSlots = await fetchSlotsForDoctorAndDate(
        selectedDoctorId,
        inspectDate,
        scheduleSnapshot,
        selectedDoctor?.name
      );
      setInspectSlots(fetchedSlots);
    } catch (err: any) {
      console.error('Error fetching inspect slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedDoctorId, inspectDate, isScheduleEnabled, selectedDays, startTime, endTime, durationMinutes, blockedDates, selectedDoctor]);

  useEffect(() => {
    if (selectedDoctorId && inspectDate) {
      loadInspectSlots();
    }
  }, [selectedDoctorId, inspectDate, loadInspectSlots]);

  // Calculate preview slots for the recurring template
  const previewDailySlots = useMemo(() => {
    const startTotal = parseTimeToMinutes(startTime);
    const endTotal = parseTimeToMinutes(endTime);

    if (endTotal <= startTotal || durationMinutes <= 0) return [];

    const calculated: { start: string; end: string }[] = [];
    for (let cur = startTotal; cur + durationMinutes <= endTotal; cur += durationMinutes) {
      calculated.push({
        start: formatMinutesToTime(cur),
        end: formatMinutesToTime(cur + durationMinutes),
      });
    }
    return calculated;
  }, [startTime, endTime, durationMinutes]);

  // Toggle Day of Week
  const handleToggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  // Save Recurring Schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    if (isScheduleEnabled && selectedDays.length === 0) {
      setError('Please select at least one consultation day of the week.');
      return;
    }

    if (isScheduleEnabled && previewDailySlots.length === 0) {
      setError('Start time must be before end time and duration must be greater than 0.');
      return;
    }

    setIsSavingSchedule(true);
    setError(null);
    try {
      const updatedSchedule: DoctorWeeklySchedule = {
        enabled: isScheduleEnabled,
        days: selectedDays,
        startTime,
        endTime,
        durationMinutes,
        blockedDates,
      };

      await updateDoctorSchedule(selectedDoctor.id, updatedSchedule);

      // Update local doctors state
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === selectedDoctor.id ? { ...d, schedule: updatedSchedule } : d
        )
      );

      showToast(`Recurring schedule for ${selectedDoctor.name} updated successfully!`);
      await loadInspectSlots();
    } catch (err: any) {
      console.error('Failed to save doctor schedule:', err);
      setError(err?.message || 'Failed to update schedule in database.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Add Blocked Date Override
  const handleAddBlockedDate = async () => {
    if (!newBlockedDate || !selectedDoctor) return;
    if (blockedDates.includes(newBlockedDate)) {
      showToast('This date is already blocked.');
      return;
    }

    setIsUpdatingDateOverride(true);
    try {
      const updated = await toggleDoctorBlockedDate(selectedDoctor.id, newBlockedDate, true);
      setBlockedDates(updated);
      setNewBlockedDate('');
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === selectedDoctor.id
            ? { ...d, schedule: { ...(d.schedule || DEFAULT_DOCTOR_SCHEDULE), blockedDates: updated } }
            : d
        )
      );
      showToast(`Blocked date ${newBlockedDate} added.`);
      await loadInspectSlots();
    } catch (err: any) {
      console.error('Failed to block date:', err);
      setError('Failed to update blocked dates.');
    } finally {
      setIsUpdatingDateOverride(false);
    }
  };

  // Remove Blocked Date Override
  const handleRemoveBlockedDate = async (dateStr: string) => {
    if (!selectedDoctor) return;
    setIsUpdatingDateOverride(true);
    try {
      const updated = await toggleDoctorBlockedDate(selectedDoctor.id, dateStr, false);
      setBlockedDates(updated);
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === selectedDoctor.id
            ? { ...d, schedule: { ...(d.schedule || DEFAULT_DOCTOR_SCHEDULE), blockedDates: updated } }
            : d
        )
      );
      showToast(`Unblocked date ${dateStr}.`);
      await loadInspectSlots();
    } catch (err: any) {
      console.error('Failed to remove blocked date:', err);
      setError('Failed to remove blocked date.');
    } finally {
      setIsUpdatingDateOverride(false);
    }
  };

  // Toggle Slot Status on inspected date (Block / Unblock individual slot)
  const handleToggleSlotStatus = async (slot: DoctorSlot) => {
    if (slot.status === 'booked') {
      showToast('This slot has an active patient booking. Manage it from the Appointments tab.');
      return;
    }

    const newStatus: SlotStatus = slot.status === 'available' ? 'blocked' : 'available';
    try {
      await updateSlotStatus(slot.id, newStatus, {
        doctorId: slot.doctorId,
        doctorName: slot.doctorNameSnapshot,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });

      setInspectSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, status: newStatus } : s))
      );
      showToast(`Slot ${slot.startTime} marked as ${newStatus}.`);
    } catch (err: any) {
      console.error('Failed to update slot status:', err);
      setError('Failed to update slot status.');
    }
  };

  const inspectDayOfWeek = inspectDate ? getDayOfWeekFromDateString(inspectDate) : '';
  const isInspectDateBlocked = blockedDates.includes(inspectDate);
  const isInspectDayActive = selectedDays.includes(inspectDayOfWeek as DayOfWeek);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-brand-ink text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-brand-line text-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
            Doctor Availability & Recurring Schedules
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Configure doctors' recurring weekly consultation days and hours. Future slots repeat automatically without manual generation.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-card flex items-start gap-3 text-sm text-brand-red">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <b className="block">Configuration Notice:</b>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Step 1: Doctor Selector Card */}
      <div className="bg-white p-5 sm:p-6 rounded-card border border-brand-line shadow-card space-y-4">
        <label htmlFor="doctorSelect" className="block text-xs font-bold text-brand-muted uppercase tracking-wider">
          Select Doctor
        </label>
        {isLoadingDoctors ? (
          <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
              <select
                id="doctorSelect"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-4 py-3 border border-brand-line rounded-lg text-sm font-semibold text-brand-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.role} {d.qualifications ? `(${d.qualifications})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedDoctor && (
              <div className="flex items-center gap-3 p-3 bg-brand-lightBlue/60 border border-brand-line rounded-lg text-xs">
                <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedDoctor.name.charAt(3) || 'D'}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-brand-ink block truncate">{selectedDoctor.name}</span>
                  <span className="text-brand-muted text-[11px] block truncate">{selectedDoctor.role}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Recurring Weekly Schedule & Date Overrides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Weekly Recurring Schedule Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-7 rounded-card border border-brand-line shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-brand-line">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-brand-blue" />
              <h3 className="font-serif font-bold text-lg text-brand-ink">
                Weekly Consultation Schedule
              </h3>
            </div>
            {/* Enable/Disable Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-bold text-brand-muted">
                {isScheduleEnabled ? 'Consultations Active' : 'Disabled'}
              </span>
              <input
                type="checkbox"
                checked={isScheduleEnabled}
                onChange={(e) => setIsScheduleEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 relative" />
            </label>
          </div>

          <form onSubmit={handleSaveSchedule} className="space-y-5">
            {/* Consultation Days of the Week */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-ink block">
                Working Days of the Week <span className="text-brand-red">*</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {ALL_DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleToggleDay(day.id)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-brand-muted border-brand-line'
                      }`}
                    >
                      <span>{day.short}</span>
                      <span className="text-[10px] font-normal opacity-80">
                        {isSelected ? '✓ On' : 'Off'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timing & Slot Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="startTime" className="text-xs font-bold text-brand-ink">
                  Start Time <span className="text-brand-red">*</span>
                </label>
                <input
                  id="startTime"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="endTime" className="text-xs font-bold text-brand-ink">
                  End Time <span className="text-brand-red">*</span>
                </label>
                <input
                  id="endTime"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="duration" className="text-xs font-bold text-brand-ink">
                  Slot Duration <span className="text-brand-red">*</span>
                </label>
                <select
                  id="duration"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-brand-line rounded-lg text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                </select>
              </div>
            </div>

            {/* Calculated Daily Slots Preview */}
            <div className="p-4 bg-brand-lightBlue/40 border border-brand-line rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-brand-blue">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                  Calculated Schedule Pattern:
                </span>
                <span className="font-bold text-brand-ink">
                  {previewDailySlots.length} slots / working day
                </span>
              </div>
              {previewDailySlots.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                  {previewDailySlots.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white border border-brand-line text-[11px] font-bold text-brand-ink rounded shadow-2xs"
                    >
                      {s.start} - {s.end}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-brand-red">
                  End time must be after start time.
                </span>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSchedule}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue2 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isSavingSchedule ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Recurring Schedule</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Blocked Dates / Leaves (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-7 rounded-card border border-brand-line shadow-card space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-brand-line">
            <CalendarOff className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-serif font-bold text-base text-brand-ink">
                Date Overrides & Leaves
              </h3>
              <p className="text-[11px] text-brand-muted">
                Temporarily block all slots for a specific date (leave / holiday).
              </p>
            </div>
          </div>

          {/* Add Blocked Date Input */}
          <div className="flex gap-2">
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-brand-line rounded-lg text-xs text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <button
              type="button"
              disabled={!newBlockedDate || isUpdatingDateOverride}
              onClick={handleAddBlockedDate}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Block Date</span>
            </button>
          </div>

          {/* List of Blocked Dates */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-brand-ink block">
              Currently Blocked Dates ({blockedDates.length})
            </span>
            {blockedDates.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-brand-muted border border-dashed border-brand-line">
                No leave or blocked dates configured for this doctor.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {blockedDates.map((dateStr) => (
                  <div
                    key={dateStr}
                    className="flex items-center justify-between p-2.5 bg-red-50/60 border border-red-200/60 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarOff className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="font-bold text-brand-ink">{dateStr}</span>
                    </div>
                    <button
                      type="button"
                      disabled={isUpdatingDateOverride}
                      onClick={() => handleRemoveBlockedDate(dateStr)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                      title="Unblock this date"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Live Date Slot Inspector & Slot Status Override */}
      <div className="bg-white p-5 sm:p-7 rounded-card border border-brand-line shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-line">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-brand-blue" />
            <div>
              <h3 className="font-serif font-bold text-lg text-brand-ink">
                Live Date Slot Inspector
              </h3>
              <p className="text-xs text-brand-muted">
                Inspect calculated slots for any specific date and manually block/unblock individual time intervals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="inspectDate" className="text-xs font-bold text-brand-muted uppercase shrink-0">
              Inspect Date:
            </label>
            <input
              id="inspectDate"
              type="date"
              value={inspectDate}
              onChange={(e) => setInspectDate(e.target.value)}
              className="px-3 py-2 border border-brand-line rounded-lg text-xs font-bold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>

        {/* Date Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-brand-muted font-medium">Date Evaluation:</span>
          <span className="px-2.5 py-1 bg-slate-100 text-brand-ink font-bold rounded-md capitalize">
            {inspectDayOfWeek} ({inspectDate})
          </span>
          {isInspectDateBlocked ? (
            <span className="px-2.5 py-1 bg-red-100 text-red-700 font-bold rounded-md">
              ⚠ Date Blocked (Leave/Holiday)
            </span>
          ) : !isInspectDayActive ? (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-md">
              Doctor Not Available on {inspectDayOfWeek}s
            </span>
          ) : !isScheduleEnabled ? (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold rounded-md">
              Schedule Disabled
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-green-100 text-green-700 font-bold rounded-md">
              ✓ Active Working Day
            </span>
          )}
        </div>

        {/* Slots Grid */}
        {isLoadingSlots ? (
          <div className="p-8 bg-slate-50 rounded-xl text-center border border-brand-line">
            <div className="w-6 h-6 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs font-semibold text-brand-muted">Loading live slots for {inspectDate}...</span>
          </div>
        ) : inspectSlots.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-xl text-center border border-dashed border-brand-line space-y-1">
            <Clock className="w-6 h-6 text-brand-muted mx-auto mb-1" />
            <p className="text-xs sm:text-sm font-bold text-brand-ink">
              No consultation slots available for this date.
            </p>
            <p className="text-xs text-brand-muted max-w-md mx-auto">
              Dr. {selectedDoctor?.name} does not have active consultation hours on {inspectDate}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {inspectSlots.map((slot) => {
              const isAvailable = slot.status === 'available';
              const isBooked = slot.status === 'booked';
              const isBlocked = slot.status === 'blocked';

              return (
                <div
                  key={slot.id}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 transition-all ${
                    isBooked
                      ? 'bg-amber-50/70 border-amber-300 text-amber-900 shadow-2xs'
                      : isBlocked
                      ? 'bg-gray-100 border-gray-300 text-gray-500'
                      : 'bg-white border-brand-line text-brand-ink shadow-2xs hover:border-brand-blue'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-sm">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider block mt-0.5 ${
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

                  {!isBooked && (
                    <button
                      type="button"
                      onClick={() => handleToggleSlotStatus(slot)}
                      className={`w-full py-1.5 px-2 rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1 ${
                        isAvailable
                          ? 'bg-red-50 hover:bg-red-100 text-brand-red'
                          : 'bg-green-50 hover:bg-green-100 text-green-700'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Block</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Unblock</span>
                        </>
                      )}
                    </button>
                  )}

                  {isBooked && (
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-100/70 px-1.5 py-0.5 rounded text-center">
                      Patient Booked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
