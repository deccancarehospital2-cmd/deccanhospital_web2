import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  CalendarCheck,
  Clock,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  UserCog,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, admin, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login/admin', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      status: 'active',
      isUpcoming: false,
    },
    {
      name: 'Appointments',
      path: '/admin/appointments',
      icon: CalendarCheck,
      status: 'active',
      isUpcoming: false,
    },
    {
      name: 'Availability & Slots',
      path: '/admin/availability',
      icon: Clock,
      status: 'active',
      isUpcoming: false,
    },
    {
      name: 'Doctors & Team',
      path: '/admin/doctors',
      icon: Users,
      status: 'active',
      isUpcoming: false,
    },
    {
      name: 'Hospital Gallery',
      path: '/admin/gallery',
      icon: ImageIcon,
      status: 'active',
      isUpcoming: false,
    },
    ...(isSuperAdmin
      ? [
          {
            name: 'Admin Management',
            path: '/admin/admins',
            icon: UserCog,
            status: 'active',
            isUpcoming: false,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex bg-brand-bg text-brand-ink selection:bg-brand-blue selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-white border-r border-brand-line p-5 shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-brand-line">
            <div
              className="w-10 h-10 border-2 border-[#2786aa] rounded-full flex items-center justify-center text-brand-red font-extrabold text-xl shadow-sm shrink-0"
              aria-hidden="true"
            >
              +
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-brand-blue2 block leading-tight">
                Deccan Care
              </span>
              <span className="text-[9px] text-brand-muted font-bold tracking-wider block uppercase">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5" aria-label="Admin Navigation">
            {navItems.map((item) => (
              <div key={item.name}>
                {item.isUpcoming ? (
                  <div
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold text-gray-400 bg-gray-50/50 cursor-not-allowed select-none"
                    title={`${item.name} management will be enabled in ${item.status}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-gray-400" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded">
                      {item.status}
                    </span>
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-brand-lightBlue text-brand-blue font-bold shadow-sm'
                          : 'text-brand-ink hover:bg-brand-bg hover:text-brand-blue'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom Action */}
        <div className="pt-6 border-t border-brand-line space-y-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-brand-muted hover:text-brand-blue transition-colors rounded-lg hover:bg-brand-bg"
          >
            <span>View Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Admin Mobile Navigation"
        >
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-brand-line">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 border-2 border-[#2786aa] rounded-full flex items-center justify-center text-brand-red font-extrabold text-lg">
                    +
                  </div>
                  <div>
                    <span className="font-serif font-bold text-base text-brand-blue2 block leading-none">
                      Deccan Care
                    </span>
                    <span className="text-[9px] text-brand-muted font-bold tracking-wider block uppercase mt-0.5">
                      Admin Portal
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-brand-muted hover:text-brand-ink rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-5 space-y-1.5">
                {navItems.map((item) => (
                  <div key={item.name}>
                    {item.isUpcoming ? (
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-400 bg-gray-50/50">
                        <div className="flex items-center gap-2.5">
                          <item.icon className="w-4 h-4 text-gray-400" />
                          <span>{item.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-200/60 px-1.5 py-0.5 rounded">
                          {item.status}
                        </span>
                      </div>
                    ) : (
                      <NavLink
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                            isActive
                              ? 'bg-brand-lightBlue text-brand-blue font-bold'
                              : 'text-brand-ink hover:bg-brand-bg'
                          }`
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </NavLink>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-brand-line">
              <a
                href="/"
                className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-brand-muted hover:text-brand-blue"
              >
                <span>View Public Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-brand-line px-5 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-brand-ink hover:bg-brand-bg rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-serif font-bold text-brand-ink">
              Hospital Administration
            </h1>
          </div>

          {/* User Status & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-brand-ink">
                {user?.email}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                {admin?.role || 'Authorized Admin'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-red bg-red-50 hover:bg-red-100/80 border border-red-200/60 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
              title="Sign out of Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
