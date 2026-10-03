import type { IncomingMessage, ServerResponse } from 'http';
import { initializeApp, cert, getApps, getApp, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK singleton safely
function getFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    'deccanprojectsclient';

  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    process.env.FIREBASE_CLIENT_EMAIL;

  let privateKey =
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle both raw newlines and escaped newlines in environment variables
    privateKey = privateKey.replace(/\\n/g, '\n');
    // Remove surrounding quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
  }

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Local development fallback: check for service account json file in project directory
  try {
    const cwd = process.cwd();
    const files = fs.readdirSync(cwd);
    const serviceAccountFile = files.find(
      (f) => f.includes('firebase-adminsdk') && f.endsWith('.json')
    );
    if (serviceAccountFile) {
      const fullPath = path.join(cwd, serviceAccountFile);
      const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      return initializeApp({
        credential: cert(serviceAccount),
      });
    }
  } catch (e) {
    // Ignore filesystem read errors on serverless deployment environments
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  // Graceful fallback for Google Cloud / Firebase emulator runtime
  try {
    return initializeApp({ projectId });
  } catch (err: any) {
    throw new Error(
      'Firebase Admin credentials required. Please configure FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in your server environment.'
    );
  }
}

// Request Helper to parse JSON body
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) {
    return (req as any).body;
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

// Helper to send JSON response
function sendJson(res: ServerResponse, status: number, payload: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

// Verify requester is an active Super Admin
async function verifySuperAdmin(req: IncomingMessage, firebaseApp: App) {
  const authHeader = req.headers.authorization || (req.headers as any).Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { status: 401, message: 'Authentication required. Missing Bearer ID token.' };
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (err: any) {
    throw { status: 401, message: 'Invalid or expired authentication token.' };
  }

  const adminDoc = await firestore.collection('admins').doc(decodedToken.uid).get();
  if (!adminDoc.exists) {
    throw { status: 403, message: 'Access denied. You are not registered as an administrator.' };
  }

  const adminData = adminDoc.data();
  if (adminData?.status === 'disabled') {
    throw { status: 403, message: 'Access denied. Your administrator account has been disabled.' };
  }

  if (adminData?.role !== 'superadmin') {
    throw { status: 403, message: 'Super Admin privileges required to manage administrator credentials.' };
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email || adminData?.email || 'unknown@deccancare.com',
    name: adminData?.name || decodedToken.name || 'Super Admin',
    role: adminData?.role,
  };
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  let firebaseApp: App;
  try {
    firebaseApp = getFirebaseAdmin();
  } catch (initErr: any) {
    console.error('Firebase Admin Init Error:', initErr);
    return sendJson(res, 500, {
      success: false,
      error: `Server configuration error: ${initErr?.message || 'Unable to initialize Firebase Admin SDK. Please configure environment variables.'}`,
    });
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  try {
    // Authenticate and verify Super Admin
    const caller = await verifySuperAdmin(req, firebaseApp);

    const body = req.method === 'POST' ? await parseJsonBody(req) : {};
    const action = body.action || (req.method === 'GET' ? 'list' : '');

    /* -------------------------------------------------------------------------
       ACTION: LIST (Admins & Audit Logs)
       ------------------------------------------------------------------------- */
    if (action === 'list' || req.method === 'GET') {
      const adminsSnap = await firestore.collection('admins').get();
      const adminsList = adminsSnap.docs.map((d) => ({
        ...d.data(),
        uid: d.id,
      }));

      // Fetch recent 50 audit logs
      let auditLogs: any[] = [];
      try {
        const auditSnap = await firestore
          .collection('admin_audit_logs')
          .orderBy('timestamp', 'desc')
          .limit(50)
          .get();
        auditLogs = auditSnap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        }));
      } catch (e) {
        // Fallback without orderBy if index is pending
        const auditSnap = await firestore.collection('admin_audit_logs').limit(50).get();
        auditLogs = auditSnap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        }));
      }

      return sendJson(res, 200, {
        success: true,
        admins: adminsList,
        auditLogs,
      });
    }

    /* -------------------------------------------------------------------------
       ACTION: CREATE (Add New Administrator)
       ------------------------------------------------------------------------- */
    if (action === 'create') {
      const { name, email, password, role } = body.data || {};

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return sendJson(res, 400, { success: false, error: 'Full name must be at least 2 characters.' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        return sendJson(res, 400, { success: false, error: 'A valid email address is required.' });
      }

      if (!password || password.length < 6) {
        return sendJson(res, 400, { success: false, error: 'Temporary password must be at least 6 characters.' });
      }

      const validatedRole = role === 'superadmin' ? 'superadmin' : 'admin';
      const cleanEmail = email.trim().toLowerCase();

      // Check if user already exists in Firebase Auth
      let userRecord: UserRecord;
      try {
        userRecord = await auth.createUser({
          email: cleanEmail,
          password,
          displayName: name.trim(),
        });
      } catch (authErr: any) {
        if (authErr?.code === 'auth/email-already-exists') {
          return sendJson(res, 400, { success: false, error: 'An administrator account with this email already exists.' });
        }
        return sendJson(res, 400, { success: false, error: authErr?.message || 'Failed to create user account.' });
      }

      // Create document in Firestore `admins/{uid}`
      await firestore.collection('admins').doc(userRecord.uid).set({
        uid: userRecord.uid,
        name: name.trim(),
        email: cleanEmail,
        role: validatedRole,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: caller.email,
      });

      // Record Audit Log (without passwords)
      await firestore.collection('admin_audit_logs').add({
        actorUid: caller.uid,
        actorEmail: caller.email,
        action: 'created_admin',
        targetUid: userRecord.uid,
        targetEmail: cleanEmail,
        timestamp: FieldValue.serverTimestamp(),
        details: `Created new ${validatedRole} account for ${name.trim()}`,
      });

      return sendJson(res, 201, {
        success: true,
        admin: {
          uid: userRecord.uid,
          name: name.trim(),
          email: cleanEmail,
          role: validatedRole,
          status: 'active',
        },
      });
    }

    /* -------------------------------------------------------------------------
       ACTION: UPDATE-STATUS (Enable / Disable Administrator)
       ------------------------------------------------------------------------- */
    if (action === 'update-status') {
      const { targetUid, status } = body.data || {};

      if (!targetUid || (status !== 'active' && status !== 'disabled')) {
        return sendJson(res, 400, { success: false, error: 'Invalid target user ID or status.' });
      }

      const targetDoc = await firestore.collection('admins').doc(targetUid).get();
      if (!targetDoc.exists) {
        return sendJson(res, 404, { success: false, error: 'Administrator record not found.' });
      }

      const targetData = targetDoc.data();

      // Last Active Superadmin Protection
      if (status === 'disabled' && targetData?.role === 'superadmin') {
        const activeSuperAdminsSnap = await firestore
          .collection('admins')
          .where('role', '==', 'superadmin')
          .where('status', '==', 'active')
          .get();

        if (activeSuperAdminsSnap.size <= 1) {
          return sendJson(res, 400, {
            success: false,
            error: 'Cannot disable the last active Super Admin. There must always be at least one active Super Admin.',
          });
        }
      }

      // Update Firebase Auth user state
      try {
        await auth.updateUser(targetUid, { disabled: status === 'disabled' });
      } catch (authErr: any) {
        console.warn('Could not update Firebase Auth disabled status:', authErr?.message);
      }

      // Update Firestore document
      await firestore.collection('admins').doc(targetUid).update({
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Record Audit Log
      await firestore.collection('admin_audit_logs').add({
        actorUid: caller.uid,
        actorEmail: caller.email,
        action: status === 'disabled' ? 'disabled_admin' : 'reactivated_admin',
        targetUid,
        targetEmail: targetData?.email || 'unknown',
        timestamp: FieldValue.serverTimestamp(),
        details: `${status === 'disabled' ? 'Disabled' : 'Reactivated'} administrator ${targetData?.name || targetData?.email}`,
      });

      return sendJson(res, 200, { success: true, status });
    }

    /* -------------------------------------------------------------------------
       ACTION: UPDATE-ROLE (Change Administrator Role)
       ------------------------------------------------------------------------- */
    if (action === 'update-role') {
      const { targetUid, role } = body.data || {};

      if (!targetUid || (role !== 'superadmin' && role !== 'admin')) {
        return sendJson(res, 400, { success: false, error: 'Invalid target user ID or role.' });
      }

      const targetDoc = await firestore.collection('admins').doc(targetUid).get();
      if (!targetDoc.exists) {
        return sendJson(res, 404, { success: false, error: 'Administrator record not found.' });
      }

      const targetData = targetDoc.data();

      // Last Active Superadmin Protection
      if (targetData?.role === 'superadmin' && role !== 'superadmin') {
        const activeSuperAdminsSnap = await firestore
          .collection('admins')
          .where('role', '==', 'superadmin')
          .where('status', '==', 'active')
          .get();

        if (activeSuperAdminsSnap.size <= 1) {
          return sendJson(res, 400, {
            success: false,
            error: 'Cannot demote the last active Super Admin. There must always be at least one active Super Admin.',
          });
        }
      }

      // Update Firestore document
      await firestore.collection('admins').doc(targetUid).update({
        role,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Record Audit Log
      await firestore.collection('admin_audit_logs').add({
        actorUid: caller.uid,
        actorEmail: caller.email,
        action: 'role_changed',
        targetUid,
        targetEmail: targetData?.email || 'unknown',
        timestamp: FieldValue.serverTimestamp(),
        details: `Changed role from ${targetData?.role} to ${role} for ${targetData?.name || targetData?.email}`,
      });

      return sendJson(res, 200, { success: true, role });
    }

    /* -------------------------------------------------------------------------
       ACTION: DELETE (Delete Administrator Account)
       ------------------------------------------------------------------------- */
    if (action === 'delete') {
      const { targetUid } = body.data || {};

      if (!targetUid) {
        return sendJson(res, 400, { success: false, error: 'Missing target user ID.' });
      }

      const targetDoc = await firestore.collection('admins').doc(targetUid).get();
      if (!targetDoc.exists) {
        return sendJson(res, 404, { success: false, error: 'Administrator record not found.' });
      }

      const targetData = targetDoc.data();

      // Last Active Superadmin Protection
      if (targetData?.role === 'superadmin') {
        const activeSuperAdminsSnap = await firestore
          .collection('admins')
          .where('role', '==', 'superadmin')
          .where('status', '==', 'active')
          .get();

        if (activeSuperAdminsSnap.size <= 1) {
          return sendJson(res, 400, {
            success: false,
            error: 'Cannot delete the last active Super Admin. There must always be at least one active Super Admin.',
          });
        }
      }

      // Delete Firebase Auth User
      try {
        await auth.deleteUser(targetUid);
      } catch (authErr: any) {
        if (authErr?.code !== 'auth/user-not-found') {
          console.warn('Could not delete Firebase Auth user:', authErr?.message);
        }
      }

      // Delete Firestore document
      await firestore.collection('admins').doc(targetUid).delete();

      // Record Audit Log
      await firestore.collection('admin_audit_logs').add({
        actorUid: caller.uid,
        actorEmail: caller.email,
        action: 'deleted_admin',
        targetUid,
        targetEmail: targetData?.email || 'unknown',
        timestamp: FieldValue.serverTimestamp(),
        details: `Deleted administrator account for ${targetData?.name || targetData?.email}`,
      });

      return sendJson(res, 200, { success: true });
    }

    /* -------------------------------------------------------------------------
       ACTION: RESET-PASSWORD (Generate Secure Password Reset Link)
       ------------------------------------------------------------------------- */
    if (action === 'reset-password') {
      const { email, targetUid } = body.data || {};

      if (!email) {
        return sendJson(res, 400, { success: false, error: 'Email is required to generate password reset.' });
      }

      let resetLink = '';
      try {
        resetLink = await auth.generatePasswordResetLink(email.trim());
      } catch (err: any) {
        return sendJson(res, 400, {
          success: false,
          error: err?.message || 'Failed to generate password reset link.',
        });
      }

      // Record Audit Log
      await firestore.collection('admin_audit_logs').add({
        actorUid: caller.uid,
        actorEmail: caller.email,
        action: 'password_reset_sent',
        targetUid: targetUid || 'unknown',
        targetEmail: email,
        timestamp: FieldValue.serverTimestamp(),
        details: `Generated password reset link for ${email}`,
      });

      return sendJson(res, 200, { success: true, resetLink });
    }

    return sendJson(res, 400, { success: false, error: `Unsupported action: ${action}` });
  } catch (err: any) {
    console.error('API Admin Error:', err);
    const status = typeof err?.status === 'number' ? err.status : 500;
    const message = err?.message || 'Internal server error occurred.';
    return sendJson(res, status, { success: false, error: message });
  }
}
