import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Doctor } from '../types/doctor';
import { GalleryItem } from '../types/gallery';
import { AdminUser } from '../types/admin';
import { DoctorSlot, Appointment, SlotStatus } from '../types/appointment';

// Helper for type-safe collection referencing
const createCollection = <T = DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

// Typed Collection References
export const doctorsCollection = createCollection<Doctor>('doctors');
export const galleryCollection = createCollection<GalleryItem>('gallery');
export const adminsCollection = createCollection<AdminUser>('admins');
export const slotsCollection = createCollection<DoctorSlot>('slots');
export const appointmentsCollection = createCollection<Appointment>('appointments');

/* =========================================================================
   DOCTORS FIRESTORE SERVICE
   ========================================================================= */

/**
 * Fetches active doctors for the public website ordered by displayOrder.
 */
export async function fetchPublicDoctors(): Promise<Doctor[]> {
  try {
    const q = query(
      doctorsCollection,
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));
  } catch (error: any) {
    // If composite index is pending, fallback to active-only query and client-side sort
    const q = query(doctorsCollection, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));
    return docs.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }
}

/**
 * Fetches all doctor records for the admin panel.
 */
export async function fetchAllDoctors(): Promise<Doctor[]> {
  const q = query(doctorsCollection, orderBy('displayOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    id: docSnap.id,
  }));
}

// Helper to strip undefined properties before passing to Firestore
function cleanFirestoreUpdates<T extends Record<string, any>>(data: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Adds a new doctor record with Firestore server timestamps.
 */
export async function createDoctor(doctorData: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(doctorsCollection, {
    ...cleanFirestoreUpdates(doctorData),
    isActive: doctorData.isActive ?? true,
    displayOrder: doctorData.displayOrder ?? 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any);
  return docRef.id;
}

/**
 * Creates or overwrites a doctor record with a specific deterministic ID.
 */
export async function setDoctorWithId(
  id: string,
  doctorData: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const docRef = doc(db, 'doctors', id);
  await setDoc(
    docRef,
    {
      ...cleanFirestoreUpdates(doctorData),
      isActive: doctorData.isActive ?? true,
      displayOrder: doctorData.displayOrder ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any,
    { merge: true }
  );
}

/**
 * Updates an existing doctor document.
 */
export async function updateDoctor(id: string, updates: Partial<Doctor>): Promise<void> {
  const docRef = doc(db, 'doctors', id);
  await updateDoc(docRef, {
    ...cleanFirestoreUpdates(updates),
    updatedAt: serverTimestamp(),
  } as any);
}

/**
 * Toggles doctor active/inactive status.
 */
export async function toggleDoctorActive(id: string, currentStatus: boolean): Promise<void> {
  const docRef = doc(db, 'doctors', id);
  await updateDoc(docRef, {
    isActive: !currentStatus,
    updatedAt: serverTimestamp(),
  } as any);
}

/**
 * Deletes a doctor document.
 */
export async function deleteDoctor(id: string): Promise<void> {
  const docRef = doc(db, 'doctors', id);
  await deleteDoc(docRef);
}

/**
 * Safe, idempotent one-time import utility for the 21 existing static doctor records.
 * Checks for existing IDs to prevent duplicates.
 */
export async function importStaticDoctorsSafely(records: Doctor[]): Promise<{
  importedCount: number;
  skippedCount: number;
  total: number;
}> {
  const existingSnapshot = await getDocs(doctorsCollection);
  const existingIds = new Set(existingSnapshot.docs.map((d) => d.id));

  let importedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    const targetId = item.id;

    if (existingIds.has(targetId)) {
      skippedCount++;
      continue;
    }

    const docRef = doc(db, 'doctors', targetId);
    await setDoc(docRef, {
      name: item.name,
      role: item.role,
      qualifications: item.qualifications || '',
      description: item.description || '',
      experience: item.experience || '',
      displayOrder: item.displayOrder ?? i + 1,
      isActive: item.isActive ?? true,
      isSupportStaff: item.isSupportStaff ?? false,
      avatarType: item.avatarType || (item.isSupportStaff ? 'femaleSupport' : 'doctor'),
      image: item.image || '',
      imageUrl: item.imageUrl || '',
      imagePublicId: item.imagePublicId || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);

    importedCount++;
  }

  return {
    importedCount,
    skippedCount,
    total: records.length,
  };
}

/* =========================================================================
   GALLERY FIRESTORE SERVICE
   ========================================================================= */

/**
 * Fetches active gallery items for the public website.
 */
export async function fetchPublicGallery(): Promise<GalleryItem[]> {
  try {
    const q = query(
      galleryCollection,
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));
  } catch (error: any) {
    // If composite index is pending, fallback to active-only query and client-side sort
    const q = query(galleryCollection, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));
    return items.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }
}

/**
 * Fetches all gallery records for the admin manager.
 */
export async function fetchAllGallery(): Promise<GalleryItem[]> {
  const q = query(galleryCollection, orderBy('displayOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    id: docSnap.id,
  }));
}

