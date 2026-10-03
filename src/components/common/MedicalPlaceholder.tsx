import React from 'react';

interface MedicalPlaceholderProps {
  type?: 'doctor' | 'femaleSupport' | 'maleSupport';
  className?: string;
}

export const MedicalPlaceholder: React.FC<MedicalPlaceholderProps> = ({
  type = 'doctor',
  className = '',
}) => {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#e6f5fa] to-[#f8fcfd] text-brand-blue select-none ${className}`}
      aria-hidden="true"
    >
      {type === 'doctor' && (
        <span className="text-4xl text-brand-blue">⚕</span>
      )}
      {type === 'femaleSupport' && (
        <span className="text-4xl" role="img" aria-label="Support Assistant">👩‍💼</span>
      )}
      {type === 'maleSupport' && (
        <span className="text-4xl" role="img" aria-label="Physiotherapist">🧑‍⚕️</span>
      )}
    </div>
  );
};
