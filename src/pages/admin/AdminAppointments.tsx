import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { Doctor } from '../../types/doctor';
import {
  fetchAllAppointments,
  fetchAllDoctors,
  confirmAppointment,
  rejectAppointment,
  cancelAppointment,
  completeAppointment,
} from '../../services/firestore';
import {
  Calendar,
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Check,
  X,
  Eye,
} from 'lucide-react';

export const AdminAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Action States
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rejectingAppointment, setRejectingAppointment] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load appointments and doctors
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [appts, docs] = await Promise.all([
        fetchAllAppointments(),
        fetchAllDoctors(),
      ]);
      setAppointments(appts);
      setDoctors(docs);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        setError(
          'Firestore permission error: Please copy and publish the updated firestore.rules in Firebase Console to grant access to the appointments collection.'
        );
      } else {
        setError(err?.message || 'Unable to load appointments from Firestore.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Action Handlers
  const handleConfirm = async (appt: Appointment) => {
    setIsProcessingAction(true);
    try {
      await confirmAppointment(appt.id);
      showToast(`Appointment for ${appt.patientName} confirmed.`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: 'confirmed' } : a))
      );
      if (selectedAppointment?.id === appt.id) {
        setSelectedAppointment((prev) => prev ? { ...prev, status: 'confirmed' } : null);
      }
    } catch (err: any) {
      console.error('Error confirming appointment:', err);
      setError('Failed to confirm appointment.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingAppointment) return;

    setIsProcessingAction(true);
    try {
      await rejectAppointment(
        rejectingAppointment.id,
        rejectingAppointment.slotId,
        rejectionReason
      );
      showToast(`Appointment rejected and slot released.`);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === rejectingAppointment.id
            ? { ...a, status: 'rejected', rejectionReason }
            : a
        )
      );
      setRejectingAppointment(null);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Error rejecting appointment:', err);
      setError('Failed to reject appointment.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCancel = async (appt: Appointment) => {
    const confirmed = window.confirm(
      `Cancel appointment for ${appt.patientName}? This will release the reserved time slot.`
    );
    if (!confirmed) return;

    setIsProcessingAction(true);
    try {
      await cancelAppointment(appt.id, appt.slotId);
      showToast(`Appointment cancelled and slot released.`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: 'cancelled' } : a))
      );
      if (selectedAppointment?.id === appt.id) {
        setSelectedAppointment((prev) => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      setError('Failed to cancel appointment.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleComplete = async (appt: Appointment) => {
    setIsProcessingAction(true);
    try {
      await completeAppointment(appt.id);
      showToast(`Appointment marked as completed.`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: 'completed' } : a))
      );
      if (selectedAppointment?.id === appt.id) {
        setSelectedAppointment((prev) => prev ? { ...prev, status: 'completed' } : null);
      }
    } catch (err: any) {
      console.error('Error completing appointment:', err);
      setError('Failed to complete appointment.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Status filter
      if (statusFilter !== 'all' && appt.status !== statusFilter) {
        return false;
      }
      // Doctor filter
      if (doctorFilter !== 'all' && appt.doctorId !== doctorFilter) {
        return false;
      }
      // Date filter
      if (dateFilter && appt.date !== dateFilter) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = appt.patientName?.toLowerCase().includes(query);
        const matchesPhone = appt.patientPhone?.includes(query);
        const matchesEmail = appt.patientEmail?.toLowerCase().includes(query);
        const matchesDoctor = appt.doctorNameSnapshot?.toLowerCase().includes(query);
        const matchesId = appt.id?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesDoctor && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, statusFilter, doctorFilter, dateFilter, searchQuery]);

  // Summary counts
  const summary = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      rejected: appointments.filter((a) => a.status === 'rejected').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    };
  }, [appointments]);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 bg-green-50 text-green-800 border border-green-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
            Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 border border-red-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 border border-gray-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Cancelled
          </span>
        );
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
            Patient Appointments
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Manage incoming appointment requests, verify patient bookings, and update consultation statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-brand-line bg-white hover:bg-brand-bg rounded-lg text-xs sm:text-sm font-semibold text-brand-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-blue' : ''}`} />
          <span>Refresh List</span>
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-brand-lightBlue border-brand-blue shadow-sm'
              : 'bg-white border-brand-line hover:border-brand-blue/50'
          }`}
        >
          <span className="text-[11px] font-bold text-brand-muted block">All Bookings</span>
          <span className="text-xl font-bold text-brand-ink">{summary.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-50 border-amber-400 shadow-sm'
              : 'bg-white border-brand-line hover:border-amber-300'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-700 block">Pending</span>
          <span className="text-xl font-bold text-amber-900">{summary.pending}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('confirmed')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'confirmed'
              ? 'bg-green-50 border-green-400 shadow-sm'
              : 'bg-white border-brand-line hover:border-green-300'
          }`}
        >
          <span className="text-[11px] font-bold text-green-700 block">Confirmed</span>
          <span className="text-xl font-bold text-green-900">{summary.confirmed}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'completed'
              ? 'bg-blue-50 border-blue-400 shadow-sm'
              : 'bg-white border-brand-line hover:border-blue-300'
          }`}
        >
          <span className="text-[11px] font-bold text-blue-700 block">Completed</span>
          <span className="text-xl font-bold text-blue-900">{summary.completed}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'rejected'
              ? 'bg-red-50 border-red-400 shadow-sm'
              : 'bg-white border-brand-line hover:border-red-300'
          }`}
        >
          <span className="text-[11px] font-bold text-red-700 block">Rejected</span>
          <span className="text-xl font-bold text-red-900">{summary.rejected}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('cancelled')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'cancelled'
              ? 'bg-gray-100 border-gray-400 shadow-sm'
              : 'bg-white border-brand-line hover:border-gray-300'
          }`}
        >
          <span className="text-[11px] font-bold text-gray-600 block">Cancelled</span>
          <span className="text-xl font-bold text-gray-800">{summary.cancelled}</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-brand-line shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, phone, doctor..."
            className="w-full pl-9 pr-3 py-2 border border-brand-line rounded-lg text-xs sm:text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 border border-brand-line rounded-lg text-xs font-semibold text-brand-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="all">Doctor: All</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 border border-brand-line rounded-lg text-xs font-semibold text-brand-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />

          {(doctorFilter !== 'all' || dateFilter || searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setDoctorFilter('all');
                setDateFilter('');
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-xs font-bold text-brand-blue hover:underline px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Appointments List / Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-brand-line p-12 text-center shadow-card">
          <div className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-brand-ink">Loading patient appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-line p-12 text-center shadow-card">
          <Calendar className="w-10 h-10 text-brand-muted/60 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-brand-ink mb-1">
            No appointments found
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto">
            {appointments.length === 0
              ? 'Incoming patient bookings from the public website will appear here in real-time.'
              : 'No appointments match the active filters or search query.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-line shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-brand-line text-xs font-bold text-brand-muted uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Doctor & Specialty</th>
                  <th className="px-5 py-3.5">Date & Slot</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-brand-bg/50 transition-colors">
                    {/* Patient Details */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-brand-ink">{appt.patientName}</div>
                      <div className="text-xs text-brand-muted flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-brand-blue" />
                          {appt.patientPhone}
                        </span>
                        {appt.patientEmail && (
                          <span className="hidden sm:flex items-center gap-1">
                            <Mail className="w-3 h-3 text-brand-muted" />
                            {appt.patientEmail}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Doctor & Specialty */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-brand-ink">
                        {appt.doctorNameSnapshot || 'Consultant'}
                      </div>
                      <div className="text-xs text-brand-muted">
                        {appt.doctorRoleSnapshot || appt.department}
                      </div>
                    </td>

                    {/* Date & Slot */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-ink">
                        <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                        <span>{appt.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-brand-muted mt-0.5 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {appt.slotStart} - {appt.slotEnd}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">{getStatusBadge(appt.status)}</td>

                    {/* Action Buttons */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedAppointment(appt)}
                          className="p-1.5 text-brand-blue hover:bg-brand-lightBlue rounded-lg transition-colors"
                          title="View Full Booking Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Pending Actions */}
                        {appt.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleConfirm(appt)}
                              disabled={isProcessingAction}
                              className="p-1.5 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                              title="Confirm Appointment"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingAppointment(appt);
                                setRejectionReason('');
                              }}
                              disabled={isProcessingAction}
                              className="p-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              title="Reject Appointment"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Confirmed Actions */}
                        {appt.status === 'confirmed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleComplete(appt)}
                              disabled={isProcessingAction}
                              className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(appt)}
                              disabled={isProcessingAction}
                              className="p-1.5 text-gray-500 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel Appointment"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Appointment Details"
        >
          <div className="bg-white rounded-card shadow-2xl max-w-lg w-full p-6 border border-brand-line space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-line">
              <h3 className="font-serif font-bold text-lg text-brand-ink">
                Appointment Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 text-brand-muted hover:text-brand-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-brand-muted text-xs font-bold uppercase">Status</span>
                {getStatusBadge(selectedAppointment.status)}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1.5">
                <span className="text-xs font-bold text-brand-muted block">Patient Information</span>
                <div className="font-bold text-brand-ink text-base">{selectedAppointment.patientName}</div>
                <div className="text-xs text-brand-ink">📞 {selectedAppointment.patientPhone}</div>
                {selectedAppointment.patientEmail && (
                  <div className="text-xs text-brand-ink">✉️ {selectedAppointment.patientEmail}</div>
                )}
              </div>

              <div className="p-3 bg-brand-lightBlue/50 rounded-lg space-y-1.5">
                <span className="text-xs font-bold text-brand-muted block">Consultation Info</span>
                <div className="font-bold text-brand-ink">{selectedAppointment.doctorNameSnapshot}</div>
                <div className="text-xs text-brand-muted">{selectedAppointment.doctorRoleSnapshot || selectedAppointment.department}</div>
                <div className="text-xs font-bold text-brand-blue mt-1">
                  📅 {selectedAppointment.date} • ⏰ {selectedAppointment.slotStart} - {selectedAppointment.slotEnd}
                </div>
              </div>

              {selectedAppointment.patientMessage && (
                <div className="p-3 bg-white border border-brand-line rounded-lg">
                  <span className="text-xs font-bold text-brand-muted block mb-1">Patient Note / Reason</span>
                  <p className="text-xs text-brand-ink leading-relaxed">
                    "{selectedAppointment.patientMessage}"
                  </p>
                </div>
              )}

              {selectedAppointment.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-brand-red">
                  <b>Rejection Reason:</b> {selectedAppointment.rejectionReason}
                </div>
              )}

              <div className="text-[11px] text-brand-muted pt-2 border-t border-brand-line">
                Reference ID: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{selectedAppointment.id}</code>
              </div>
            </div>

            <div className="pt-3 border-t border-brand-line flex items-center justify-end gap-2">
              {selectedAppointment.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleConfirm(selectedAppointment);
                    }}
                    disabled={isProcessingAction}
                    className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    Confirm Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingAppointment(selectedAppointment);
                      setSelectedAppointment(null);
                    }}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-brand-red font-bold rounded-lg text-xs transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brand-ink font-semibold rounded-lg text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Reject Appointment Request"
        >
          <div className="bg-white rounded-card shadow-2xl max-w-md w-full p-6 border border-brand-line space-y-4">
            <h3 className="font-serif font-bold text-lg text-brand-ink">
              Reject Appointment Request?
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted">
              Rejecting this appointment will automatically release the slot ({rejectingAppointment.slotStart} - {rejectingAppointment.slotEnd} on {rejectingAppointment.date}) for other patients.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-brand-ink">
                  Reason for Rejection (Optional)
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Doctor emergency surgery, Doctor on leave"
                  className="px-3 py-2 border border-brand-line rounded-lg text-xs text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingAppointment(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-brand-ink hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-red hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isProcessingAction ? 'Rejecting...' : 'Reject & Release Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
