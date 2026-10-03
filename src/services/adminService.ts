import { auth } from '../lib/firebase';
import { AdminUser, AdminAuditLog, AdminRole, AdminStatus } from '../types/admin';

/**
 * Helper to get current Firebase User's ID token.
 */
async function getAuthHeader(): Promise<{ Authorization: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in as an administrator to perform this operation.');
  }
  const token = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Fetches all admin accounts and recent audit logs from the secure API.
 */
export async function fetchAdminAccounts(): Promise<{
  admins: AdminUser[];
  auditLogs: AdminAuditLog[];
}> {
  const headers = await getAuthHeader();
  const response = await fetch('/api/admin', {
    method: 'GET',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'Failed to fetch administrator accounts.');
  }

  return {
    admins: data.admins || [],
    auditLogs: data.auditLogs || [],
  };
}

/**
 * Creates a new administrator account via the server-side Firebase Admin API.
 */
export async function createAdminAccount(params: {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}): Promise<AdminUser> {
  const headers = await getAuthHeader();
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'create',
      data: params,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'Failed to create administrator account.');
  }

  return data.admin;
}

/**
 * Updates administrator status (active vs disabled).
 */
export async function updateAdminStatus(
  targetUid: string,
  status: AdminStatus
): Promise<void> {
  const headers = await getAuthHeader();
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'update-status',
      data: { targetUid, status },
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'Failed to update administrator status.');
  }
}

/**
 * Updates administrator role (admin vs superadmin).
 */
export async function updateAdminRole(
  targetUid: string,
  role: AdminRole
): Promise<void> {
  const headers = await getAuthHeader();
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'update-role',
      data: { targetUid, role },
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'Failed to update administrator role.');
  }
}

/**
 * Deletes an administrator account.
 */
export async function deleteAdminAccount(targetUid: string): Promise<void> {
  const headers = await getAuthHeader();
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'delete',
      data: { targetUid },
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'Failed to delete administrator account.');
  }
}

/**
 * Generates a secure password reset link for an administrator.
 */
export async function requestPasswordResetLink(
  email: string,
  targetUid?: string
): Promise<string> {
  const headers = await getAuthHeader();
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'reset-password',
      data: { email, targetUid },
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'Failed to generate password reset link.');
  }

  return data.resetLink || '';
}
