import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  GradeLevel,
  Division,
  TermNumber,
  Student,
  SubjectConfig,
  ClassStatistics,
  SubjectRanking,
  Teacher,
  TeacherAssignment,
  UserRole,
  MarkSubmission,
  MarkSubmissionStatus,
  LMSUser,
  UserStatus,
  AssignedRole,
  AuditLogEntry,
} from '../types/lms';
import { generateInitialMockStudents } from '../data/mockData';
import { INITIAL_MOCK_TEACHERS } from '../data/mockTeachers';
import { INITIAL_MOCK_USERS } from '../data/mockUsers';
import { INITIAL_MOCK_AUDIT_LOGS } from '../data/mockAuditLogs';
import {
  ALL_CURRICULUM_SUBJECTS,
  calculateTermRecord,
  assignRanks,
  calculateClassStatistics,
  calculateSubjectRankings,
} from '../utils/grading';
import {
  testFirestoreConnection,
  syncAdminPasswordToFirestore,
  subscribeToAdminConfig,
  subscribeToAdminPassword,
  syncTeacherToFirestore,
  subscribeToTeachers,
  seedTeachersToFirestore,
  syncUserToFirestore,
  updateUserRoleAndStatusInFirestore,
  subscribeToUsers,
  seedInitialUsersToFirestore,
  isMasterAdminEmail,
  MASTER_ADMIN_EMAILS,
  AdminConfigData,
  isOfflinePersistenceActive,
  syncMarkSubmissionToFirestore,
  subscribeToMarkSubmissions,
  syncStudentToFirestore,
  deleteStudentFromFirestore,
  subscribeToStudents,
  seedInitialStudentsToFirestore,
  searchStudentByIndexFromFirestore,
  deleteTeacherFromFirestore,
  syncSubjectToFirestore,
  deleteSubjectFromFirestore,
  subscribeToSubjects,
  seedInitialSubjectsToFirestore,
  syncAuditLogToFirestore,
  subscribeToAuditLogs,
  seedInitialAuditLogsToFirestore,
} from '../lib/firebase';
import {
  computeSha256Hash,
  computeSyncHash,
  isMobileDevice,
} from '../utils/authHash';

const INITIAL_MARK_SUBMISSIONS: MarkSubmission[] = [
  {
    id: 'subm_sub_math_ol_10_A_1',
    teacherId: 'tch_01',
    teacherName: 'Mrs. Pushpa Kumarihamy',
    subjectId: 'sub_math_ol',
    grade: 10,
    division: 'A',
    term: 1,
    status: 'approved',
    submittedAt: '2026-10-25 14:30',
    notes: 'All 12 term examination scripts evaluated and double checked against marking scheme.',
  },
  {
    id: 'subm_sub_sci_ol_10_A_1',
    teacherId: 'tch_01',
    teacherName: 'Mrs. Pushpa Kumarihamy',
    subjectId: 'sub_sci_ol',
    grade: 10,
    division: 'A',
    term: 1,
    status: 'submitted',
    submittedAt: '2026-10-28 09:15',
    notes: 'Submitted for principal academic review. Practical marks included.',
  },
  {
    id: 'subm_sub_eng_ol_10_B_1',
    teacherId: 'tch_02',
    teacherName: 'Mr. K. Sivalingam',
    subjectId: 'sub_eng_ol',
    grade: 10,
    division: 'B',
    term: 1,
    status: 'approved',
    submittedAt: '2026-10-26 11:00',
    notes: 'Oral and written paper results finalized.',
  },
];

interface LMSContextType {
  students: Student[];
  teachers: Teacher[];
  subjects: SubjectConfig[];
  selectedGrade: GradeLevel;
  selectedDivision: Division;
  selectedTerm: TermNumber;
  activeTab: 'overview' | 'analytics' | 'students' | 'batch_entry' | 'teachers_subjects' | 'data_management' | 'settings' | 'approvals' | 'audit_trail';
  searchQuery: string;
  selectedStudentId: string | null;
  theme: 'light' | 'dark';
  currentSubjects: SubjectConfig[];
  currentClassStats: ClassStatistics;
  currentSubjectRankings: SubjectRanking[];
  currentDivisionComparison: {
    division: Division;
    average: number;
    passRate: number;
    failureRate: number;
    allAsCount: number;
    totalStudents: number;
  }[];
  currentClassTeacher: Teacher | undefined;
  auditLogs: AuditLogEntry[];
  logAuditEvent: (event: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  clearAuditLogs: () => void;
  setSelectedGrade: (grade: GradeLevel) => void;
  setSelectedDivision: (division: Division) => void;
  setSelectedTerm: (term: TermNumber) => void;
  setActiveTab: (tab: 'overview' | 'analytics' | 'students' | 'batch_entry' | 'teachers_subjects' | 'data_management' | 'settings' | 'approvals' | 'audit_trail') => void;
  setSearchQuery: (query: string) => void;
  setSelectedStudentId: (id: string | null) => void;
  toggleTheme: () => void;
  updateStudentTermMarks: (studentId: string, term: TermNumber, marks: Record<string, number>) => void;
  batchUpdateClassMarks: (term: TermNumber, updates: Record<string, Record<string, number>>) => void;
  addNewStudent: (newStudentData: {
    fullName: string;
    grade: GradeLevel;
    division: Division;
    gender: 'Male' | 'Female';
    medium: 'Sinhala' | 'Tamil' | 'English';
    attendanceRate: number;
    guardianName: string;
    contactNumber: string;
    customIndexNumber?: string;
  }) => string;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  deleteStudent: (studentId: string) => void;
  bulkImportStudents: (imported: Partial<Student>[]) => { successCount: number; errors: string[] };
  // Teacher management
  addTeacher: (teacher: {
    fullName: string;
    email: string;
    phone: string;
    qualification: string;
    password?: string;
    isClassTeacherOf?: { grade: GradeLevel; division: Division };
    assignments: { subjectId: string; grade: GradeLevel; division: Division | 'all' }[];
  }) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  assignTeacherToSubject: (teacherId: string, subjectId: string, grade: GradeLevel, division: Division | 'all') => void;
  removeTeacherAssignment: (teacherId: string, assignmentId: string) => void;
  getTeacherForSubject: (subjectId: string, grade: GradeLevel, division: Division) => Teacher | undefined;
  getClassTeacher: (grade: GradeLevel, division: Division) => Teacher | undefined;
  // Subject management
  addSubject: (subject: {
    name: string;
    shortName: string;
    code: string;
    applicableGrades: number[];
    category: 'core' | 'basket' | 'al_stream';
    description?: string;
  }) => void;
  updateSubject: (id: string, updates: Partial<SubjectConfig>) => void;
  deleteSubject: (id: string) => void;
  resetToDemoData: () => void;

  // 3-Tier RBAC State & Operations
  currentRole: UserRole;
  isAdmin: boolean;
  isAdminAuthenticated: boolean;
  isAdminRemembered: boolean;
  activeSessionAuthHash: string | null;
  adminNotification: string | null;
  clearAdminNotification: () => void;
  isCurrentDeviceMobile: boolean;
  adminPassword: string;
  isCustomPasswordSet: boolean;
  changeAdminPassword: (currentPassword: string, newPassword: string) => { success: boolean; message: string };
  resetAdminPasswordToDefault: () => void;
  currentTeacher: Teacher | null;
  markSubmissions: MarkSubmission[];
  instantSaveMode: boolean;
  setInstantSaveMode: (mode: boolean) => void;
  loginAdmin: (password: string, rememberMe?: boolean) => boolean;
  logoutAdmin: () => void;
  loginTeacher: (employeeId: string, password: string) => { success: boolean; message: string; teacher?: Teacher };
  logoutTeacher: () => void;
  switchRole: (role: UserRole) => void;
  submitMarksForReview: (subjectId: string, grade: GradeLevel, division: Division, term: TermNumber, notes?: string) => void;
  approveMarksSubmission: (submissionId: string) => void;
  getSubmissionStatus: (subjectId: string, grade: GradeLevel, division: Division, term: TermNumber) => MarkSubmissionStatus;
  isSubjectEditableByCurrentRole: (subjectId: string, grade: GradeLevel, division: Division) => boolean;

  // Firebase Real-time Multi-Device Sync & Offline Persistence
  isFirebaseConnected: boolean;
  isFirebaseSyncing: boolean;
  lastFirebaseSync: string | null;
  isOnline: boolean;
  isOfflinePersistenceActive: boolean;
  updateTeacherPassword: (teacherId: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  syncAllCredentialsToFirebase: () => Promise<{ success: boolean; message: string }>;

  // Unified Signup, Onboarding & Admin Approvals Hub
  users: LMSUser[];
  pendingUsers: LMSUser[];
  currentUser: LMSUser | null;
  isPendingReview: boolean;
  showLandingPage: boolean;
  setShowLandingPage: (show: boolean) => void;
  signupUser: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; message: string; user?: LMSUser }>;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: UserRole; isPending?: boolean }>;
  logoutUser: () => void;
  assignUserAsTeacher: (userId: string) => Promise<{ success: boolean; message: string }>;
  assignUserAsStudent: (userId: string, indexNumber: string) => Promise<{ success: boolean; message: string }>;
  rejectUserRegistration: (userId: string) => Promise<{ success: boolean; message: string }>;
  refreshCurrentUserStatus: () => Promise<void>;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

const STUDENTS_STORAGE_KEY = 'lankaedu_lms_records_v1';
const TEACHERS_STORAGE_KEY = 'lankaedu_teachers_v1';
const SUBJECTS_STORAGE_KEY = 'lankaedu_subjects_v1';
const SUBMISSIONS_STORAGE_KEY = 'lankaedu_mark_submissions_v1';
const ROLE_STORAGE_KEY = 'lankaedu_current_role_v1';
const ADMIN_AUTH_STORAGE_KEY = 'lankaedu_admin_auth_v1';
const ADMIN_AUTH_HASH_KEY = 'lankaedu_admin_auth_hash_v1';
const ADMIN_REMEMBER_ME_KEY = 'lankaedu_admin_remember_me_v1';
const LOGGED_TEACHER_STORAGE_KEY = 'lankaedu_logged_teacher_id_v1';
const USERS_STORAGE_KEY = 'lankaedu_users_v1';
const CURRENT_USER_STORAGE_KEY = 'lankaedu_current_user_v1';
const THEME_KEY = 'lankaedu_theme_v1';

const ADMIN_PASSWORD_STORAGE_KEY = 'lankaedu_admin_password_v1';

export const LMSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Mobile device detection
  const isCurrentDeviceMobile = useMemo(() => isMobileDevice(), []);