/**
 * Adds a new gallery item with Firestore server timestamps.
 */
export async function createGalleryItem(itemData: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(galleryCollection, {
    ...cleanFirestoreUpdates(itemData),
    isActive: itemData.isActive ?? true,
    displayOrder: itemData.displayOrder ?? 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any);
  return docRef.id;
}

/**
 * Updates an existing gallery item.
 */
export async function updateGalleryItem(id: string, updates: Partial<GalleryItem>): Promise<void> {
  const docRef = doc(db, 'gallery', id);
  await updateDoc(docRef, {
    ...cleanFirestoreUpdates(updates),
    updatedAt: serverTimestamp(),
  } as any);
}

/**
 * Toggles gallery item active/inactive status.
 */
export async function toggleGalleryActive(id: string, currentStatus: boolean): Promise<void> {
  const docRef = doc(db, 'gallery', id);
  await updateDoc(docRef, {
    isActive: !currentStatus,
    updatedAt: serverTimestamp(),
  } as any);
}

/**
 * Deletes a gallery item document.
 */
export async function deleteGalleryItem(id: string): Promise<void> {
  const docRef = doc(db, 'gallery', id);
  await deleteDoc(docRef);
}

/**
 * Safe, idempotent one-time import utility for the 11 existing static gallery records.
 * Checks for existing IDs to prevent duplicates.
 */
export async function importStaticGallerySafely(records: GalleryItem[]): Promise<{
  importedCount: number;
  skippedCount: number;
  total: number;
}> {
  const existingSnapshot = await getDocs(galleryCollection);
  const existingIds = new Set(existingSnapshot.docs.map((d) => d.id));

  let importedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    const targetId = item.id;

    if (existingIds.has(targetId)) {
      skippedCount++;
      continue;
    }

    const docRef = doc(db, 'gallery', targetId);
    await setDoc(docRef, {
      caption: item.caption,
      altText: item.altText || item.alt || item.caption,
      category: item.category || 'Clinical',
      displayOrder: item.displayOrder ?? i + 1,
      isActive: item.isActive ?? true,
      image: item.image || '',
      imageUrl: item.imageUrl || '',
      imagePublicId: item.imagePublicId || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);

    importedCount++;
  }

  return {
    importedCount,
    skippedCount,
    total: records.length,
  };
}

/* =========================================================================
   ADMIN VERIFICATION SERVICE
   ========================================================================= */

/**
 * Checks if a user UID is registered in the admins collection.
 */
export async function verifyIsAdmin(uid: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'admins', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Failed to verify admin status in Firestore:', error);
    return false;
  }
}

/**
 * Fetches an admin record from the admins collection by UID.
 * Throws on permission errors so they can be surfaced clearly.
 */
export async function getAdminRecord(uid: string): Promise<AdminUser | null> {
  const docRef = doc(db, 'admins', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      ...docSnap.data(),
      uid: docSnap.id,
    } as AdminUser;
  }
  return null;
}

