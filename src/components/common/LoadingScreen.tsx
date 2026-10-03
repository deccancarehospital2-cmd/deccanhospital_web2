import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Verifying authorization...',
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-6 text-center">
      <div className="flex flex-col items-center max-w-sm">
        {/* Brand Mark with subtle pulse */}
        <div
          className="w-14 h-14 border-[3px] border-[#2786aa] rounded-full flex items-center justify-center text-brand-red font-extrabold text-2xl bg-white shadow-card mb-5 relative"
          aria-hidden="true"
        >
          +
          <div className="absolute inset-0 rounded-full border-2 border-brand-blue/30 border-t-brand-blue animate-spin -m-[5px]" />
        </div>

        <h3 className="font-serif font-bold text-lg text-brand-ink mb-1">
          Deccan Care Hospital
        </h3>
        <p className="text-xs sm:text-sm text-brand-muted">
          {message}
        </p>
      </div>
    </div>
  );
};
