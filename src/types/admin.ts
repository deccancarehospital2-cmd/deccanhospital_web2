import { Timestamp } from 'firebase/firestore';

export type AdminRole = 'superadmin' | 'admin' | 'editor';
export type AdminStatus = 'active' | 'disabled';

export interface AdminUser {
  uid: string;
  name?: string | null;
  displayName?: string | null;
  email: string | null;
  role: AdminRole;
  status?: AdminStatus;
  createdAt?: Timestamp | string | Date;
  updatedAt?: Timestamp | string | Date;
  createdBy?: string;
  lastLoginAt?: Timestamp | string | Date;
}

export interface AdminAuditLog {
  id?: string;
  actorUid: string;
  actorEmail: string;
  action: 'created_admin' | 'disabled_admin' | 'reactivated_admin' | 'role_changed' | 'deleted_admin' | 'password_reset_sent';
  targetUid: string;
  targetEmail: string;
  timestamp: Timestamp | string | Date;
  details?: string;
}