/* =========================================================================
   SLOT MANAGEMENT SERVICE (DOCTOR-SPECIFIC AVAILABILITY)
   ========================================================================= */

// Helpers for time string calculations
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
}

function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Fetches all slots for a specific doctor on a specific date.
 */
export async function fetchSlotsForDoctorAndDate(
  doctorId: string,
  date: string
): Promise<DoctorSlot[]> {
  try {
    const q = query(
      slotsCollection,
      where('doctorId', '==', doctorId),
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    const slots = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));
    // Sort by startTime ascending
    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  } catch (error) {
    console.error('Error fetching slots for doctor and date:', error);
    throw error;
  }
}

/**
 * Generates and saves interval slots for a doctor on a specific date.
 * Automatically checks and skips duplicate slots.
 */
export async function generateDoctorSlots(
  doctorId: string,
  doctorName: string,
  date: string,
  startTime: string,
  endTime: string,
  durationMinutes: number
): Promise<{ createdCount: number; duplicateCount: number; totalCalculated: number }> {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);

  if (endMin <= startMin || durationMinutes <= 0) {
    throw new Error('End time must be after start time, and duration must be greater than 0.');
  }

  // Fetch existing slots for this doctor and date to avoid duplicates
  const existing = await fetchSlotsForDoctorAndDate(doctorId, date);
  const existingTimeKeys = new Set(existing.map((s) => `${s.startTime}-${s.endTime}`));

  let createdCount = 0;
  let duplicateCount = 0;
  let totalCalculated = 0;

  for (let current = startMin; current + durationMinutes <= endMin; current += durationMinutes) {
    totalCalculated++;
    const slotStart = formatMinutesToTime(current);
    const slotEnd = formatMinutesToTime(current + durationMinutes);
    const timeKey = `${slotStart}-${slotEnd}`;

    if (existingTimeKeys.has(timeKey)) {
      duplicateCount++;
      continue;
    }

    // Deterministic ID preventing collision
    const sanitizedDoctor = doctorId.replace(/[^a-zA-Z0-9_-]/g, '');
    const slotId = `slot_${sanitizedDoctor}_${date}_${slotStart.replace(':', '')}_${slotEnd.replace(':', '')}`;

    const docRef = doc(db, 'slots', slotId);
    await setDoc(docRef, {
      doctorId,
      doctorNameSnapshot: doctorName,
      date,
      startTime: slotStart,
      endTime: slotEnd,
      status: 'available',
      appointmentId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any);

    existingTimeKeys.add(timeKey);
    createdCount++;
  }

  return { createdCount, duplicateCount, totalCalculated };
}

/**
 * Updates a slot status (available, blocked, booked).
 */
export async function updateSlotStatus(slotId: string, status: SlotStatus): Promise<void> {
  const docRef = doc(db, 'slots', slotId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  } as any);
}

/**
 * Deletes a slot document. Only allowed if not currently booked.
 */
export async function deleteSlot(slotId: string): Promise<void> {
  const docRef = doc(db, 'slots', slotId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data() as DoctorSlot;
    if (data.status === 'booked') {
      throw new Error('Cannot delete a slot with a booked appointment. Please cancel or reject the appointment first.');
    }
  }
  await deleteDoc(docRef);
}

/* =========================================================================
   APPOINTMENT BOOKING & MANAGEMENT SERVICE
   ========================================================================= */

/**
 * Atomically books a slot and creates an appointment record.
 * Protects against race conditions (two patients booking the same slot simultaneously).
 */
