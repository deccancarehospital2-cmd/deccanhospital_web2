import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { AdminUser } from '../types/admin';
import {
  loginWithEmail,
  logoutUser,
  subscribeToAuthState,
} from '../services/authService';
import { getAdminRecord } from '../services/firestore';

interface AuthContextType {
  user: User | null;
  admin: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (email: string, pass: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const adminRecord = await getAdminRecord(firebaseUser.uid);
          if (adminRecord && adminRecord.status === 'disabled') {
            console.warn('Admin account is disabled. Signing out.');
            await logoutUser();
            setUser(null);
            setAdmin(null);
          } else {
            setAdmin(adminRecord);
          }
        } catch (error) {
          console.warn('Admin check during session restoration:', error);
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<AdminUser> => {
    setLoading(true);
    try {
      const authenticatedUser = await loginWithEmail(email, pass);

      let adminRecord: AdminUser | null = null;
      try {
        adminRecord = await getAdminRecord(authenticatedUser.uid);
      } catch (firestoreErr: any) {
        console.error('Firestore Error reading admins collection:', firestoreErr);
        await logoutUser();
        setUser(null);
        setAdmin(null);
        if (firestoreErr?.code === 'permission-denied') {
          throw new Error(
            'Firestore Security Rules blocked access. Please ensure your Firestore Rules in Firebase Console allow authenticated admins to read admins/{uid}.'
          );
        }
        throw new Error(
          `Firestore read error: ${firestoreErr?.message || 'Unable to access database'}`
        );
      }

      if (!adminRecord) {
        await logoutUser();
        setUser(null);
        setAdmin(null);
        throw new Error(
          `Access denied. Document admins/${authenticatedUser.uid} was not found in Firestore. Please verify the Document ID is your exact User UID.`
        );
      }

      if (adminRecord.status === 'disabled') {
        await logoutUser();
        setUser(null);
        setAdmin(null);
        throw new Error(
          'Your administrator account has been disabled. Please contact the hospital Super Admin for assistance.'
        );
      }

      setUser(authenticatedUser);
      setAdmin(adminRecord);
      return adminRecord;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      admin,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(admin && admin.status !== 'disabled'),
      isSuperAdmin: Boolean(admin && admin.role === 'superadmin' && admin.status !== 'disabled'),
      login,
      logout,
    }),
    [user, admin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
