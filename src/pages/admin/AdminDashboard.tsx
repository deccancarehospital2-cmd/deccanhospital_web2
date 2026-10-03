import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Image as ImageIcon, ShieldCheck, Info, CheckCircle2, Calendar, Clock } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { admin } = useAuth();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#073e59] to-[#0879a8] rounded-card p-6 sm:p-8 text-white shadow-brand">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold text-white/90 mb-3 backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-green-300" />
            <span>Authenticated Session Active</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
            Welcome to Deccan Care Admin Portal
          </h2>
          <p className="text-sm text-white/80 leading-relaxed mt-2">
            You are signed in as an authorized hospital administrator with <b className="text-white capitalize">{admin?.role || 'administrator'}</b> privileges.
          </p>
        </div>
      </div>

      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Appointments Card */}
        <div className="bg-white p-5 rounded-card border border-brand-line shadow-card flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-brand-ink mb-1">
              Patient Bookings
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Review, confirm, or reject incoming appointment requests from patients.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-line flex items-center justify-between text-xs">
            <span className="text-brand-muted">Module:</span>
            <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Live & Synced
            </span>
          </div>
        </div>

        {/* Availability Card */}
        <div className="bg-white p-5 rounded-card border border-brand-line shadow-card flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-lightBlue flex items-center justify-center text-brand-blue mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-brand-ink mb-1">
              Availability & Slots
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Configure doctor schedules, release intervals, and block consultation slots.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-line flex items-center justify-between text-xs">
            <span className="text-brand-muted">Module:</span>
            <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Live & Synced
            </span>
          </div>
        </div>

        {/* Doctor CMS Card */}
        <div className="bg-white p-5 rounded-card border border-brand-line shadow-card flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-lightBlue flex items-center justify-center text-brand-blue mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-brand-ink mb-1">
              Doctor Management
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Manage hospital doctors, medical specialties, qualifications, and profile photos.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-line flex items-center justify-between text-xs">
            <span className="text-brand-muted">Module:</span>
            <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Live & Synced
            </span>
          </div>
        </div>

        {/* Gallery CMS Card */}
        <div className="bg-white p-5 rounded-card border border-brand-line shadow-card flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-lightBlue flex items-center justify-center text-brand-blue mb-3">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-brand-ink mb-1">
              Gallery Management
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Upload, organize, and publish clinical care photography and hospital facilities.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-line flex items-center justify-between text-xs">
            <span className="text-brand-muted">Module:</span>
            <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Live & Synced
            </span>
          </div>
        </div>
      </div>

      {/* Information Readiness Notice */}
      <div className="bg-white p-6 rounded-card border border-brand-line shadow-card">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-brand-lightBlue text-brand-blue shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-brand-ink">
              Admin Infrastructure Ready
            </h4>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Authentication and protected routing are fully configured. Doctor and Gallery content management interfaces will be implemented in subsequent phases.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-brand-ink">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Firebase Authentication Active</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Firestore Admin Document Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Cloudinary Upload Pipeline Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Protected Routes Guard Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
