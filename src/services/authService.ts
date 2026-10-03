import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  NextOrObserver,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

/**
 * Signs in an admin user with email and password.
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return userCredential.user;
  } catch (error: any) {
    const errorCode = error?.code || '';
    let message = 'Failed to sign in. Please check your credentials.';

    if (errorCode === 'auth/invalid-email') {
      message = 'Invalid email address format.';
    } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
      message = 'Incorrect email or password.';
    } else if (errorCode === 'auth/too-many-requests') {
      message = 'Too many failed login attempts. Please try again later.';
    }

    throw new Error(message);
  }
}

/**
 * Signs out the currently authenticated user.
 */
export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Observes authentication state changes.
 */
export function subscribeToAuthState(observer: NextOrObserver<User | null>) {
  return onAuthStateChanged(auth, observer);
}

/**
 * Gets the current synchronous user instance from Firebase Auth.
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