export async function bookAppointmentAtomic(params: {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorNameSnapshot: string;
  doctorRoleSnapshot: string;
  department: string;
  date: string;
  slotId: string;
  slotStart: string;
  slotEnd: string;
  patientMessage?: string;
}): Promise<Appointment> {
  return await runTransaction(db, async (transaction) => {
    const slotRef = doc(db, 'slots', params.slotId);
    const slotSnap = await transaction.get(slotRef);

    if (!slotSnap.exists()) {
      throw new Error('Selected time slot no longer exists.');
    }

    const slotData = slotSnap.data() as DoctorSlot;
    if (slotData.status !== 'available') {
      throw new Error('This time slot was just booked by another patient. Please select another slot.');
    }

    const apptRef = doc(collection(db, 'appointments'));
    const newAppointmentData: Omit<Appointment, 'id'> = {
      patientName: params.patientName.trim(),
      patientPhone: params.patientPhone.trim(),
      patientEmail: params.patientEmail.trim().toLowerCase(),
      doctorId: params.doctorId,
      doctorNameSnapshot: params.doctorNameSnapshot,
      doctorRoleSnapshot: params.doctorRoleSnapshot,
      department: params.department,
      date: params.date,
      slotId: params.slotId,
      slotStart: params.slotStart,
      slotEnd: params.slotEnd,
      status: 'pending',
      patientMessage: params.patientMessage?.trim() || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(apptRef, newAppointmentData as any);
    transaction.update(slotRef, {
      status: 'booked',
      appointmentId: apptRef.id,
      updatedAt: serverTimestamp(),
    });

    return {
      ...newAppointmentData,
      id: apptRef.id,
    } as Appointment;
  });
}

/**
 * Fetches all appointments for the admin management view.
 */
export async function fetchAllAppointments(): Promise<Appointment[]> {
  try {
    const q = query(appointmentsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));
  } catch (error) {
    // If composite index is pending, fallback to un-ordered query and client-side sort
    const snapshot = await getDocs(appointmentsCollection);
    const appts = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));
    return appts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
}

/**
 * Confirms a pending appointment.
 */
export async function confirmAppointment(appointmentId: string): Promise<void> {
  const apptRef = doc(db, 'appointments', appointmentId);
  await updateDoc(apptRef, {
    status: 'confirmed',
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any);
}

/**
 * Rejects a pending appointment and frees the attached time slot.
 */
export async function rejectAppointment(
  appointmentId: string,
  slotId?: string,
  reason?: string
): Promise<void> {
  const apptRef = doc(db, 'appointments', appointmentId);
  await updateDoc(apptRef, {
    status: 'rejected',
    rejectionReason: reason || '',
    updatedAt: serverTimestamp(),
  } as any);

  // Free the slot if attached
  if (slotId) {
    try {
      const slotRef = doc(db, 'slots', slotId);
      const slotSnap = await getDoc(slotRef);
      if (slotSnap.exists() && slotSnap.data()?.appointmentId === appointmentId) {
        await updateDoc(slotRef, {
          status: 'available',
          appointmentId: null,
          updatedAt: serverTimestamp(),
        } as any);
      }
    } catch (e) {
      console.warn('Failed to release slot during rejection:', e);
    }
  }
}

/**
 * Cancels an appointment and frees the attached time slot.
 */
export async function cancelAppointment(
  appointmentId: string,
  slotId?: string
): Promise<void> {
  const apptRef = doc(db, 'appointments', appointmentId);
  await updateDoc(apptRef, {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any);

  // Free the slot if attached
  if (slotId) {
    try {
      const slotRef = doc(db, 'slots', slotId);
      const slotSnap = await getDoc(slotRef);
      if (slotSnap.exists() && slotSnap.data()?.appointmentId === appointmentId) {
        await updateDoc(slotRef, {
          status: 'available',
          appointmentId: null,
          updatedAt: serverTimestamp(),
        } as any);
      }
    } catch (e) {
      console.warn('Failed to release slot during cancellation:', e);
    }
  }
}

/**
 * Marks an appointment as completed.
 */
export async function completeAppointment(appointmentId: string): Promise<void> {
  const apptRef = doc(db, 'appointments', appointmentId);
  await updateDoc(apptRef, {
    status: 'completed',
    updatedAt: serverTimestamp(),
  } as any);
}