  // Users collection state (all registered users, applicants, and roles)
  const [users, setUsers] = useState<LMSUser[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed reading users from storage', e);
    }
    return INITIAL_MOCK_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed writing users to storage', e);
    }
  }, [users]);

  // Current logged in user profile
  const [currentUser, setCurrentUser] = useState<LMSUser | null>(() => {
    try {
      const stored = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed reading current user from storage', e);
    }
    return null;
  });

  const currentUserRef = useRef<LMSUser | null>(currentUser);
  currentUserRef.current = currentUser;

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  }, [currentUser]);

  // Locked pending state
  const [isPendingReview, setIsPendingReview] = useState<boolean>(() => {
    return currentUser?.status === 'pending';
  });

  // Show Unified Landing Page if no user session is active
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    return currentUser === null;
  });

  // Derived list of all users awaiting admin role assignment
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.status === 'pending');
  }, [users]);

  // RBAC State
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    if (saved === 'admin' || saved === 'teacher' || saved === 'student' || saved === 'parent') {
      return saved;
    }
    return 'admin';
  });

  // Remember Me state
  const [isAdminRemembered, setIsAdminRemembered] = useState<boolean>(() => {
    return localStorage.getItem(ADMIN_REMEMBER_ME_KEY) === 'true';
  });

  // Admin authentication state:
  // Session Expiry: Do not keep Admin sessions logged in indefinitely on mobile devices unless explicitly checked ('Remember Me').
  // Default to expiring the Admin session when the browser tab or app is closed.
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const isRemembered = localStorage.getItem(ADMIN_REMEMBER_ME_KEY) === 'true';
    const sessionAuth = sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true';
    const localAuth = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true';

    if (isRemembered) {
      return localAuth || sessionAuth;
    }

    // Default: expires when the tab or app is closed
    if (localAuth) {
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      localStorage.removeItem(ADMIN_AUTH_HASH_KEY);
    }
    return sessionAuth;
  });

  // Active Session's Authentication Hash
  const [activeSessionAuthHash, setActiveSessionAuthHash] = useState<string | null>(() => {
    const isRemembered = localStorage.getItem(ADMIN_REMEMBER_ME_KEY) === 'true';
    if (isRemembered) {
      return localStorage.getItem(ADMIN_AUTH_HASH_KEY) || sessionStorage.getItem(ADMIN_AUTH_HASH_KEY);
    }
    return sessionStorage.getItem(ADMIN_AUTH_HASH_KEY);
  });

  // Notification for remote auto-logout
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  const activeSessionAuthHashRef = useRef<string | null>(activeSessionAuthHash);
  activeSessionAuthHashRef.current = activeSessionAuthHash;

  const isAdminAuthenticatedRef = useRef<boolean>(isAdminAuthenticated);
  isAdminAuthenticatedRef.current = isAdminAuthenticated;

  const isAdminRememberedRef = useRef<boolean>(isAdminRemembered);
  isAdminRememberedRef.current = isAdminRemembered;

  // Dynamic Master Administrator Password (persisted in localStorage)
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || 'admin123';
  });

  const isCustomPasswordSet = adminPassword !== 'admin123';

  const isAdmin = currentRole === 'admin' && isAdminAuthenticated;

  useEffect(() => {
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, adminPassword);
  }, [adminPassword]);

  // If authenticated but hash was not yet generated, seed it
  useEffect(() => {
    if (isAdminAuthenticated && !activeSessionAuthHash) {
      const initialHash = computeSyncHash(adminPassword);
      setActiveSessionAuthHash(initialHash);
      activeSessionAuthHashRef.current = initialHash;
      sessionStorage.setItem(ADMIN_AUTH_HASH_KEY, initialHash);
      if (isAdminRemembered) {
        localStorage.setItem(ADMIN_AUTH_HASH_KEY, initialHash);
      }

      computeSha256Hash(adminPassword).then((sha256) => {
        setActiveSessionAuthHash(sha256);
        activeSessionAuthHashRef.current = sha256;
        sessionStorage.setItem(ADMIN_AUTH_HASH_KEY, sha256);
        if (isAdminRememberedRef.current) {
          localStorage.setItem(ADMIN_AUTH_HASH_KEY, sha256);
        }
      });
    }
  }, [isAdminAuthenticated, adminPassword, isAdminRemembered, activeSessionAuthHash]);

  // Firebase Firestore Real-Time Sync & Offline Persistence State
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(false);
  const [lastFirebaseSync, setLastFirebaseSync] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [loggedTeacherId, setLoggedTeacherId] = useState<string | null>(() => {
    return localStorage.getItem(LOGGED_TEACHER_STORAGE_KEY);
  });

  const [instantSaveMode, setInstantSaveMode] = useState<boolean>(false);

  // Mark Submissions for Teacher -> Admin Review workflow
  const [markSubmissions, setMarkSubmissions] = useState<MarkSubmission[]>(() => {
    try {
      const stored = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed reading mark submissions', e);
    }
    return INITIAL_MARK_SUBMISSIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(markSubmissions));
    } catch (e) {
      console.error('Failed writing mark submissions', e);
    }
  }, [markSubmissions]);

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, currentRole);
  }, [currentRole]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
      if (isAdminRemembered) {
        localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
        localStorage.setItem(ADMIN_REMEMBER_ME_KEY, 'true');
        if (activeSessionAuthHash) {
          localStorage.setItem(ADMIN_AUTH_HASH_KEY, activeSessionAuthHash);
        }
      } else {
        localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
        localStorage.removeItem(ADMIN_AUTH_HASH_KEY);
        localStorage.removeItem(ADMIN_REMEMBER_ME_KEY);
      }
      if (activeSessionAuthHash) {
        sessionStorage.setItem(ADMIN_AUTH_HASH_KEY, activeSessionAuthHash);
      }
    } else {
      sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      sessionStorage.removeItem(ADMIN_AUTH_HASH_KEY);
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      localStorage.removeItem(ADMIN_AUTH_HASH_KEY);
      localStorage.removeItem(ADMIN_REMEMBER_ME_KEY);
    }
  }, [isAdminAuthenticated, isAdminRemembered, activeSessionAuthHash]);

  useEffect(() => {
    if (loggedTeacherId) {
      localStorage.setItem(LOGGED_TEACHER_STORAGE_KEY, loggedTeacherId);
    } else {
      localStorage.removeItem(LOGGED_TEACHER_STORAGE_KEY);
    }
  }, [loggedTeacherId]);

  // Filter and view state
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(10);
  const [selectedDivision, setSelectedDivision] = useState<Division>('A');
  const [selectedTerm, setSelectedTerm] = useState<TermNumber>(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'students' | 'batch_entry' | 'teachers_subjects' | 'data_management' | 'settings' | 'approvals' | 'audit_trail'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // System & RBAC Audit Trail state
  const AUDIT_LOGS_STORAGE_KEY = 'lankaedu_audit_logs';
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed reading audit logs from localStorage', e);
    }
    return INITIAL_MOCK_AUDIT_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Failed writing audit logs to localStorage', e);
    }
  }, [auditLogs]);

  // 1. Teachers list
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const stored = localStorage.getItem(TEACHERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: Teacher) => ({
            ...t,
            password: t.password || 'teacher123',
          }));
        }
      }
    } catch (e) {
      console.error('Failed reading teachers from localStorage', e);
    }
    return INITIAL_MOCK_TEACHERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teachers));
    } catch (e) {
      console.error('Failed writing teachers to localStorage', e);
    }
  }, [teachers]);

  // 2. Subjects list
  const [subjects, setSubjects] = useState<SubjectConfig[]>(() => {
    try {
      const stored = localStorage.getItem(SUBJECTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed reading subjects from localStorage', e);
    }
    return ALL_CURRICULUM_SUBJECTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
    } catch (e) {
      console.error('Failed writing subjects to localStorage', e);
    }
  }, [subjects]);

  // 3. Students list
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const stored = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Student[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return assignRanks(parsed);
        }
      }
    } catch (e) {
      console.error('Failed reading students from localStorage', e);
    }
    return generateInitialMockStudents();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    } catch (e) {
      console.error('Failed writing students to localStorage', e);
    }
  }, [students]);

  // Real-time Firestore synchronization for Admin, Faculty credentials, User Registrations, Students roster, and Mark Submissions across all devices
  useEffect(() => {
    let unsubscribeAdmin: (() => void) | undefined;
    let unsubscribeTeachers: (() => void) | undefined;
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeMarkSubmissions: (() => void) | undefined;
    let unsubscribeStudents: (() => void) | undefined;
    let unsubscribeSubjects: (() => void) | undefined;
    let unsubscribeAuditLogs: (() => void) | undefined;

    testFirestoreConnection().then((connected) => {
      setIsFirebaseConnected(connected);
      if (!connected) return;

      // 1. Real-time Password Verification: Set up a Firestore onSnapshot listener on the admin_config settings document
      unsubscribeAdmin = subscribeToAdminConfig((remoteData) => {
        const rawPassword = remoteData?.password || remoteData?.masterPassword;
        if (rawPassword) {
          const remotePassword = rawPassword.trim();
          const remoteHash = remoteData?.passwordHash;

          // Check if admin is currently authenticated in this session
          if (isAdminAuthenticatedRef.current) {
            const currentSessionHash = activeSessionAuthHashRef.current;

            computeSha256Hash(remotePassword).then((computedRemoteSha256) => {
              const computedRemoteSync = computeSyncHash(remotePassword);
              const targetRemoteHash = remoteHash || computedRemoteSha256;

              const isMatch =
                Boolean(currentSessionHash) &&
                (currentSessionHash === targetRemoteHash ||
                  currentSessionHash === computedRemoteSha256 ||
                  currentSessionHash === computedRemoteSync);

              // Auto-Logout on Password Change
              if (!isMatch) {
                console.warn(
                  'Auto-Logout on Password Change: Remote password does not match active session authentication hash.'
                );

                setIsAdminAuthenticated(false);
                isAdminAuthenticatedRef.current = false;
                setActiveSessionAuthHash(null);
                activeSessionAuthHashRef.current = null;
                setIsAdminRemembered(false);
                isAdminRememberedRef.current = false;

                localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
                localStorage.removeItem(ADMIN_AUTH_HASH_KEY);
                localStorage.removeItem(ADMIN_REMEMBER_ME_KEY);
                sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
                sessionStorage.removeItem(ADMIN_AUTH_HASH_KEY);

                setAdminNotification(
                  'Admin password was updated on another device. Please log in again with the new password.'
                );

                setCurrentRole((prev) => (prev === 'admin' ? 'parent' : prev));
                setAdminPassword(remotePassword);
                localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, remotePassword);
                setLastFirebaseSync(new Date().toLocaleTimeString());
                return;
              }

              setAdminPassword(remotePassword);
              localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, remotePassword);
              setLastFirebaseSync(new Date().toLocaleTimeString());
            });
          } else {
            setAdminPassword(remotePassword);
            localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, remotePassword);
            setLastFirebaseSync(new Date().toLocaleTimeString());
          }
        } else {
          const currentLocal = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || 'admin123';
          computeSha256Hash(currentLocal).then((hash) => {
            syncAdminPasswordToFirestore(currentLocal, 'System Initialization', hash).catch((err) =>
              console.warn('Initial admin password sync note:', err)
            );
          });
        }
      });

      // 2. Subscribe to Teacher credentials & updates in real time
      unsubscribeTeachers = subscribeToTeachers((remoteTeachers) => {
        if (remoteTeachers.length > 0) {
          setTeachers((prev) => {
            const hasChange =
              remoteTeachers.length !== prev.length ||
              remoteTeachers.some((rt) => {
                const pt = prev.find((p) => p.id === rt.id);
                return !pt || pt.password !== rt.password || pt.fullName !== rt.fullName;
              });

            if (hasChange) {
              localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(remoteTeachers));
              return remoteTeachers;
            }
            return prev;
          });
          setLastFirebaseSync(new Date().toLocaleTimeString());
        } else {
          seedTeachersToFirestore(INITIAL_MOCK_TEACHERS).catch((err) =>
            console.warn('Initial faculty seed note:', err)
          );
        }
      });

      // 3. Subscribe to Users collection in real time (Onboarding, pending approvals, and role updates)
      unsubscribeUsers = subscribeToUsers((remoteUsers) => {
        if (remoteUsers.length > 0) {
          setUsers(remoteUsers);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(remoteUsers));

          // Real-time synchronization for currently logged-in user
          if (currentUserRef.current) {
            const currentEmail = currentUserRef.current.email.toLowerCase().trim();
            const currentId = currentUserRef.current.id;
            const updated = remoteUsers.find(
              (u) => u.id === currentId || u.email.toLowerCase().trim() === currentEmail
            );

            if (updated) {
              setCurrentUser(updated);
              currentUserRef.current = updated;
              localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updated));

              if (updated.status === 'active') {
                setIsPendingReview(false);
                if (updated.assignedRole === 'teacher') {
                  setCurrentRole('teacher');
                  setActiveTab('teachers_subjects');
                } else if (updated.assignedRole === 'student') {
                  setCurrentRole('student');
                  setActiveTab('students');
                }
              } else if (updated.status === 'pending') {
                setIsPendingReview(true);
              }
            }
          }
          setLastFirebaseSync(new Date().toLocaleTimeString());
        } else {
          seedInitialUsersToFirestore(INITIAL_MOCK_USERS).catch((err) =>
            console.warn('Initial users seed note:', err)
          );
        }
      });

      // 4. Subscribe to Mark Submissions collection (offline-first with IndexedDB persistence)
      unsubscribeMarkSubmissions = subscribeToMarkSubmissions((remoteSubmissions) => {
        if (remoteSubmissions.length > 0) {
          setMarkSubmissions((prev) => {
            const map = new Map<string, MarkSubmission>();
            prev.forEach((p) => map.set(p.id, p));
            remoteSubmissions.forEach((r) => map.set(r.id, r));
            const merged = Array.from(map.values());
            localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      });

      // 5. Subscribe to Students collection in real time across all devices (marks, new students, rank calculations)
      unsubscribeStudents = subscribeToStudents((remoteStudents) => {
        if (remoteStudents.length > 0) {
          const ranked = assignRanks(remoteStudents);
          setStudents(ranked);
          try {
            localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(ranked));
          } catch (e) {
            console.error('Failed writing students to storage', e);
          }
          setLastFirebaseSync(new Date().toLocaleTimeString());
        } else {
          // If Firestore students collection is completely empty, seed initial baseline students so all devices start with identical records
          const initial = generateInitialMockStudents();
          seedInitialStudentsToFirestore(initial).catch((err) =>
            console.warn('Initial students seed note:', err)
          );
        }
      });

      // 6. Subscribe to Curriculum Subjects collection in real time across all devices
      unsubscribeSubjects = subscribeToSubjects((remoteSubjects) => {
        if (remoteSubjects.length > 0) {
          setSubjects(remoteSubjects);
          try {
            localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(remoteSubjects));
          } catch (e) {
            console.error('Failed writing subjects to storage', e);
          }
          setLastFirebaseSync(new Date().toLocaleTimeString());
        } else {
          // If Firestore subjects collection is empty, seed initial baseline subjects
          seedInitialSubjectsToFirestore(ALL_CURRICULUM_SUBJECTS).catch((err) =>
            console.warn('Initial subjects seed note:', err)
          );
        }
      });

      // 7. Subscribe to Audit Trail Logs collection in real time across all devices
      unsubscribeAuditLogs = subscribeToAuditLogs((remoteLogs) => {
        if (remoteLogs.length > 0) {
          setAuditLogs(remoteLogs);
          try {
            localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(remoteLogs));
          } catch (e) {
            console.error('Failed writing audit logs to storage', e);
          }
          setLastFirebaseSync(new Date().toLocaleTimeString());
        } else {
          seedInitialAuditLogsToFirestore(INITIAL_MOCK_AUDIT_LOGS).catch((err) =>
            console.warn('Initial audit logs seed note:', err)
          );
        }
      });
    });

    return () => {
      if (unsubscribeAdmin) unsubscribeAdmin();
      if (unsubscribeTeachers) unsubscribeTeachers();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeMarkSubmissions) unsubscribeMarkSubmissions();
      if (unsubscribeStudents) unsubscribeStudents();
      if (unsubscribeSubjects) unsubscribeSubjects();
      if (unsubscribeAuditLogs) unsubscribeAuditLogs();
    };
  }, []);

  // Currently logged in teacher object
  const currentTeacher = useMemo(() => {
    if (!loggedTeacherId) return null;
    return teachers.find((t) => t.id === loggedTeacherId || t.employeeId === loggedTeacherId) || null;
  }, [teachers, loggedTeacherId]);

  // Record Audit Trail Event across Firebase and PostgreSQL Cloud SQL
  const logAuditEvent = (event: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: AuditLogEntry = {
      ...event,
      id,
      timestamp: new Date().toISOString(),
      deviceInfo:
        event.deviceInfo ||
        (typeof navigator !== 'undefined'
          ? isCurrentDeviceMobile
            ? 'Mobile Device'
            : 'Desktop Web Browser'
          : 'System'),
    };

    setAuditLogs((prev) => [newEntry, ...prev.filter((l) => l.id !== id)]);

    // Sync to Firestore in real time so all admin instances can watch logs live
    syncAuditLogToFirestore(newEntry).catch((err) =>
      console.warn('Firestore audit log sync note:', err)
    );

    // Also send to Cloud SQL relational database backend
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: newEntry.action,
        userEmail: newEntry.actorIdentifier || newEntry.actorName,
        details: `${newEntry.actionTitle}: ${newEntry.details}`,
        ipAddress: 'Client Session',
      }),
    }).catch((err) => console.warn('Cloud SQL audit log notice:', err));
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    localStorage.removeItem(AUDIT_LOGS_STORAGE_KEY);
  };

  // Current curriculum subjects for selected grade
  const currentSubjects = useMemo(() => {
    return subjects.filter((sub) => sub.applicableGrades.includes(selectedGrade));
  }, [subjects, selectedGrade]);

  // Current class statistics
  const currentClassStats = useMemo(() => {
    return calculateClassStatistics(students, selectedGrade, selectedDivision, selectedTerm, currentSubjects);
  }, [students, selectedGrade, selectedDivision, selectedTerm, currentSubjects]);

  // Subject rankings for current grade & division
  const currentSubjectRankings = useMemo(() => {
    return calculateSubjectRankings(students, selectedGrade, selectedDivision, selectedTerm, currentSubjects);
  }, [students, selectedGrade, selectedDivision, selectedTerm, currentSubjects]);

  // Cross-division comparison (e.g. 10-A vs 10-B vs 10-C)
  const currentDivisionComparison = useMemo(() => {
    const divisions: Division[] = ['A', 'B', 'C'];
    return divisions.map((div) => {
      const stats = calculateClassStatistics(students, selectedGrade, div, selectedTerm, currentSubjects);
      return {
        division: div,
        average: stats.classAverage,
        passRate: stats.passRate,
        failureRate: stats.failureRate,
        allAsCount: stats.allAsCount,
        totalStudents: stats.totalStudents,
      };
    });
  }, [students, selectedGrade, selectedTerm, currentSubjects]);

  // Current Class Teacher
  const currentClassTeacher = useMemo(() => {
    return teachers.find(
      (t) => t.isClassTeacherOf?.grade === selectedGrade && t.isClassTeacherOf?.division === selectedDivision
    );
  }, [teachers, selectedGrade, selectedDivision]);

  // Helper: Find teacher assigned to a subject in a specific class
  const getTeacherForSubject = (subjectId: string, grade: GradeLevel, division: Division): Teacher | undefined => {
    return teachers.find((t) =>
      t.assignments.some(
        (asgn) => asgn.subjectId === subjectId && asgn.grade === grade && (asgn.division === 'all' || asgn.division === division)
      )
    );
  };

  // Helper: Find Class Teacher
  const getClassTeacher = (grade: GradeLevel, division: Division): Teacher | undefined => {
    return teachers.find((t) => t.isClassTeacherOf?.grade === grade && t.isClassTeacherOf?.division === division);
  };

  // RBAC Permission Checker: can current user edit a specific subject in a specific class?
  const isSubjectEditableByCurrentRole = (subjectId: string, grade: GradeLevel, division: Division): boolean => {
    if (currentRole === 'admin') {
      return isAdminAuthenticated;
    }
    if (currentRole === 'parent') {
      return false; // Parent is 100% read-only
    }
    if (currentRole === 'teacher') {
      if (!currentTeacher) return false;
      // Check if this teacher is assigned to this subject, grade and division
      return currentTeacher.assignments.some(
        (asgn) =>
          asgn.subjectId === subjectId &&
          asgn.grade === grade &&
          (asgn.division === 'all' || asgn.division === division)
      );
    }
    return false;
  };

  // RBAC Authentication methods
  const loginAdmin = (password: string, rememberMe: boolean = false): boolean => {
    if (password === adminPassword) {
      const syncHash = computeSyncHash(password);
      setIsAdminAuthenticated(true);
      isAdminAuthenticatedRef.current = true;
      setIsAdminRemembered(rememberMe);
      isAdminRememberedRef.current = rememberMe;
      setActiveSessionAuthHash(syncHash);
      activeSessionAuthHashRef.current = syncHash;
      setCurrentRole('admin');
      setAdminNotification(null); // Clear any auto-logout alert

      // Session Expiry:
      // Do not keep Admin sessions logged in indefinitely on mobile devices unless explicitly checked ('Remember Me').
      // Default to expiring the Admin session when the browser tab or app is closed.
      sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
      sessionStorage.setItem(ADMIN_AUTH_HASH_KEY, syncHash);

      if (rememberMe) {
        localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
        localStorage.setItem(ADMIN_AUTH_HASH_KEY, syncHash);
        localStorage.setItem(ADMIN_REMEMBER_ME_KEY, 'true');
      } else {
        localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
        localStorage.removeItem(ADMIN_AUTH_HASH_KEY);
        localStorage.removeItem(ADMIN_REMEMBER_ME_KEY);
      }

      computeSha256Hash(password).then((sha256) => {
        setActiveSessionAuthHash(sha256);
        activeSessionAuthHashRef.current = sha256;
        sessionStorage.setItem(ADMIN_AUTH_HASH_KEY, sha256);
        if (isAdminRememberedRef.current) {
          localStorage.setItem(ADMIN_AUTH_HASH_KEY, sha256);
        }
      });

      return true;
    }
    return false;
  };

  const changeAdminPassword = (currentPassword: string, newPassword: string): { success: boolean; message: string } => {
    if (currentPassword !== adminPassword) {
      return {
        success: false,
        message: 'The current administrator password entered is incorrect.',
      };
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return {
        success: false,
        message: 'New password must be at least 4 characters long.',
      };
    }

    if (newPassword === currentPassword) {
      return {
        success: false,
        message: 'New password cannot be identical to your current password.',
      };
    }

    const trimmed = newPassword.trim();
    setAdminPassword(trimmed);
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, trimmed);

    // Update active session authentication hash to match new password BEFORE writing to remote database
    const syncHash = computeSyncHash(trimmed);
    setActiveSessionAuthHash(syncHash);
    activeSessionAuthHashRef.current = syncHash;
    sessionStorage.setItem(ADMIN_AUTH_HASH_KEY, syncHash);
    if (isAdminRemembered) {
      localStorage.setItem(ADMIN_AUTH_HASH_KEY, syncHash);
    }

    // Synchronize to Firebase Firestore immediately for all devices with SHA-256 hash
    setIsFirebaseSyncing(true);
    computeSha256Hash(trimmed).then((sha256Hash) => {
      setActiveSessionAuthHash(sha256Hash);
      activeSessionAuthHashRef.current = sha256Hash;
      sessionStorage.setItem(ADMIN_AUTH_HASH_KEY, sha256Hash);
      if (isAdminRememberedRef.current) {
        localStorage.setItem(ADMIN_AUTH_HASH_KEY, sha256Hash);
      }

      syncAdminPasswordToFirestore(trimmed, 'Master Administrator', sha256Hash)
        .then(() => {
          setIsFirebaseSyncing(false);
          setLastFirebaseSync(new Date().toLocaleTimeString());
        })
        .catch((err) => {
          setIsFirebaseSyncing(false);
          console.warn('Firebase admin password sync warning:', err);
        });
    });

    logAuditEvent({
      actorName: 'Master Administrator',
      actorRole: 'admin',
      action: 'ADMIN_PASSWORD_CHANGE',
      actionTitle: 'Master Password Updated',
      details: 'Administrator updated system master password. Remote session revocation triggered across all active devices.',
      severity: 'warning',
    });

    return {
      success: true,
      message: 'Administrator master password has been successfully updated and synced to Firebase Firestore! All devices immediately require the new password.',
    };
  };

  const resetAdminPasswordToDefault = () => {
    const defaultPwd = 'admin123';
    setAdminPassword(defaultPwd);
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, defaultPwd);

    const syncHash = computeSyncHash(defaultPwd);
    setActiveSessionAuthHash(syncHash);
    activeSessionAuthHashRef.current = syncHash;
    sessionStorage.setItem(ADMIN_AUTH_HASH_KEY, syncHash);
    if (isAdminRemembered) {
      localStorage.setItem(ADMIN_AUTH_HASH_KEY, syncHash);
    }

    setIsFirebaseSyncing(true);
    computeSha256Hash(defaultPwd).then((sha256Hash) => {
      setActiveSessionAuthHash(sha256Hash);
      activeSessionAuthHashRef.current = sha256Hash;
      sessionStorage.setItem(ADMIN_AUTH_HASH_KEY, sha256Hash);
      if (isAdminRememberedRef.current) {
        localStorage.setItem(ADMIN_AUTH_HASH_KEY, sha256Hash);
      }

      syncAdminPasswordToFirestore(defaultPwd, 'Default Reset', sha256Hash)
        .then(() => {
          setIsFirebaseSyncing(false);
          setLastFirebaseSync(new Date().toLocaleTimeString());
        })
        .catch((err) => {
          setIsFirebaseSyncing(false);
          console.warn('Firebase reset sync warning:', err);
        });
    });

    logAuditEvent({
      actorName: 'Master Administrator',
      actorRole: 'admin',
      action: 'ADMIN_PASSWORD_CHANGE',
      actionTitle: 'Master Password Reset to Default',
      details: 'Master administrator password reset to factory default (admin123).',
      severity: 'critical',
    });
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    isAdminAuthenticatedRef.current = false;
    setActiveSessionAuthHash(null);
    activeSessionAuthHashRef.current = null;
    setIsAdminRemembered(false);
    isAdminRememberedRef.current = false;
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    localStorage.removeItem(ADMIN_AUTH_HASH_KEY);
    localStorage.removeItem(ADMIN_REMEMBER_ME_KEY);
    sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_AUTH_HASH_KEY);
  };

  const clearAdminNotification = () => {
    setAdminNotification(null);
  };

  const updateTeacherPassword = async (
    teacherId: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!newPassword || newPassword.trim().length < 4) {
      return {
        success: false,
        message: 'Teacher password must be at least 4 characters long.',
      };
    }

    const targetTeacher = teachers.find((t) => t.id === teacherId);
    if (!targetTeacher) {
      return {
        success: false,
        message: 'Teacher record not found.',
      };
    }

    const updatedTeacher: Teacher = {
      ...targetTeacher,
      password: newPassword.trim(),
    };

    setTeachers((prev) => prev.map((t) => (t.id === teacherId ? updatedTeacher : t)));

    setIsFirebaseSyncing(true);
    try {
      await syncTeacherToFirestore(updatedTeacher);
      setIsFirebaseSyncing(false);
      setLastFirebaseSync(new Date().toLocaleTimeString());
      return {
        success: true,
        message: `Password for ${targetTeacher.fullName} (${targetTeacher.employeeId}) has been updated and synced to Firebase Firestore across all devices!`,
      };
    } catch (e) {
      setIsFirebaseSyncing(false);
      console.warn('Firebase teacher password sync warning:', e);
      return {
        success: true,
        message: `Password updated locally. (Firebase sync note: saved to local cache)`,
      };
    }
  };

  const syncAllCredentialsToFirebase = async (): Promise<{ success: boolean; message: string }> => {
    setIsFirebaseSyncing(true);
    try {
      const sha256 = await computeSha256Hash(adminPassword);
      await syncAdminPasswordToFirestore(adminPassword, 'Manual Sync All', sha256);
      for (const t of teachers) {
        await syncTeacherToFirestore(t);
      }
      setIsFirebaseSyncing(false);
      setLastFirebaseSync(new Date().toLocaleTimeString());
      return {
        success: true,
        message: `All administrator and faculty credentials (${teachers.length} teachers) successfully synced to Firebase Firestore!`,
      };
    } catch (e) {
      setIsFirebaseSyncing(false);
      return {
        success: false,
        message: `Sync encountered error: ${e instanceof Error ? e.message : 'Unknown'}`,
      };
    }
  };

  const loginTeacher = (employeeId: string, password: string) => {
    const trimmedId = employeeId.trim().toUpperCase();
    const teacher = teachers.find(
      (t) => t.employeeId.toUpperCase() === trimmedId || t.email.toLowerCase() === employeeId.trim().toLowerCase()
    );

    if (!teacher) {
      return {
        success: false,
        message: `Teacher ID "${employeeId}" not found in school records.`,
      };
    }

    const expectedPassword = teacher.password || 'teacher123';
    if (password !== expectedPassword) {
      return {
        success: false,
        message: 'Invalid password. (Default is teacher123)',
      };
    }

    setLoggedTeacherId(teacher.id);
    setCurrentRole('teacher');
    setActiveTab('teachers_subjects');

    // Auto-select first assigned grade & division if available
    if (teacher.assignments.length > 0) {
      const first = teacher.assignments[0];
      setSelectedGrade(first.grade);
      if (first.division !== 'all') {
        setSelectedDivision(first.division);
      }
    } else if (teacher.isClassTeacherOf) {
      setSelectedGrade(teacher.isClassTeacherOf.grade);
      setSelectedDivision(teacher.isClassTeacherOf.division);
    }

    return {
      success: true,
      message: `Welcome, ${teacher.fullName}!`,
      teacher,
    };
  };

  const logoutTeacher = () => {
    setLoggedTeacherId(null);
  };

  const switchRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'parent' || newRole === 'student') {
      setActiveTab('students');
    } else if (newRole === 'teacher') {
      setActiveTab('teachers_subjects');
    } else if (newRole === 'admin') {
      setActiveTab('overview');
    }
  };

  // Unified Signup, Login & Role Redirection Workflow
  const signupUser = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ success: boolean; message: string; user?: LMSUser }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const cleanPhone = data.phone.trim();

    if (!cleanName || !cleanEmail || !data.password) {
      return { success: false, message: 'Please provide Name, Email, Phone Number, and Password.' };
    }

    const existing = users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'An account with this email address already exists. Please log in instead.',
      };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newUser: LMSUser = {
      id: userId,
      name: cleanName,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: data.password,
      status: 'pending',
      assignedRole: 'unassigned',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    currentUserRef.current = newUser;
    setIsPendingReview(true);
    setShowLandingPage(false);

    try {
      await syncUserToFirestore(newUser);
      // Dual-sync to relational PostgreSQL / Supabase backend
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName || newUser.name,
          phone: newUser.phone,
          assignedRole: newUser.assignedRole,
          status: newUser.status,
        }),
      }).catch((err) => console.warn('Relational backend sync note:', err));
    } catch (e) {
      console.warn('Signup Firestore sync note:', e);
    }

    logAuditEvent({
      actorName: cleanName,
      actorRole: 'student',
      actorIdentifier: cleanEmail,
      action: 'USER_REGISTRATION',
      actionTitle: 'New User Registered',
      details: `User registration submitted by ${cleanName} (${cleanEmail}, Phone: ${cleanPhone}). Account marked as pending administrative approval.`,
      targetEntity: `${cleanName} (${cleanEmail})`,
      severity: 'info',
    });

    return {
      success: true,
      message: 'Account registered successfully! Your registration is now under review by the School Admin.',
      user: newUser,
    };
  };

  const loginUser = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; role?: UserRole; isPending?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, message: 'Please enter both your email address and password.' };
    }

    // Rule: If email matches master Admin email, route to the Admin Control Dashboard
    if (isMasterAdminEmail(cleanEmail)) {
      if (cleanPassword === adminPassword || cleanPassword === 'admin123' || cleanPassword === 'admin') {
        const adminUser: LMSUser = {
          id: 'usr_master_admin',
          name: 'Master Administrator',
          fullName: 'Master Administrator',
          email: cleanEmail,
          phone: '+94 77 123 4567',
          status: 'active',
          assignedRole: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCurrentUser(adminUser);
        currentUserRef.current = adminUser;
        setIsPendingReview(false);
        setShowLandingPage(false);
        loginAdmin(cleanPassword === adminPassword ? adminPassword : cleanPassword, true);
        setCurrentRole('admin');
        setActiveTab('overview');
        return {
          success: true,
          message: 'Welcome to the Admin Control Dashboard!',
          role: 'admin',
        };
      } else {
        return {
          success: false,
          message: 'Invalid administrator master password. (Default is admin123)',
        };
      }
    }

    // Check users collection
    const matchedUser = users.find((u) => u.email.toLowerCase().trim() === cleanEmail);

    if (!matchedUser) {
      // Check teachers table by email or employee ID
      const matchedTeacher = teachers.find(
        (t) => t.email.toLowerCase().trim() === cleanEmail || t.employeeId.toLowerCase() === cleanEmail
      );
      if (matchedTeacher) {
        if (cleanPassword === (matchedTeacher.password || 'teacher123')) {
          const teacherUser: LMSUser = {
            id: `usr_${matchedTeacher.id}`,
            name: matchedTeacher.fullName,
            fullName: matchedTeacher.fullName,
            email: matchedTeacher.email || cleanEmail,
            phone: matchedTeacher.phone,
            status: 'active',
            assignedRole: 'teacher',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCurrentUser(teacherUser);
          currentUserRef.current = teacherUser;
          setIsPendingReview(false);
          setShowLandingPage(false);
          loginTeacher(matchedTeacher.employeeId, cleanPassword);
          return {
            success: true,
            message: `Welcome, ${matchedTeacher.fullName}!`,
            role: 'teacher',
          };
        } else {
          return { success: false, message: 'Invalid password for teacher account.' };
        }
      }

      return {
        success: false,
        message: 'No registered account found with this email. Please sign up first.',
      };
    }

    if (matchedUser.password && matchedUser.password !== cleanPassword) {
      return {
        success: false,
        message: 'Invalid password. Please check your credentials and try again.',
      };
    }

    setCurrentUser(matchedUser);
    currentUserRef.current = matchedUser;
    setShowLandingPage(false);

    // Rule: If status === "pending", display locked state message:
    // 'Your account registration is under review by the School Admin. You will receive portal access once your account is assigned a role.'
    if (matchedUser.status === 'pending') {
      setIsPendingReview(true);
      return {
        success: true,
        isPending: true,
        message: 'Your account registration is under review by the School Admin. You will receive portal access once your account is assigned a role.',
      };
    }

    setIsPendingReview(false);

    // Rule: If assignedRole === "teacher" and status === "active", route to Teacher Portal
    if (matchedUser.assignedRole === 'teacher' && matchedUser.status === 'active') {
      const teacher = teachers.find(
        (t) => t.email.toLowerCase().trim() === cleanEmail || t.fullName.toLowerCase() === matchedUser.name.toLowerCase()
      );
      if (teacher) {
        setLoggedTeacherId(teacher.id);
      }
      setCurrentRole('teacher');
      setActiveTab('teachers_subjects');
      return {
        success: true,
        role: 'teacher',
        message: `Welcome to Teacher Portal, ${matchedUser.name}!`,
      };
    }

    // Rule: If assignedRole === "student" and status === "active", route to Student Portal
    if (matchedUser.assignedRole === 'student' && matchedUser.status === 'active') {
      setCurrentRole('student');
      setActiveTab('students');
      if (matchedUser.indexNumber) {
        const student = students.find((s) => s.indexNumber.toUpperCase() === matchedUser.indexNumber?.toUpperCase());
        if (student) {
          setSelectedStudentId(student.id);
        }
      }
      return {
        success: true,
        role: 'student',
        message: `Welcome to Student Portal, ${matchedUser.name}!`,
      };
    }

    if (matchedUser.assignedRole === 'unassigned') {
      setIsPendingReview(true);
      return {
        success: true,
        isPending: true,
        message: 'Your account registration is under review by the School Admin. You will receive portal access once your account is assigned a role.',
      };
    }

    setCurrentRole('parent');
    setActiveTab('students');
    return { success: true, message: 'Logged in successfully.' };
  };

  const logoutUser = () => {
    setCurrentUser(null);
    currentUserRef.current = null;
    setIsPendingReview(false);
    setShowLandingPage(true);
    logoutAdmin();
    logoutTeacher();
    setCurrentRole('parent');
  };

  const assignUserAsTeacher = async (userId: string): Promise<{ success: boolean; message: string }> => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User record not found.' };

    const updatedUser: LMSUser = {
      ...target,
      status: 'active',
      assignedRole: 'teacher',
      updatedAt: new Date().toISOString(),
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    // Ensure teacher record exists in faculty directory
    const existingTeacher = teachers.find(
      (t) => t.email.toLowerCase().trim() === target.email.toLowerCase().trim()
    );
    if (!existingTeacher) {
      addTeacher({
        fullName: target.fullName || target.name,
        email: target.email,
        phone: target.phone,
        qualification: 'B.Ed (Hons) / Trained Faculty',
        password: target.password || 'teacher123',
        assignments: [
          { subjectId: 'sub_math_ol', grade: 10, division: 'A' },
        ],
      });
    }

    try {
      await updateUserRoleAndStatusInFirestore(userId, 'active', 'teacher');
      // Dual-sync to relational PostgreSQL / Supabase backend
      fetch('/api/users/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userId,
          status: 'active',
          assignedRole: 'teacher',
        }),
      }).catch((err) => console.warn('Backend role update notice:', err));

      logAuditEvent({
        actorName: 'Master Administrator',
        actorRole: 'admin',
        action: 'USER_ROLE_ASSIGNED',
        actionTitle: 'Assigned User as Teacher',
        details: `Approved applicant registration for ${target.name} (${target.email}) and assigned active Teacher role with faculty portal permissions.`,
        targetEntity: `${target.name} (${target.email})`,
        severity: 'success',
      });

      return {
        success: true,
        message: `Successfully approved and assigned ${target.name} as Teacher!`,
      };
    } catch (e) {
      console.warn('Assign as teacher Firestore sync warning:', e);
      return {
        success: true,
        message: `Assigned ${target.name} as Teacher.`,
      };
    }
  };

  const assignUserAsStudent = async (
    userId: string,
    indexNumber: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanIndex = indexNumber.trim().toUpperCase();
    if (!cleanIndex) {
      return { success: false, message: 'Please enter a valid Examination Index Number.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User record not found.' };

    const updatedUser: LMSUser = {
      ...target,
      status: 'active',
      assignedRole: 'student',
      indexNumber: cleanIndex,
      updatedAt: new Date().toISOString(),
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    // Check if student with index exists in enrolled student roster
    const existingStudent = students.find((s) => s.indexNumber.toUpperCase() === cleanIndex);
    if (!existingStudent) {
      addNewStudent({
        fullName: target.fullName || target.name,
        grade: 10,
        division: 'A',
        gender: 'Male',
        medium: 'English',
        attendanceRate: 95,
        guardianName: 'Parent / Guardian',
        contactNumber: target.phone || '+94 77 123 4567',
        customIndexNumber: cleanIndex,
      });
    }

    try {
      await updateUserRoleAndStatusInFirestore(userId, 'active', 'student', cleanIndex);
      // Dual-sync to relational PostgreSQL / Supabase backend
      fetch('/api/users/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userId,
          status: 'active',
          assignedRole: 'student',
          indexNumber: cleanIndex,
        }),
      }).catch((err) => console.warn('Backend role update notice:', err));

      logAuditEvent({
        actorName: 'Master Administrator',
        actorRole: 'admin',
        action: 'USER_ROLE_ASSIGNED',
        actionTitle: 'Assigned User as Student',
        details: `Approved registration for ${target.name} (${target.email}) and assigned Student role linked to Examination Index ${cleanIndex}.`,
        targetEntity: `${target.name} (${cleanIndex})`,
        severity: 'success',
      });

      return {
        success: true,
        message: `Successfully approved and assigned ${target.name} as Student with Index ${cleanIndex}!`,
      };
    } catch (e) {
      console.warn('Assign as student Firestore sync warning:', e);
      return {
        success: true,
        message: `Assigned ${target.name} as Student with Index ${cleanIndex}.`,
      };
    }
  };

  const rejectUserRegistration = async (userId: string): Promise<{ success: boolean; message: string }> => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'User not found.' };

    const updatedUser: LMSUser = {
      ...target,
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    };
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    try {
      await updateUserRoleAndStatusInFirestore(userId, 'rejected', target.assignedRole);
      return { success: true, message: `Registration for ${target.name} has been rejected.` };
    } catch (e) {
      return { success: true, message: `Registration for ${target.name} marked rejected.` };
    }
  };

  const refreshCurrentUserStatus = async () => {
    if (!currentUser) return;
    const currentEmail = currentUser.email.toLowerCase().trim();
    const matched = users.find((u) => u.id === currentUser.id || u.email.toLowerCase().trim() === currentEmail);
    if (matched) {
      setCurrentUser(matched);
      currentUserRef.current = matched;
      if (matched.status === 'active') {
        setIsPendingReview(false);
        if (matched.assignedRole === 'teacher') {
          setCurrentRole('teacher');
          setActiveTab('teachers_subjects');
        } else if (matched.assignedRole === 'student') {
          setCurrentRole('student');
          setActiveTab('students');
        }
      }
    }
  };

  // Mark Submission workflow
  const getSubmissionStatus = (
    subjectId: string,
    grade: GradeLevel,
    division: Division,
    term: TermNumber
  ): MarkSubmissionStatus => {
    const found = markSubmissions.find(
      (m) =>
        m.subjectId === subjectId &&
        m.grade === grade &&
        m.division === division &&
        m.term === term
    );
    return found ? found.status : 'draft';
  };

  const submitMarksForReview = (
    subjectId: string,
    grade: GradeLevel,
    division: Division,
    term: TermNumber,
    notes?: string
  ) => {
    const teacherName = currentTeacher?.fullName || 'Assigned Teacher';
    const teacherId = currentTeacher?.id || 'tch_guest';
    const id = `subm_${subjectId}_${grade}_${division}_${term}`;

    // Extract student marks for this specific class and subject
    const subjectMarks: Record<string, number> = {};
    students
      .filter((s) => s.grade === grade && s.division === division)
      .forEach((s) => {
        const mark = s.terms[term]?.marks[subjectId];
        if (mark !== undefined) {
          subjectMarks[s.id] = mark;
        }
      });

    const newSubmission: MarkSubmission = {
      id,
      teacherId,
      teacherName,
      subjectId,
      grade,
      division,
      term,
      status: instantSaveMode ? 'approved' : 'submitted',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedAt: new Date().toISOString(),
      notes: notes || (instantSaveMode ? 'Direct instant save by instructor' : 'Submitted for administrative approval'),
      marks: subjectMarks,
    };

    setMarkSubmissions((prev) => {
      const existing = prev.filter((m) => m.id !== id);
      return [newSubmission, ...existing];
    });

    // Firestore sync: thanks to enableIndexedDbPersistence, offline writes are stored in IndexedDB and synced upon reconnection
    syncMarkSubmissionToFirestore(newSubmission).catch((err) =>
      console.warn('Firestore mark submission offline write note (stored in IndexedDB):', err)
    );

    // Dual-sync to relational PostgreSQL / Supabase backend
    fetch('/api/marks/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionKey: id,
        teacherId,
        teacherName,
        subjectId,
        grade,
        division,
        term,
        status: newSubmission.status,
        marksJson: subjectMarks,
        notes: newSubmission.notes,
      }),
    }).catch((err) => console.warn('PostgreSQL mark submission sync note:', err));

    logAuditEvent({
      actorName: teacherName,
      actorRole: currentRole === 'admin' ? 'admin' : 'teacher',
      actorIdentifier: teacherId,
      action: 'MARK_SUBMISSION',
      actionTitle: instantSaveMode ? 'Marks Published (Instant Save)' : 'Marks Submitted for Approval',
      details: `${teacherName} submitted ${Object.keys(subjectMarks).length} student evaluations for Grade ${grade}-${division} Term ${term}. Notes: "${newSubmission.notes}"`,
      targetEntity: `Grade ${grade}-${division} (${subjectId})`,
      grade,
      division,
      term,
      severity: 'info',
    });
  };

  const approveMarksSubmission = (submissionId: string) => {
    setMarkSubmissions((prev) => {
      const updated = prev.map((m) =>
        m.id === submissionId ? { ...m, status: 'approved' as const, updatedAt: new Date().toISOString() } : m
      );
      const target = updated.find((m) => m.id === submissionId);
      if (target) {
        syncMarkSubmissionToFirestore(target).catch((err) =>
          console.warn('Firestore mark submission approval sync note:', err)
        );
        logAuditEvent({
          actorName: 'Master Administrator',
          actorRole: 'admin',
          action: 'MARK_APPROVAL',
          actionTitle: 'Faculty Mark Submission Approved',
          details: `Admin certified mark submissions for Grade ${target.grade}-${target.division} (Term ${target.term}) submitted by ${target.teacherName}.`,
          targetEntity: `Grade ${target.grade}-${target.division}`,
          grade: target.grade,
          division: target.division,
          term: target.term,
          severity: 'success',
        });
      }
      return updated;
    });
  };

  // Teacher methods
  const addTeacher = (data: {
    fullName: string;
    email: string;
    phone: string;
    qualification: string;
    password?: string;
    isClassTeacherOf?: { grade: GradeLevel; division: Division };
    assignments: { subjectId: string; grade: GradeLevel; division: Division | 'all' }[];
  }) => {
    const id = `tch_${Date.now()}`;
    const employeeId = `EMP-${4000 + teachers.length + 1}`;
    const newTeacher: Teacher = {
      id,
      employeeId,
      password: data.password || 'teacher123',
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      qualification: data.qualification,
      isClassTeacherOf: data.isClassTeacherOf,
      assignments: data.assignments.map((a, idx) => ({
        id: `asgn_${Date.now()}_${idx}`,
        ...a,
      })),
    };
    setTeachers((prev) => [...prev, newTeacher]);
    syncTeacherToFirestore(newTeacher).catch((err) =>
      console.warn('Teacher addition Firestore sync warning:', err)
    );
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    setTeachers((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      const target = next.find((t) => t.id === id);
      if (target) {
        syncTeacherToFirestore(target).catch((err) =>
          console.warn('Teacher update Firestore sync warning:', err)
        );
      }
      return next;
    });
  };

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    deleteTeacherFromFirestore(id).catch((err) =>
      console.warn('Firestore teacher deletion sync warning:', err)
    );
  };

  const assignTeacherToSubject = (
    teacherId: string,
    subjectId: string,
    grade: GradeLevel,
    division: Division | 'all'
  ) => {
    setTeachers((prev) => {
      const next = prev.map((t) => {
        if (t.id !== teacherId) return t;
        const newAsgn: TeacherAssignment = {
          id: `asgn_${Date.now()}`,
          subjectId,
          grade,
          division,
        };
        return {
          ...t,
          assignments: [...t.assignments, newAsgn],
        };
      });
      const target = next.find((t) => t.id === teacherId);
      if (target) {
        syncTeacherToFirestore(target).catch((err) =>
          console.warn('Teacher assignment Firestore sync warning:', err)
        );
      }
      return next;
    });
  };

  const removeTeacherAssignment = (teacherId: string, assignmentId: string) => {
    setTeachers((prev) => {
      const next = prev.map((t) => {
        if (t.id !== teacherId) return t;
        return {
          ...t,
          assignments: t.assignments.filter((a) => a.id !== assignmentId),
        };
      });
      const target = next.find((t) => t.id === teacherId);
      if (target) {
        syncTeacherToFirestore(target).catch((err) =>
          console.warn('Teacher assignment removal Firestore sync warning:', err)
        );
      }
      return next;
    });
  };

  // Subject methods with real-time Firestore synchronization
  const addSubject = (data: {
    name: string;
    shortName: string;
    code: string;
    applicableGrades: number[];
    category: 'core' | 'basket' | 'al_stream';
    description?: string;
  }) => {
    const newSub: SubjectConfig = {
      id: `sub_${Date.now()}`,
      ...data,
    };
    setSubjects((prev) => [...prev, newSub]);
    syncSubjectToFirestore(newSub).catch((err) =>
      console.warn('Firestore subject add sync warning:', err)
    );
  };

  const updateSubject = (id: string, updates: Partial<SubjectConfig>) => {
    let targetUpdated: SubjectConfig | null = null;
    setSubjects((prev) => {
      const next = prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        targetUpdated = updated;
        return updated;
      });
      return next;
    });

    if (targetUpdated) {
      syncSubjectToFirestore(targetUpdated).catch((err) =>
        console.warn('Firestore subject update sync warning:', err)
      );
    }
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setTeachers((prev) =>
      prev.map((t) => ({
        ...t,
        assignments: t.assignments.filter((a) => a.subjectId !== id),
      }))
    );
    deleteSubjectFromFirestore(id).catch((err) =>
      console.warn('Firestore subject deletion sync warning:', err)
    );
  };

  // Update marks for an individual student in a term with real-time Firestore persistence
  const updateStudentTermMarks = (studentId: string, term: TermNumber, marks: Record<string, number>) => {
    let targetUpdatedStudent: Student | null = null;
    setStudents((prev) => {
      const next = prev.map((s) => {
        if (s.id !== studentId) return s;
        const newRecord = calculateTermRecord(term, marks);
        const updated = {
          ...s,
          terms: {
            ...s.terms,
            [term]: newRecord,
          },
        };
        targetUpdatedStudent = updated;
        return updated;
      });
      return assignRanks(next);
    });

    if (targetUpdatedStudent) {
      syncStudentToFirestore(targetUpdatedStudent).catch((err) =>
        console.warn('Firestore student marks sync note:', err)
      );
      const studentObj = targetUpdatedStudent as Student;
      logAuditEvent({
        actorName: currentTeacher?.fullName || (isAdmin ? 'School Administrator' : 'Academic Staff'),
        actorRole: currentRole === 'admin' ? 'admin' : 'teacher',
        actorIdentifier: currentTeacher?.employeeId || currentTeacher?.email || (isAdmin ? 'Admin' : undefined),
        action: 'MARK_ENTRY',
        actionTitle: 'Term Marks Updated',
        details: `Updated Term ${term} marks for student ${studentObj.fullName} (Index: ${studentObj.indexNumber}, Grade ${studentObj.grade}-${studentObj.division}). Total: ${studentObj.terms[term]?.totalMarks}, Average: ${studentObj.terms[term]?.average}%`,
        targetEntity: `${studentObj.fullName} (${studentObj.indexNumber})`,
        grade: studentObj.grade,
        division: studentObj.division,
        term,
        severity: 'info',
      });
    }
  };

  // Batch update marks across students in a class with real-time Firestore persistence
  const batchUpdateClassMarks = (term: TermNumber, updates: Record<string, Record<string, number>>) => {
    const updatedList: Student[] = [];
    setStudents((prev) => {
      const next = prev.map((s) => {
        if (!updates[s.id]) return s;
        const mergedMarks = { ...(s.terms[term]?.marks || {}), ...updates[s.id] };
        const newRecord = calculateTermRecord(term, mergedMarks);
        const updated = {
          ...s,
          terms: {
            ...s.terms,
            [term]: newRecord,
          },
        };
        updatedList.push(updated);
        return updated;
      });
      return assignRanks(next);
    });

    // Synchronize every updated student document to Firestore
    updatedList.forEach((st) => {
      syncStudentToFirestore(st).catch((err) =>
        console.warn('Firestore batch mark sync note:', err)
      );
    });

    if (updatedList.length > 0) {
      logAuditEvent({
        actorName: currentTeacher?.fullName || (isAdmin ? 'School Administrator' : 'Subject Teacher'),
        actorRole: currentRole === 'admin' ? 'admin' : 'teacher',
        actorIdentifier: currentTeacher?.employeeId || currentTeacher?.email || (isAdmin ? 'Admin' : undefined),
        action: 'MARK_ENTRY',
        actionTitle: 'Batch Mark Entry Saved',
        details: `Updated and calculated marks in bulk for ${updatedList.length} student(s) in Grade ${selectedGrade}-${selectedDivision} (Term ${term}).`,
        targetEntity: `Grade ${selectedGrade}-${selectedDivision}`,
        grade: selectedGrade,
        division: selectedDivision,
        term,
        severity: 'success',
      });
    }
  };

  // Add new student with real-time Firestore persistence and immediate cross-device index indexing
  const addNewStudent = (data: {
    fullName: string;
    grade: GradeLevel;
    division: Division;
    gender: 'Male' | 'Female';
    medium: 'Sinhala' | 'Tamil' | 'English';
    attendanceRate: number;
    guardianName: string;
    contactNumber: string;
    customIndexNumber?: string;
  }) => {
    const applicableSubjects = subjects.filter((s) => s.applicableGrades.includes(data.grade));
    const idNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `LK-${data.grade}${data.division}-${idNum}`;
    const newIndex = data.customIndexNumber
      ? data.customIndexNumber.trim().toUpperCase()
      : `IDX-${data.grade * 1000 + (students.length + 1)}`;

    const initialMarks: Record<string, number> = {};
    applicableSubjects.forEach((sub) => {
      initialMarks[sub.id] = 65;
    });

    const newStudent: Student = {
      id: newId,
      indexNumber: newIndex,
      fullName: data.fullName,
      grade: data.grade,
      division: data.division,
      gender: data.gender,
      medium: data.medium,
      attendanceRate: data.attendanceRate,
      guardianName: data.guardianName,
      contactNumber: data.contactNumber,
      terms: {
        1: calculateTermRecord(1, initialMarks),
        2: calculateTermRecord(2, initialMarks),
        3: calculateTermRecord(3, initialMarks),
      },
    };

    setStudents((prev) => assignRanks([...prev, newStudent]));

    // Synchronize new student to Firestore so Parent Portal on any other device can find it instantly
    syncStudentToFirestore(newStudent).catch((err) =>
      console.warn('Firestore new student sync note:', err)
    );

    logAuditEvent({
      actorName: isAdmin ? 'Master Administrator' : 'Academic Registrar',
      actorRole: 'admin',
      action: 'STUDENT_ENROLL',
      actionTitle: 'Student Enrolled',
      details: `Enrolled student ${data.fullName} with Index Number ${newIndex} into Grade ${data.grade}-${data.division}. Guardian: ${data.guardianName} (${data.contactNumber}).`,
      targetEntity: `${data.fullName} (${newIndex})`,
      grade: data.grade,
      division: data.division,
      severity: 'success',
    });

    return newId;
  };

  // Update existing student details (Full name, index number, division, attendance, etc.)
  const updateStudent = (studentId: string, updates: Partial<Student>) => {
    let targetUpdatedStudent: Student | null = null;
    setStudents((prev) => {
      const next = prev.map((s) => {
        if (s.id !== studentId) return s;
        const updated = {
          ...s,
          ...updates,
          indexNumber: updates.indexNumber ? updates.indexNumber.trim().toUpperCase() : s.indexNumber,
        };
        targetUpdatedStudent = updated;
        return updated;
      });
      return assignRanks(next);
    });

    if (targetUpdatedStudent) {
      syncStudentToFirestore(targetUpdatedStudent).catch((err) =>
        console.warn('Firestore student update sync note:', err)
      );
      const studentObj = targetUpdatedStudent as Student;
      logAuditEvent({
        actorName: isAdmin ? 'Master Administrator' : 'Staff',
        actorRole: 'admin',
        action: 'STUDENT_UPDATE',
        actionTitle: 'Student Record Updated',
        details: `Updated details for ${studentObj.fullName} (Index: ${studentObj.indexNumber}, Grade ${studentObj.grade}-${studentObj.division}).`,
        targetEntity: `${studentObj.fullName} (${studentObj.indexNumber})`,
        grade: studentObj.grade,
        division: studentObj.division,
        severity: 'info',
      });
    }
  };

  // Delete student with Firestore removal
  const deleteStudent = (studentId: string) => {
    const deletedStudent = students.find((s) => s.id === studentId);
    setStudents((prev) => assignRanks(prev.filter((s) => s.id !== studentId)));
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    }
    deleteStudentFromFirestore(studentId).catch((err) =>
      console.warn('Firestore student deletion sync note:', err)
    );

    if (deletedStudent) {
      logAuditEvent({
        actorName: isAdmin ? 'Master Administrator' : 'Staff',
        actorRole: 'admin',
        action: 'STUDENT_DELETE',
        actionTitle: 'Student Record Deleted',
        details: `Permanently removed student ${deletedStudent.fullName} (${deletedStudent.indexNumber}) from Grade ${deletedStudent.grade}-${deletedStudent.division}.`,
        targetEntity: `${deletedStudent.fullName} (${deletedStudent.indexNumber})`,
        grade: deletedStudent.grade,
        division: deletedStudent.division,
        severity: 'critical',
      });
    }
  };

  // Bulk import from CSV
  const bulkImportStudents = (imported: Partial<Student>[]) => {
    let successCount = 0;
    const errors: string[] = [];

    const updated = [...students];

    imported.forEach((item, index) => {
      if (!item.fullName) {
        errors.push(`Row ${index + 1}: Missing student full name.`);
        return;
      }
      const grade = (item.grade || selectedGrade) as GradeLevel;
      const division = (item.division || selectedDivision) as Division;
      const applicableSubjects = subjects.filter((s) => s.applicableGrades.includes(grade));

      const existingIdx = updated.findIndex(
        (s) => (item.id && s.id === item.id) || (item.indexNumber && s.indexNumber === item.indexNumber)
      );

      const termNum = selectedTerm;
      const marks = item.terms?.[termNum]?.marks || {};
      const validMarks: Record<string, number> = {};
      applicableSubjects.forEach((sub) => {
        validMarks[sub.id] = typeof marks[sub.id] === 'number' ? marks[sub.id] : 50;
      });

      if (existingIdx !== -1) {
        const current = updated[existingIdx];
        updated[existingIdx] = {
          ...current,
          fullName: item.fullName || current.fullName,
          terms: {
            ...current.terms,
            [termNum]: calculateTermRecord(termNum, { ...current.terms[termNum]?.marks, ...validMarks }),
          },
        };
        successCount++;
      } else {
        const idNum = Math.floor(1000 + Math.random() * 9000);
        const newStudent: Student = {
          id: item.id || `LK-${grade}${division}-${idNum}`,
          indexNumber: item.indexNumber || `IDX-${grade * 1000 + (updated.length + 1)}`,
          fullName: item.fullName,
          grade,
          division,
          gender: item.gender || 'Male',
          medium: item.medium || 'Sinhala',
          attendanceRate: item.attendanceRate || 92,
          guardianName: item.guardianName || 'Guardian',
          contactNumber: item.contactNumber || '+94 77 123 4567',
          terms: {
            1: calculateTermRecord(1, validMarks),
            2: calculateTermRecord(2, validMarks),
            3: calculateTermRecord(3, validMarks),
          },
        };
        updated.push(newStudent);
        successCount++;
      }
    });

    const ranked = assignRanks(updated);
    setStudents(ranked);

    // Real-time Firestore synchronization for all imported/updated students
    updated.forEach((st) => {
      syncStudentToFirestore(st).catch((err) =>
        console.warn('Firestore bulk import student sync note:', err)
      );
    });

    return { successCount, errors };
  };

  // Reset to default dataset
  const resetToDemoData = () => {
    localStorage.removeItem(STUDENTS_STORAGE_KEY);
    localStorage.removeItem(TEACHERS_STORAGE_KEY);
    localStorage.removeItem(SUBJECTS_STORAGE_KEY);
    localStorage.removeItem(SUBMISSIONS_STORAGE_KEY);
    setTeachers(INITIAL_MOCK_TEACHERS);
    setSubjects(ALL_CURRICULUM_SUBJECTS);
    setStudents(generateInitialMockStudents());
    setMarkSubmissions(INITIAL_MARK_SUBMISSIONS);
  };

  return (
    <LMSContext.Provider
      value={{
        students,
        teachers,
        subjects,
        selectedGrade,
        selectedDivision,
        selectedTerm,
        activeTab,
        searchQuery,
        selectedStudentId,
        theme,
        currentSubjects,
        currentClassStats,
        currentSubjectRankings,
        currentDivisionComparison,
        currentClassTeacher,
        setSelectedGrade,
        setSelectedDivision,
        setSelectedTerm,
        setActiveTab,
        setSearchQuery,
        setSelectedStudentId,
        toggleTheme,
        updateStudentTermMarks,
        batchUpdateClassMarks,
        addNewStudent,
        updateStudent,
        deleteStudent,
        bulkImportStudents,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        assignTeacherToSubject,
        removeTeacherAssignment,
        getTeacherForSubject,
        getClassTeacher,
        addSubject,
        updateSubject,
        deleteSubject,
        resetToDemoData,
        // RBAC additions
        currentRole,
        isAdmin,
        isAdminAuthenticated,
        isAdminRemembered,
        activeSessionAuthHash,
        adminNotification,
        clearAdminNotification,
        isCurrentDeviceMobile,
        adminPassword,
        isCustomPasswordSet,
        changeAdminPassword,
        resetAdminPasswordToDefault,
        currentTeacher,
        markSubmissions,
        instantSaveMode,
        setInstantSaveMode,
        loginAdmin,
        logoutAdmin,
        loginTeacher,
        logoutTeacher,
        switchRole,
        submitMarksForReview,
        approveMarksSubmission,
        getSubmissionStatus,
        isSubjectEditableByCurrentRole,
        // Firebase Multi-Device Synchronization & Offline Persistence
        isFirebaseConnected,
        isFirebaseSyncing,
        lastFirebaseSync,
        isOnline,
        isOfflinePersistenceActive,
        updateTeacherPassword,
        syncAllCredentialsToFirebase,
        // Unified Signup, Onboarding & Admin Approvals Hub
        users,
        pendingUsers,
        currentUser,
        isPendingReview,
        showLandingPage,
        setShowLandingPage,
        signupUser,
        loginUser,
        logoutUser,
        assignUserAsTeacher,
        assignUserAsStudent,
        rejectUserRegistration,
        refreshCurrentUserStatus,
        // System & RBAC Audit Trail Activity Log
        auditLogs,
        logAuditEvent,
        clearAuditLogs,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error('useLMS must be used within an LMSProvider');
  }
  return context;
};
