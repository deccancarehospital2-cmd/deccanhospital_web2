import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminUser, AdminAuditLog, AdminRole, AdminStatus } from '../../types/admin';
import {
  fetchAdminAccounts,
  createAdminAccount,
  updateAdminStatus,
  updateAdminRole,
  deleteAdminAccount,
  requestPasswordResetLink,
} from '../../services/adminService';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  Trash2,
  CheckCircle2,
  AlertCircle,
  History,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  UserCog,
  AlertTriangle,
} from 'lucide-react';

export const AdminManagement: React.FC = () => {
  const { admin: currentAdmin, isSuperAdmin } = useAuth();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'admins' | 'audit'>('admins');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formRole, setFormRole] = useState<AdminRole>('admin');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Role Change Confirmation Modal State
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: AdminUser; newRole: AdminRole } | null>(null);

  // Status Change Confirmation Modal State
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ user: AdminUser; newStatus: AdminStatus } | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // Password Reset Link Display Modal
  const [resetLinkInfo, setResetLinkInfo] = useState<{ email: string; link: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load Admin list & Audit logs
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminAccounts();
      setAdmins(data.admins);
      setAuditLogs(data.auditLogs);
    } catch (err: any) {
      console.error('Failed to load admins:', err);
      setError(err?.message || 'Unable to load administrator records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered admin records
  const filteredAdmins = useMemo(() => {
    return admins.filter((item) => {
      const name = (item.name || item.displayName || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || item.uid.includes(q);

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'superadmin' && item.role === 'superadmin') ||
        (roleFilter === 'admin' && (item.role === 'admin' || item.role === 'editor'));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.status !== 'disabled') ||
        (statusFilter === 'disabled' && item.status === 'disabled');

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = admins.length;
    const activeSuperAdmins = admins.filter(
      (a) => a.role === 'superadmin' && a.status !== 'disabled'
    ).length;
    const standardAdmins = admins.filter(
      (a) => (a.role === 'admin' || a.role === 'editor') && a.status !== 'disabled'
    ).length;
    const disabledCount = admins.filter((a) => a.status === 'disabled').length;

    return { total, activeSuperAdmins, standardAdmins, disabledCount };
  }, [admins]);

  // Handle Add Administrator Submit
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Please enter the administrator’s full name.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!formPassword || formPassword.length < 6) {
      setFormError('Temporary password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdminAccount({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        role: formRole,
      });

      showToast(`Administrator account created for ${formEmail.trim()}`);
      setIsAddModalOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormRole('admin');
      loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create administrator account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Role Change Execution
  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    setIsSubmitting(true);
    try {
      await updateAdminRole(roleChangeTarget.user.uid, roleChangeTarget.newRole);
      showToast(
        `Role updated to ${roleChangeTarget.newRole === 'superadmin' ? 'Super Admin' : 'Standard Admin'} for ${roleChangeTarget.user.email}`
      );
      setRoleChangeTarget(null);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle Execution
  const handleConfirmStatusChange = async () => {
    if (!statusChangeTarget) return;
    setIsSubmitting(true);
    try {
      await updateAdminStatus(statusChangeTarget.user.uid, statusChangeTarget.newStatus);
      showToast(
        `Account ${statusChangeTarget.newStatus === 'disabled' ? 'disabled' : 'reactivated'} for ${statusChangeTarget.user.email}`
      );
      setStatusChangeTarget(null);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Execution
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteAdminAccount(deleteTarget.uid);
      showToast(`Administrator account deleted for ${deleteTarget.email}`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Request Password Reset Link
  const handleGenerateResetLink = async (user: AdminUser) => {
    if (!user.email) return;
    try {
      const link = await requestPasswordResetLink(user.email, user.uid);
      setResetLinkInfo({ email: user.email, link });
      setCopiedLink(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate password reset link', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold animate-in fade-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700'
              : 'bg-red-900/95 text-red-100 border-red-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-lightBlue text-brand-blue">
              <UserCog className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
              Administrator Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-brand-muted mt-1.5 leading-relaxed">
            Create, authorize, and manage administrative credentials with role-based access control.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue2 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Administrator</span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-card border border-brand-line shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
              Total Accounts
            </span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Shield className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
            {stats.total}
          </div>
          <p className="text-[11px] text-brand-muted mt-1">Hospital system admins</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-card border border-brand-line shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
              Super Admins
            </span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
            {stats.activeSuperAdmins}
          </div>
          <p className="text-[11px] text-brand-muted mt-1">Full control privileges</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-card border border-brand-line shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
              Standard Admins
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <UserCog className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
            {stats.standardAdmins}
          </div>
          <p className="text-[11px] text-brand-muted mt-1">Clinical CMS & appointments</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-card border border-brand-line shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
              Disabled Accounts
            </span>
            <span className="p-2 rounded-lg bg-red-50 text-red-700">
              <Lock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-brand-ink">
            {stats.disabledCount}
          </div>
          <p className="text-[11px] text-brand-muted mt-1">Access suspended</p>
        </div>
      </div>

      {/* View Tabs: Accounts vs Audit Trail */}
      <div className="flex border-b border-brand-line">
        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'admins'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-brand-muted hover:text-brand-ink'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Administrators ({admins.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-brand-muted hover:text-brand-ink'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-card flex items-start gap-3 text-red-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Security Operation Error:</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* TAB 1: ADMINISTRATORS LIST */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-card border border-brand-line shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, or UID..."
                className="w-full pl-9 pr-4 py-2 bg-brand-bg border border-brand-line rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-brand-bg border border-brand-line rounded-xl text-xs font-semibold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Super Admins</option>
                <option value="admin">Standard Admins</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-brand-bg border border-brand-line rounded-xl text-xs font-semibold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>

              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="p-2 bg-brand-bg hover:bg-brand-line/50 border border-brand-line rounded-xl text-brand-muted hover:text-brand-ink transition-colors"
                title="Refresh Administrator List"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table of Administrators */}
          <div className="bg-white rounded-card border border-brand-line shadow-card overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-brand-muted">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-blue mb-3" />
                <p className="text-xs sm:text-sm font-semibold">Loading administrators...</p>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="p-12 text-center text-brand-muted">
                <ShieldAlert className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <h3 className="font-serif font-bold text-base text-brand-ink mb-1">
                  No administrators found
                </h3>
                <p className="text-xs max-w-sm mx-auto">
                  {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'No administrators match the selected filter criteria.'
                    : 'No administrator accounts registered yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-brand-bg/60 border-b border-brand-line text-brand-muted uppercase text-[10px] sm:text-[11px] font-extrabold tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Administrator</th>
                      <th className="py-3.5 px-4 sm:px-6">Email Address</th>
                      <th className="py-3.5 px-4 sm:px-6">Role</th>
                      <th className="py-3.5 px-4 sm:px-6">Status</th>
                      <th className="py-3.5 px-4 sm:px-6">Created</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line">
                    {filteredAdmins.map((item) => {
                      const isCurrent = item.uid === currentAdmin?.uid;
                      const isItemSuperAdmin = item.role === 'superadmin';
                      const isDisabled = item.status === 'disabled';

                      return (
                        <tr
                          key={item.uid}
                          className={`hover:bg-brand-bg/40 transition-colors ${
                            isDisabled ? 'bg-gray-50/70 opacity-75' : ''
                          }`}
                        >
                          {/* Name & UID */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                  isItemSuperAdmin
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {(item.name || item.displayName || item.email || 'A')
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-brand-ink block flex items-center gap-1.5">
                                  {item.name || item.displayName || 'Unnamed Admin'}
                                  {isCurrent && (
                                    <span className="text-[9px] font-extrabold uppercase bg-brand-lightBlue text-brand-blue px-1.5 py-0.5 rounded">
                                      You
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-brand-muted font-mono block">
                                  {item.uid}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-4 px-4 sm:px-6">
                            <span className="font-semibold text-brand-ink">{item.email}</span>
                            {item.createdBy && (
                              <span className="text-[10px] text-brand-muted block">
                                By: {item.createdBy}
                              </span>
                            )}
                          </td>

                          {/* Role Badge */}
                          <td className="py-4 px-4 sm:px-6">
                            {isItemSuperAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-purple-100 text-purple-800 border border-purple-200">
                                <ShieldCheck className="w-3 h-3" />
                                Super Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                                <UserCog className="w-3 h-3" />
                                Standard Admin
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4 sm:px-6">
                            {isDisabled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                                <Lock className="w-3 h-3" />
                                Disabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">
                                <Unlock className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </td>

                          {/* Created Date */}
                          <td className="py-4 px-4 sm:px-6 text-brand-muted text-xs">
                            {item.createdAt
                              ? new Date(
                                  typeof item.createdAt === 'object' && 'seconds' in item.createdAt
                                    ? item.createdAt.seconds * 1000
                                    : item.createdAt
                                ).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'System Initial'}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                              {/* Password Reset Link */}
                              <button
                                type="button"
                                onClick={() => handleGenerateResetLink(item)}
                                className="p-1.5 text-brand-muted hover:text-brand-blue hover:bg-brand-lightBlue rounded-lg transition-colors"
                                title="Generate Password Reset Link"
                              >
                                <Key className="w-4 h-4" />
                              </button>

                              {/* Toggle Role Button */}
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRoleChangeTarget({
                                      user: item,
                                      newRole: isItemSuperAdmin ? 'admin' : 'superadmin',
                                    })
                                  }
                                  className="p-1.5 text-brand-muted hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                  title={`Switch role to ${
                                    isItemSuperAdmin ? 'Standard Admin' : 'Super Admin'
                                  }`}
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              )}

                              {/* Enable / Disable Button */}
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStatusChangeTarget({
                                      user: item,
                                      newStatus: isDisabled ? 'active' : 'disabled',
                                    })
                                  }
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDisabled
                                      ? 'text-green-700 hover:bg-green-50'
                                      : 'text-amber-700 hover:bg-amber-50'
                                  }`}
                                  title={isDisabled ? 'Reactivate Account' : 'Disable Account'}
                                >
                                  {isDisabled ? (
                                    <Unlock className="w-4 h-4" />
                                  ) : (
                                    <Lock className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                              {/* Delete Button */}
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(item)}
                                  className="p-1.5 text-brand-muted hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"
                                  title="Permanently Delete Account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-card border border-brand-line shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-brand-line flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-brand-ink">
                Administrative Action Log
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                Cryptographically tracked record of all administrator credentials and privilege updates.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="p-2 bg-brand-bg hover:bg-brand-line/50 border border-brand-line rounded-xl text-brand-muted hover:text-brand-ink"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-12 text-center text-brand-muted">
              <History className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-xs sm:text-sm font-semibold">No audit records logged yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-brand-bg/60 border-b border-brand-line text-brand-muted uppercase text-[10px] sm:text-[11px] font-extrabold tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Timestamp</th>
                    <th className="py-3 px-4 sm:px-6">Actor (Super Admin)</th>
                    <th className="py-3 px-4 sm:px-6">Action</th>
                    <th className="py-3 px-4 sm:px-6">Target User</th>
                    <th className="py-3 px-4 sm:px-6">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {auditLogs.map((log) => (
                    <tr key={log.id || `${log.timestamp}`} className="hover:bg-brand-bg/30">
                      <td className="py-3 px-4 sm:px-6 text-brand-muted font-mono text-[11px]">
                        {log.timestamp
                          ? new Date(
                              typeof log.timestamp === 'object' && 'seconds' in log.timestamp
                                ? log.timestamp.seconds * 1000
                                : log.timestamp
                            ).toLocaleString('en-GB')
                          : 'Recent'}
                      </td>
                      <td className="py-3 px-4 sm:px-6 font-semibold text-brand-ink">
                        {log.actorEmail}
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-brand-ink font-mono text-xs">
                        {log.targetEmail}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-brand-muted text-xs">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ADD ADMINISTRATOR
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-brand-line animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-brand-line">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-lightBlue flex items-center justify-center text-brand-blue">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-brand-ink">
                    Add New Administrator
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Provision a secure Firebase Authentication login account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-brand-muted hover:text-brand-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-brand-ink uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Dr. Salman Khan"
                  className="w-full px-3.5 py-2.5 bg-brand-bg border border-brand-line rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-ink uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-brand-red">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. salman.khan@deccancare.com"
                  className="w-full px-3.5 py-2.5 bg-brand-bg border border-brand-line rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-ink uppercase tracking-wider mb-1.5">
                  Temporary Password <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-brand-bg border border-brand-line rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-brand-muted mt-1">
                  The new administrator will use this password to sign in at <code className="bg-gray-100 px-1 py-0.5 rounded">/login/admin</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-ink uppercase tracking-wider mb-1.5">
                  Assigned Administrative Role <span className="text-brand-red">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormRole('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formRole === 'admin'
                        ? 'border-brand-blue bg-brand-lightBlue/60 ring-2 ring-brand-blue/30'
                        : 'border-brand-line bg-brand-bg/50 hover:bg-brand-bg'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-brand-ink">
                      <UserCog className="w-4 h-4 text-brand-blue" />
                      Standard Admin
                    </div>
                    <p className="text-[10px] text-brand-muted mt-1">
                      Access to Appointments, Availability, Doctors, and Gallery CMS.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('superadmin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formRole === 'superadmin'
                        ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/30'
                        : 'border-brand-line bg-brand-bg/50 hover:bg-brand-bg'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      Super Admin
                    </div>
                    <p className="text-[10px] text-brand-muted mt-1">
                      Full hospital access + Create, edit, and disable administrator accounts.
                    </p>
                  </button>
                </div>
              </div>

              {formRole === 'superadmin' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <b>Security Warning:</b> You are granting <b>Super Admin</b> permissions. This user will have complete access to manage all other administrator accounts.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-brand-line">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-brand-muted hover:text-brand-ink bg-brand-bg rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-brand-blue hover:bg-brand-blue2 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create Administrator</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CONFIRM ROLE CHANGE
          ========================================================================= */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-line animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-purple-700 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-brand-ink">
                Confirm Privilege Modification
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Are you sure you want to change the role of{' '}
              <b className="text-brand-ink">{roleChangeTarget.user.name || roleChangeTarget.user.email}</b> from{' '}
              <b className="capitalize text-brand-ink">{roleChangeTarget.user.role}</b> to{' '}
              <b className="capitalize text-purple-700">{roleChangeTarget.newRole === 'superadmin' ? 'Super Admin' : 'Standard Admin'}</b>?
            </p>

            {roleChangeTarget.newRole === 'superadmin' && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                This will grant full permissions to create and manage other administrators.
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-brand-line">
              <button
                type="button"
                onClick={() => setRoleChangeTarget(null)}
                className="px-4 py-2 text-xs font-bold text-brand-muted hover:text-brand-ink bg-brand-bg rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmRoleChange}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Confirm Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CONFIRM STATUS CHANGE (DISABLE / REACTIVATE)
          ========================================================================= */}
      {statusChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-line animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  statusChangeTarget.newStatus === 'disabled'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {statusChangeTarget.newStatus === 'disabled' ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Unlock className="w-5 h-5" />
                )}
              </div>
              <h3 className="font-serif font-bold text-lg text-brand-ink">
                {statusChangeTarget.newStatus === 'disabled' ? 'Disable Administrator' : 'Reactivate Administrator'}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              {statusChangeTarget.newStatus === 'disabled'
                ? `Disabling ${statusChangeTarget.user.email} will immediately revoke access to the Admin Portal and block subsequent logins.`
                : `Reactivating ${statusChangeTarget.user.email} will restore their login privileges and dashboard access.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-brand-line">
              <button
                type="button"
                onClick={() => setStatusChangeTarget(null)}
                className="px-4 py-2 text-xs font-bold text-brand-muted hover:text-brand-ink bg-brand-bg rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmStatusChange}
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 ${
                  statusChangeTarget.newStatus === 'disabled'
                    ? 'bg-brand-red hover:bg-red-700'
                    : 'bg-green-700 hover:bg-green-800'
                }`}
              >
                {isSubmitting
                  ? 'Updating...'
                  : statusChangeTarget.newStatus === 'disabled'
                  ? 'Disable Account'
                  : 'Reactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: CONFIRM DELETE
          ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-line animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-brand-red mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-brand-ink">
                Delete Administrator
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Are you sure you want to permanently delete the administrator account for{' '}
              <b className="text-brand-ink">{deleteTarget.name || deleteTarget.email}</b>? This will delete their Firebase Auth account and authorization record.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-brand-line">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-brand-muted hover:text-brand-ink bg-brand-bg rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-brand-red hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: PASSWORD RESET LINK
          ========================================================================= */}
      {resetLinkInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-brand-line animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-brand-line">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-lightBlue flex items-center justify-center text-brand-blue">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-brand-ink">
                    Password Reset Link
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Secure Firebase password reset URL generated for {resetLinkInfo.email}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetLinkInfo(null)}
                className="p-1.5 text-brand-muted hover:text-brand-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <p className="text-xs text-brand-muted">
                Copy this secure link and send it to the administrator so they can reset their password:
              </p>

              <div className="p-3 bg-brand-bg border border-brand-line rounded-xl break-all font-mono text-xs text-brand-ink select-all">
                {resetLinkInfo.link}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-brand-muted">
                  Link generated via Firebase Authentication
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(resetLinkInfo.link)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue2 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Reset Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
