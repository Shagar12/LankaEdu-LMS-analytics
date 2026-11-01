import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  enableIndexedDbPersistence,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromServer,
  deleteDoc,
  query,
  where,
  limit,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Teacher, LMSUser, UserStatus, AssignedRole, MarkSubmission, Student, SubjectConfig, AuditLogEntry } from '../types/lms';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Offline Persistence State Tracking
export let isOfflinePersistenceActive = false;
export let offlinePersistenceStatusMessage = 'Initializing IndexedDB offline persistence...';

// Enable IndexedDb Offline Persistence so teachers can continue entering marks in classrooms with unstable network connectivity
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .then(() => {
      isOfflinePersistenceActive = true;
      offlinePersistenceStatusMessage = 'IndexedDB offline persistence active. Marks cached locally and synced when online.';
      console.log('Firestore enableIndexedDbPersistence: Offline cache enabled for classroom connectivity resiliency.');
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        offlinePersistenceStatusMessage = 'Multiple browser tabs open. Offline persistence active in primary tab.';
        console.warn('Firestore enableIndexedDbPersistence: multiple tabs open. Primary tab will handle offline cache.');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        offlinePersistenceStatusMessage = 'IndexedDB offline persistence is not supported in this browser.';
        console.warn('Firestore enableIndexedDbPersistence: Browser does not support IndexedDB persistence.');
      } else {
        offlinePersistenceStatusMessage = `Persistence initialization notice: ${err?.message || err}`;
        console.warn('Firestore enableIndexedDbPersistence initialization error:', err);
      }
    });
}

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
  const path = 'settings/admin_config';
  try {
    const testDoc = doc(db, 'settings', 'admin_config');
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

export interface AdminConfigData {
  password: string;
  masterPassword?: string;
  passwordHash?: string;
  updatedAt: string;
  updatedBy?: string;
  isCustomSet?: boolean;
}

export type AdminAuthData = AdminConfigData;

/**
 * Saves Admin Master Password to Firestore (settings/admin_config)
 */
export async function syncAdminPasswordToFirestore(
  newPassword: string,
  updatedBy: string = 'Administrator',
  passwordHash?: string
): Promise<void> {
  const path = 'settings/admin_config';
  try {
    const configDocRef = doc(db, 'settings', 'admin_config');
    const payload: AdminConfigData = {
      password: newPassword,
      masterPassword: newPassword,
      passwordHash: passwordHash || '',
      updatedAt: new Date().toISOString(),
      updatedBy,
      isCustomSet: newPassword !== 'admin123',
    };
    await setDoc(configDocRef, payload, { merge: true });

    // Also sync to legacy document for backward compatibility
    const legacyDocRef = doc(db, 'system_settings', 'admin_auth');
    await setDoc(legacyDocRef, payload, { merge: true }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Subscribes to real-time Admin Password verification via settings/admin_config
 */
export function subscribeToAdminConfig(
  onUpdate: (data: AdminConfigData | null) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const path = 'settings/admin_config';
  const configDocRef = doc(db, 'settings', 'admin_config');

  return onSnapshot(
    configDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data();
        const data: AdminConfigData = {
          password: raw.password || raw.masterPassword || 'admin123',
          masterPassword: raw.masterPassword || raw.password || 'admin123',
          passwordHash: raw.passwordHash || '',
          updatedAt: raw.updatedAt || new Date().toISOString(),
          updatedBy: raw.updatedBy || 'Administrator',
          isCustomSet: typeof raw.isCustomSet === 'boolean' ? raw.isCustomSet : raw.password !== 'admin123',
        };
        onUpdate(data);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Admin config listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Alias for backward compatibility
 */
export const subscribeToAdminPassword = subscribeToAdminConfig;

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

/**
 * Master Admin Emails allowlist
 */
export const MASTER_ADMIN_EMAILS = [
  'sangeethshagar@gmail.com',
  'admin@lankaedu.lk',
  'admin@lms.lk',
];

export function isMasterAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    MASTER_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === clean) ||
    clean.startsWith('admin@') ||
    clean.includes('admin')
  );
}

/**
 * Saves or updates a user profile to Firestore under 'users' collection
 */
export async function syncUserToFirestore(user: LMSUser): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const userDocRef = doc(db, 'users', user.id);
    const dataToSave: Record<string, any> = {
      id: user.id,
      name: user.name || user.fullName || '',
      fullName: user.fullName || user.name || '',
      email: user.email.toLowerCase().trim(),
      phone: user.phone || '',
      status: user.status,
      assignedRole: user.assignedRole,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (user.password) {
      dataToSave.password = user.password;
    }
    if (user.indexNumber) {
      dataToSave.indexNumber = user.indexNumber;
    }

    await setDoc(userDocRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Updates status, assignedRole, and optional indexNumber in Firestore
 */
export async function updateUserRoleAndStatusInFirestore(
  userId: string,
  status: UserStatus,
  assignedRole: AssignedRole,
  indexNumber?: string
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const updates: Record<string, any> = {
      status,
      assignedRole,
      updatedAt: new Date().toISOString(),
    };
    if (indexNumber !== undefined) {
      updates.indexNumber = indexNumber;
    }
    await updateDoc(userDocRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Subscribes to real-time users collection updates (e.g. pending registrations and approvals)
 */
export function subscribeToUsers(
  onUpdate: (users: LMSUser[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const path = 'users';
  const usersCol = collection(db, 'users');

  return onSnapshot(
    usersCol,
    (snapshot) => {
      const list: LMSUser[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as LMSUser;
        list.push({
          ...item,
          name: item.name || item.fullName || 'User',
          fullName: item.fullName || item.name || 'User',
        });
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Users listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Seeds initial demo applicant / pending users to Firestore if collection is empty
 */
export async function seedInitialUsersToFirestore(users: LMSUser[]): Promise<void> {
  for (const user of users) {
    try {
      await syncUserToFirestore(user);
    } catch (e) {
      console.error(`Failed to seed user ${user.id} to Firestore`, e);
    }
  }
}

/**
 * Saves mark submission to Firestore under 'mark_submissions' collection.
 * Thanks to enableIndexedDbPersistence, this works seamlessly even when offline!
 */
export async function syncMarkSubmissionToFirestore(submission: MarkSubmission): Promise<void> {
  const path = `mark_submissions/${submission.id}`;
  try {
    const docRef = doc(db, 'mark_submissions', submission.id);
    const dataToSave: Record<string, any> = {
      id: submission.id,
      teacherId: submission.teacherId || 'tch_guest',
      teacherName: submission.teacherName || 'Assigned Teacher',
      subjectId: submission.subjectId,
      grade: submission.grade,
      division: submission.division,
      term: submission.term,
      status: submission.status,
      submittedAt: submission.submittedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: submission.notes || '',
    };

    if (submission.marks) {
      dataToSave.marks = submission.marks;
    }

    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Subscribes to mark submissions collection in real time
 */
export function subscribeToMarkSubmissions(
  onUpdate: (submissions: MarkSubmission[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const submissionsCol = collection(db, 'mark_submissions');

  return onSnapshot(
    submissionsCol,
    (snapshot) => {
      const list: MarkSubmission[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as MarkSubmission;
        list.push(item);
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Mark submissions listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves or updates a student profile and term marks to Firestore under 'students' collection.
 * This guarantees changes made in Admin/Teacher mode are stored in the cloud and synced in real time.
 */
export async function syncStudentToFirestore(student: Student): Promise<void> {
  const path = `students/${student.id}`;
  try {
    const studentDocRef = doc(db, 'students', student.id);
    const dataToSave: Record<string, any> = {
      id: student.id,
      indexNumber: student.indexNumber.toUpperCase().trim(),
      fullName: student.fullName,
      grade: student.grade,
      division: student.division,
      gender: student.gender,
      medium: student.medium,
      attendanceRate: student.attendanceRate,
      guardianName: student.guardianName,
      contactNumber: student.contactNumber,
      terms: student.terms,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(studentDocRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a student record from Firestore
 */
export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  const path = `students/${studentId}`;
  try {
    const studentDocRef = doc(db, 'students', studentId);
    await deleteDoc(studentDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time student roster and examination marks across all devices.
 * When an admin or teacher changes marks or adds a student, other devices (such as parents)
 * receive the update instantaneously.
 */
export function subscribeToStudents(
  onUpdate: (students: Student[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const studentsCol = collection(db, 'students');

  return onSnapshot(
    studentsCol,
    (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as Student;
        list.push({
          ...item,
          indexNumber: (item.indexNumber || '').toUpperCase().trim(),
        });
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Students listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Seeds initial baseline students to Firestore if collection is empty
 */
export async function seedInitialStudentsToFirestore(students: Student[]): Promise<void> {
  for (const student of students) {
    try {
      await syncStudentToFirestore(student);
    } catch (e) {
      console.error(`Failed to seed student ${student.id} (${student.indexNumber}) to Firestore:`, e);
    }
  }
}

/**
 * Directly queries Firestore for a student by exact Examination Index Number or Student ID.
 * Provides an instant direct-server lookup fallback for Parent Portal across devices.
 */
export async function searchStudentByIndexFromFirestore(queryStr: string): Promise<Student | null> {
  const clean = queryStr.trim().toUpperCase();
  if (!clean) return null;

  try {
    // 1. Direct doc lookup by ID
    const directDoc = await getDoc(doc(db, 'students', clean));
    if (directDoc.exists()) {
      return directDoc.data() as Student;
    }

    // 2. Query by indexNumber field
    const studentsCol = collection(db, 'students');
    const q = query(studentsCol, where('indexNumber', '==', clean), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Student;
    }

    return null;
  } catch (error) {
    console.warn(`Firestore search for student index "${clean}" warning:`, error);
    return null;
  }
}

/**
 * Deletes a teacher document from Firestore
 */
export async function deleteTeacherFromFirestore(teacherId: string): Promise<void> {
  const path = `teachers/${teacherId}`;
  try {
    const teacherDocRef = doc(db, 'teachers', teacherId);
    await deleteDoc(teacherDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Saves or updates a subject configuration to Firestore under 'subjects' collection
 */
export async function syncSubjectToFirestore(subject: SubjectConfig): Promise<void> {
  const path = `subjects/${subject.id}`;
  try {
    const subjectDocRef = doc(db, 'subjects', subject.id);
    const dataToSave: Record<string, any> = {
      id: subject.id,
      name: subject.name,
      shortName: subject.shortName,
      code: subject.code,
      applicableGrades: subject.applicableGrades,
      category: subject.category,
      updatedAt: new Date().toISOString(),
    };
    if (subject.assignedTeacherId) {
      dataToSave.assignedTeacherId = subject.assignedTeacherId;
    }
    if (subject.description) {
      dataToSave.description = subject.description;
    }

    await setDoc(subjectDocRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a subject document from Firestore
 */
export async function deleteSubjectFromFirestore(subjectId: string): Promise<void> {
  const path = `subjects/${subjectId}`;
  try {
    const subjectDocRef = doc(db, 'subjects', subjectId);
    await deleteDoc(subjectDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time curriculum subjects collection updates across all devices
 */
export function subscribeToSubjects(
  onUpdate: (subjects: SubjectConfig[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const subjectsCol = collection(db, 'subjects');

  return onSnapshot(
    subjectsCol,
    (snapshot) => {
      const list: SubjectConfig[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as SubjectConfig;
        list.push(item);
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Subjects listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Seeds initial baseline curriculum subjects to Firestore if collection is empty
 */
export async function seedInitialSubjectsToFirestore(subjects: SubjectConfig[]): Promise<void> {
  for (const subject of subjects) {
    try {
      await syncSubjectToFirestore(subject);
    } catch (e) {
      console.error(`Failed to seed subject ${subject.id} to Firestore:`, e);
    }
  }
}

/**
 * Saves an audit trail log entry to Firestore under 'audit_logs' collection.
 * Tracks every activity made by teachers, parents, students, and administrators.
 */
export async function syncAuditLogToFirestore(log: AuditLogEntry): Promise<void> {
  const path = `audit_logs/${log.id}`;
  try {
    const logDocRef = doc(db, 'audit_logs', log.id);
    const dataToSave: Record<string, any> = {
      id: log.id,
      timestamp: log.timestamp,
      actorName: log.actorName,
      actorRole: log.actorRole,
      action: log.action,
      actionTitle: log.actionTitle,
      details: log.details,
      severity: log.severity,
    };

    if (log.actorIdentifier) dataToSave.actorIdentifier = log.actorIdentifier;
    if (log.targetEntity) dataToSave.targetEntity = log.targetEntity;
    if (typeof log.grade === 'number') dataToSave.grade = log.grade;
    if (log.division) dataToSave.division = log.division;
    if (typeof log.term === 'number') dataToSave.term = log.term;
    if (log.deviceInfo) dataToSave.deviceInfo = log.deviceInfo;

    await setDoc(logDocRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Subscribes to real-time audit logs collection updates across all devices
 */
export function subscribeToAuditLogs(
  onUpdate: (logs: AuditLogEntry[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const auditCol = collection(db, 'audit_logs');

  return onSnapshot(
    auditCol,
    (snapshot) => {
      const list: AuditLogEntry[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as AuditLogEntry;
        list.push(item);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(list);
    },
    (error) => {
      console.warn('Audit logs listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Seeds initial baseline audit trail events if collection is empty
 */
export async function seedInitialAuditLogsToFirestore(logs: AuditLogEntry[]): Promise<void> {
  for (const log of logs) {
    try {
      await syncAuditLogToFirestore(log);
    } catch (e) {
      console.error(`Failed to seed audit log ${log.id} to Firestore:`, e);
    }
  }
}


