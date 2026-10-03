import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { MobileNav } from './MobileNav';
import { Menu } from 'lucide-react';

const NAV_LINKS = [
  { name: 'About', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Doctors & Team', href: '#doctors' },
  { name: 'Gallery', href: '#gallery' },
  { name: 'Appointment', href: '#appointment' },
  { name: 'Contact', href: '#contact' },
];

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-white/95 backdrop-blur-sm transition-all duration-300 ${
          isScrolled
            ? 'shadow-header border-b border-brand-line/80 py-0.5'
            : 'shadow-sm border-b border-transparent py-0'
        }`}
      >
        <div className="container-custom">
          <nav className="flex items-center justify-between py-3 sm:py-3.5" aria-label="Main Navigation">
            {/* Brand */}
            <a
              href="#home"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-lg p-1"
            >
              <div
                className="w-[46px] h-[46px] sm:w-[54px] sm:h-[54px] border-[3px] border-[#2786aa] rounded-full flex items-center justify-center text-brand-red font-extrabold text-2xl sm:text-3xl relative transition-transform duration-200 group-hover:scale-105"
                aria-hidden="true"
              >
                +
              </div>
              <div>
                <span className="font-serif font-bold text-xl sm:text-[21px] leading-tight text-brand-blue2 block">
                  Deccan Care
                </span>
                <small className="block text-[#657782] text-[9px] sm:text-[10px] font-bold tracking-wider mt-0.5 uppercase">
                  MATERNITY & GENERAL HOSPITAL
                </small>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-brand-ink">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="hover:text-brand-blue transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded py-1 px-2"
                >
                  {link.name}
                </a>
              ))}
              <Button href="tel:+917411140480" variant="cta">
                Call Now
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <Button href="tel:+917411140480" variant="cta" className="text-xs py-1.5 px-3 sm:text-sm sm:py-2 sm:px-4">
                Call Now
              </Button>
              <button
                type="button"
                className="p-2 text-brand-ink rounded-lg hover:bg-brand-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open Navigation Menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navLinks={NAV_LINKS}
      />
    </>
  );
};
