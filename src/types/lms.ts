/**
 * Core LMS & Sri Lankan Curriculum Data Types
 */

export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type Division = 'A' | 'B' | 'C';
export type TermNumber = 1 | 2 | 3;
export type GradeLetter = 'A' | 'B' | 'C' | 'S' | 'W';

export interface GradeDefinition {
  letter: GradeLetter;
  label: string;
  min: number;
  max: number;
  color: string;
  badgeClass: string;
  description: string;
}

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export type UserStatus = 'pending' | 'active' | 'rejected';
export type AssignedRole = 'unassigned' | 'teacher' | 'student' | 'admin';

export interface LMSUser {
  id: string; // Document ID / user ID
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  password?: string;
  status: UserStatus;
  assignedRole: AssignedRole;
  indexNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export type MarkSubmissionStatus = 'draft' | 'submitted' | 'approved';

export interface MarkSubmission {
  id: string; // key e.g. "subm_math_10A_t1"
  teacherId: string;
  teacherName: string;
  subjectId: string;
  grade: GradeLevel;
  division: Division;
  term: TermNumber;
  status: MarkSubmissionStatus;
  submittedAt?: string;
  updatedAt?: string;
  notes?: string;
  marks?: Record<string, number>;
}

export interface TeacherAssignment {
  id: string;
  subjectId: string;
  grade: GradeLevel;
  division: Division | 'all';
}

export interface Teacher {
  id: string;
  employeeId: string;
  password?: string;
  fullName: string;
  email: string;
  phone: string;
  qualification: string;
  isClassTeacherOf?: {
    grade: GradeLevel;
    division: Division;
  };
  assignments: TeacherAssignment[];
}

export interface SubjectConfig {
  id: string;
  name: string;
  shortName: string;
  code: string;
  applicableGrades: number[];
  category: 'core' | 'basket' | 'al_stream';
  assignedTeacherId?: string;
  description?: string;
}

export interface SubjectScore {
  subjectId: string;
  subjectName: string;
  mark: number;
  grade: GradeLetter;
  gradeInfo: GradeDefinition;
}

export interface TermRecord {
  term: TermNumber;
  marks: Record<string, number>; // subjectId -> mark (0-100)
  totalMarks: number;
  average: number;
  percentage: number;
  gradeCounts: Record<GradeLetter, number>;
  rankInClass?: number;
  rankInGrade?: number;
  isAllAs: boolean; // e.g. 9 A's for O/L, or all A's for other grades
  hasFailedAny: boolean; // any 'W'
  passedAll: boolean; // all >= 'S'
  remarks?: string;
}

export interface Student {
  id: string; // Unique Student ID e.g. "LK-2026-1001"
  indexNumber: string; // Examination Index Number e.g. "IDX-849102"
  fullName: string;
  grade: GradeLevel;
  division: Division;
  gender: 'Male' | 'Female';
  medium: 'Sinhala' | 'Tamil' | 'English';
  attendanceRate: number; // Percentage, e.g. 94%
  guardianName: string;
  contactNumber: string;
  terms: {
    1: TermRecord;
    2: TermRecord;
    3: TermRecord;
  };
}

export interface ClassStatistics {
  grade: GradeLevel;
  division: Division;
  term: TermNumber;
  totalStudents: number;
  classAverage: number;
  highestAverage: number;
  lowestAverage: number;
  passRate: number; // % of students passing all subjects
  failureRate: number; // % of students with at least 1 W
  allAsCount: number; // Students achieving all A's (e.g., 9 As)
  allAsPercentage: number;
  gradeDistribution: Record<GradeLetter, number>;
  subjectAverages: Record<string, { subjectName: string; average: number; passRate: number; highest: number; lowest: number }>;
}

export interface SubjectRanking {
  subjectId: string;
  subjectName: string;
  average: number;
  passRate: number;
  aRate: number;
}

export type AuditActorRole = 'teacher' | 'parent' | 'student' | 'admin' | 'system';

export type AuditActionType =
  | 'MARK_ENTRY'
  | 'MARK_SUBMISSION'
  | 'MARK_APPROVAL'
  | 'STUDENT_SEARCH'
  | 'REPORT_PRINT'
  | 'ANALYTICS_VIEW'
  | 'STUDENT_ENROLL'
  | 'STUDENT_UPDATE'
  | 'STUDENT_DELETE'
  | 'TEACHER_ASSIGN'
  | 'TEACHER_PASSWORD_CHANGE'
  | 'USER_REGISTRATION'
  | 'USER_ROLE_ASSIGNED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'ADMIN_PASSWORD_CHANGE'
  | 'CSV_IMPORT';

export type AuditSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface AuditLogEntry {
  id: string; // Document ID e.g. "audit_1730000000000_abc"
  timestamp: string; // ISO 8601 string
  actorName: string; // e.g. "Mrs. Pushpa Kumarihamy", "Parent of IDX-10100", "Master Administrator"
  actorRole: AuditActorRole; // 'teacher' | 'parent' | 'student' | 'admin' | 'system'
  actorIdentifier?: string; // email, employeeId, or student index number
  action: AuditActionType;
  actionTitle: string; // Human readable short action title
  details: string; // Descriptive details of what occurred
  targetEntity?: string; // e.g. "Grade 10-A Mathematics", "IDX-10100 (Kavindu Perera)"
  grade?: GradeLevel;
  division?: Division;
  term?: TermNumber;
  severity: AuditSeverity;
  deviceInfo?: string; // Browser / Device info e.g. "Mobile Web (Chrome)", "Desktop (Firefox)"
}

