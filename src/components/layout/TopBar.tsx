import React from 'react';

export const TopBar: React.FC = () => {
  return (
    <div className="bg-brand-dark text-white text-[13px] py-2">
      <div className="container-custom flex flex-col sm:flex-row justify-between gap-1 sm:gap-5 items-center">
        <span>Deccan Care Maternity & General Hospital</span>
        <span>Kalaburagi, Karnataka • 24×7 Contact</span>
      </div>
    </div>
  );
};
