import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
  const isUnauthorizedRedirect = (location.state as any)?.unauthorized;

  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isAdmin, loading, navigate, from]);

  useEffect(() => {
    if (isUnauthorizedRedirect) {
      setError('Access denied. Your account is not authorized to access the hospital admin portal.');
    }
  }, [isUnauthorizedRedirect]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-bg text-brand-ink selection:bg-brand-blue selection:text-white">
      {/* Top Simple Header */}
      <header className="border-b border-brand-line bg-white py-3.5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2.5 text-brand-muted hover:text-brand-blue transition-colors text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded px-2 py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Main Website</span>
          </a>
          <span className="text-xs font-bold text-brand-blue2 bg-brand-badgeBg py-1 px-3 rounded-full uppercase tracking-wider">
            Secure Portal
          </span>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-white rounded-card shadow-brand border border-brand-line p-7 sm:p-9">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div
              className="w-14 h-14 border-[3px] border-[#2786aa] rounded-full flex items-center justify-center text-brand-red font-extrabold text-2xl shadow-sm mb-3 bg-white"
              aria-hidden="true"
            >
              +
            </div>
            <span className="font-serif font-bold text-xl text-brand-blue2 block leading-none">
              Deccan Care
            </span>
            <span className="text-[9px] text-[#657782] font-bold tracking-wider block mt-1 uppercase">
              MATERNITY & GENERAL HOSPITAL
            </span>
            <h1 className="font-serif text-2xl font-bold text-brand-ink mt-5 mb-1">
              Admin Portal Login
            </h1>
            <p className="text-xs text-brand-muted">
              Enter your authorized staff credentials to continue
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs sm:text-sm text-brand-red leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold text-brand-ink uppercase tracking-wide"
              >
                Staff Email Address <span className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@deccancare.com"
                  className="w-full pl-10 pr-3.5 py-3 border border-brand-line rounded-[9px] text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-brand-ink uppercase tracking-wide"
              >
                Password <span className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 border border-brand-line rounded-[9px] text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-muted hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-3.5 text-sm flex items-center justify-center gap-2"
                onClick={() => {}}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Admin Portal</span>
                )}
              </Button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-brand-line/60 text-center">
            <p className="text-[11px] text-brand-muted leading-relaxed">
              Authorized hospital personnel only. All access attempts are verified against Firestore administrator records.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-line/60 bg-white py-4 text-center text-xs text-brand-muted">
        © {new Date().getFullYear()} Deccan Care Maternity & General Hospital. All rights reserved.
      </footer>
    </div>
  );
};
