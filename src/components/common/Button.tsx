import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'alt' | 'danger' | 'cta' | 'outline';
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  target?: string;
  rel?: string;
  'aria-label'?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  href,
  onClick,
  type = 'button',
  className = '',
  target,
  rel,
  'aria-label': ariaLabel,
  disabled = false,
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed';

  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-brand-blue text-white hover:bg-brand-blue2 py-3.5 px-5 rounded-[9px] text-base';
      break;
    case 'alt':
      variantStyles = 'bg-white text-brand-blue2 border border-brand-line hover:bg-slate-50 py-3.5 px-5 rounded-[9px] text-base';
      break;
    case 'danger':
      variantStyles = 'bg-brand-red text-white hover:bg-red-700 py-3.5 px-5 rounded-[9px] text-base';
      break;
    case 'cta':
      variantStyles = 'bg-brand-red text-white hover:bg-red-700 py-2.5 px-4 rounded-full text-sm font-semibold';
      break;
    case 'outline':
      variantStyles = 'bg-transparent text-brand-blue2 border border-brand-blue2 hover:bg-brand-blue2 hover:text-white py-2 px-4 rounded-lg text-sm';
      break;
  }

  const combinedClasses = `${baseStyles} ${variantStyles} ${className}`.trim();

  if (href) {
    return (
      <a
        href={href}
        className={combinedClasses}
        onClick={onClick}
        target={target}
        rel={target === '_blank' ? (rel || 'noopener noreferrer') : rel}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};
