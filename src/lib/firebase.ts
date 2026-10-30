import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromServer,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Teacher } from '../types/lms';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
}

/**
 * Hardened Firestore error handler
 * Formats errors as: FirestoreError: [operationType] at [path] failed: [original message]
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string
): never {
  const err = error as { code?: string; message?: string };
  const errorCode = err?.code || 'unknown';
  const errorMessage = err?.message || 'An unknown error occurred';

  let userMessage = `Firestore ${operationType} operation failed at ${path}: ${errorMessage}`;
  if (errorCode === 'permission-denied') {
    userMessage = `Access denied: You do not have permission to ${operationType} at ${path}.`;
  } else if (errorCode === 'not-found') {
    userMessage = `Document not found at ${path}.`;
  } else if (errorCode === 'already-exists') {
    userMessage = `Document already exists at ${path}.`;
  }

  const contextMessage = `FirestoreError: ${operationType} at ${path} failed: ${errorMessage}`;
  const richError = new Error(contextMessage);
  (richError as any).code = errorCode;
  (richError as any).operationType = operationType;
  (richError as any).path = path;
  (richError as any).userMessage = userMessage;

  console.error(contextMessage, {
    code: errorCode,
    operationType,
    path,
    originalError: error,
  });

  throw richError;
}

/**
 * Connection test on boot to verify Firestore server connectivity
 */
export async function testFirestoreConnection(): Promise<boolean> {
  const path = 'system_settings/admin_auth';
  try {
    const testDoc = doc(db, 'system_settings', 'admin_auth');
    await getDocFromServer(testDoc);
    return true;
  } catch (error) {
    const err = error as { code?: string };
    if (err?.code === 'permission-denied') {
      return true; // Server responded and rules evaluated
    }
    console.warn('Firestore connection check warning:', error);
    return false;
  }
}

export interface AdminAuthData {
  masterPassword: string;
  updatedAt: string;
  updatedBy?: string;
  isCustomSet?: boolean;
}

/**
 * Saves Admin Master Password to Firestore
 */
export async function syncAdminPasswordToFirestore(
  newPassword: string,
  updatedBy: string = 'Administrator'
): Promise<void> {
  const path = 'system_settings/admin_auth';
  try {
    const adminDocRef = doc(db, 'system_settings', 'admin_auth');
    await setDoc(adminDocRef, {
      masterPassword: newPassword,
      updatedAt: new Date().toISOString(),
      updatedBy,
      isCustomSet: newPassword !== 'admin123',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Subscribes to real-time Admin Password changes across all connected devices
 */
export function subscribeToAdminPassword(
  onUpdate: (data: AdminAuthData | null) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const path = 'system_settings/admin_auth';
  const adminDocRef = doc(db, 'system_settings', 'admin_auth');

  return onSnapshot(
    adminDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AdminAuthData);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Admin password listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves a single teacher's data & password to Firestore
 */
export async function syncTeacherToFirestore(teacher: Teacher): Promise<void> {
  const path = `teachers/${teacher.id}`;
  try {
    const teacherDocRef = doc(db, 'teachers', teacher.id);
    const dataToSave = {
      id: teacher.id,
      employeeId: teacher.employeeId,
      fullName: teacher.fullName,
      email: teacher.email || '',
      phone: teacher.phone || '',
      qualification: teacher.qualification || '',
      password: teacher.password || 'teacher123',
      isClassTeacherOf: teacher.isClassTeacherOf || null,
      assignments: teacher.assignments || [],
      updatedAt: new Date().toISOString(),
    };
    await setDoc(teacherDocRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Seeds initial teachers to Firestore if collection is empty
 */
export async function seedTeachersToFirestore(teachers: Teacher[]): Promise<void> {
  for (const teacher of teachers) {
    try {
      await syncTeacherToFirestore(teacher);
    } catch (e) {
      console.error(`Failed to seed teacher ${teacher.id} to Firestore`, e);
    }
  }
}

/**
 * Subscribes to real-time teacher roster and credentials across all devices
 */
export function subscribeToTeachers(
  onUpdate: (teachers: Teacher[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const path = 'teachers';
  const teachersCol = collection(db, 'teachers');

  return onSnapshot(
    teachersCol,
    (snapshot) => {
      const list: Teacher[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as Teacher;
        list.push({
          ...item,
          password: item.password || 'teacher123',
        });
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Teachers listener error:', error);
      if (onError) onError(error);
    }
  );
}
