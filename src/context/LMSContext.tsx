import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
} from '../types/lms';
import { generateInitialMockStudents } from '../data/mockData';
import { INITIAL_MOCK_TEACHERS } from '../data/mockTeachers';
import {
  ALL_CURRICULUM_SUBJECTS,
  calculateTermRecord,
  assignRanks,
  calculateClassStatistics,
  calculateSubjectRankings,
} from '../utils/grading';

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
  activeTab: 'overview' | 'analytics' | 'students' | 'batch_entry' | 'teachers_subjects' | 'data_management' | 'settings';
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
  setSelectedGrade: (grade: GradeLevel) => void;
  setSelectedDivision: (division: Division) => void;
  setSelectedTerm: (term: TermNumber) => void;
  setActiveTab: (tab: 'overview' | 'analytics' | 'students' | 'batch_entry' | 'teachers_subjects' | 'data_management' | 'settings') => void;
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
  isAdminAuthenticated: boolean;
  adminPassword: string;
  isCustomPasswordSet: boolean;
  changeAdminPassword: (currentPassword: string, newPassword: string) => { success: boolean; message: string };
  resetAdminPasswordToDefault: () => void;
  currentTeacher: Teacher | null;
  markSubmissions: MarkSubmission[];
  instantSaveMode: boolean;
  setInstantSaveMode: (mode: boolean) => void;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  loginTeacher: (employeeId: string, password: string) => { success: boolean; message: string; teacher?: Teacher };
  logoutTeacher: () => void;
  switchRole: (role: UserRole) => void;
  submitMarksForReview: (subjectId: string, grade: GradeLevel, division: Division, term: TermNumber, notes?: string) => void;
  approveMarksSubmission: (submissionId: string) => void;
  getSubmissionStatus: (subjectId: string, grade: GradeLevel, division: Division, term: TermNumber) => MarkSubmissionStatus;
  isSubjectEditableByCurrentRole: (subjectId: string, grade: GradeLevel, division: Division) => boolean;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

const STUDENTS_STORAGE_KEY = 'lankaedu_lms_records_v1';
const TEACHERS_STORAGE_KEY = 'lankaedu_teachers_v1';
const SUBJECTS_STORAGE_KEY = 'lankaedu_subjects_v1';
const SUBMISSIONS_STORAGE_KEY = 'lankaedu_mark_submissions_v1';
const ROLE_STORAGE_KEY = 'lankaedu_current_role_v1';
const ADMIN_AUTH_STORAGE_KEY = 'lankaedu_admin_auth_v1';
const LOGGED_TEACHER_STORAGE_KEY = 'lankaedu_logged_teacher_id_v1';
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

  // RBAC State
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    if (saved === 'admin' || saved === 'teacher' || saved === 'parent') {
      return saved;
    }
    return 'admin'; // default to admin for initial build convenience
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    return saved === 'true';
  });

  // Dynamic Master Administrator Password (persisted in localStorage)
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || 'admin123';
  });

  const isCustomPasswordSet = adminPassword !== 'admin123';

  useEffect(() => {
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, adminPassword);
  }, [adminPassword]);

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
    localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, isAdminAuthenticated ? 'true' : 'false');
  }, [isAdminAuthenticated]);

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
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'students' | 'batch_entry' | 'teachers_subjects' | 'data_management' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

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

  // Currently logged in teacher object
  const currentTeacher = useMemo(() => {
    if (!loggedTeacherId) return null;
    return teachers.find((t) => t.id === loggedTeacherId || t.employeeId === loggedTeacherId) || null;
  }, [teachers, loggedTeacherId]);

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
  const loginAdmin = (password: string): boolean => {
    if (password === adminPassword) {
      setIsAdminAuthenticated(true);
      setCurrentRole('admin');
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

    if (!newPassword || newPassword.trim().length < 5) {
      return {
        success: false,
        message: 'New password must be at least 5 characters long.',
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
    return {
      success: true,
      message: 'Administrator master password has been successfully updated and saved to localStorage (persists across device reboots and browser sessions).',
    };
  };

  const resetAdminPasswordToDefault = () => {
    setAdminPassword('admin123');
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, 'admin123');
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
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
    if (newRole === 'parent') {
      setActiveTab('students');
    } else if (newRole === 'teacher') {
      setActiveTab('teachers_subjects');
    } else if (newRole === 'admin') {
      setActiveTab('overview');
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

    setMarkSubmissions((prev) => {
      const existing = prev.filter((m) => m.id !== id);
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
        notes: notes || (instantSaveMode ? 'Direct instant save by instructor' : 'Submitted for administrative approval'),
      };
      return [newSubmission, ...existing];
    });
  };

  const approveMarksSubmission = (submissionId: string) => {
    setMarkSubmissions((prev) =>
      prev.map((m) => (m.id === submissionId ? { ...m, status: 'approved' } : m))
    );
  };

  // Teacher methods
  const addTeacher = (data: {
    fullName: string;
    email: string;
    phone: string;
    qualification: string;
    isClassTeacherOf?: { grade: GradeLevel; division: Division };
    assignments: { subjectId: string; grade: GradeLevel; division: Division | 'all' }[];
  }) => {
    const id = `tch_${Date.now()}`;
    const employeeId = `EMP-${4000 + teachers.length + 1}`;
    const newTeacher: Teacher = {
      id,
      employeeId,
      password: 'teacher123',
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
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  const assignTeacherToSubject = (
    teacherId: string,
    subjectId: string,
    grade: GradeLevel,
    division: Division | 'all'
  ) => {
    setTeachers((prev) =>
      prev.map((t) => {
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
      })
    );
  };

  const removeTeacherAssignment = (teacherId: string, assignmentId: string) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== teacherId) return t;
        return {
          ...t,
          assignments: t.assignments.filter((a) => a.id !== assignmentId),
        };
      })
    );
  };

  // Subject methods
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
  };

  const updateSubject = (id: string, updates: Partial<SubjectConfig>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setTeachers((prev) =>
      prev.map((t) => ({
        ...t,
        assignments: t.assignments.filter((a) => a.subjectId !== id),
      }))
    );
  };

  // Update marks for an individual student in a term
  const updateStudentTermMarks = (studentId: string, term: TermNumber, marks: Record<string, number>) => {
    setStudents((prev) => {
      const next = prev.map((s) => {
        if (s.id !== studentId) return s;
        const newRecord = calculateTermRecord(term, marks);
        return {
          ...s,
          terms: {
            ...s.terms,
            [term]: newRecord,
          },
        };
      });
      return assignRanks(next);
    });
  };

  // Batch update marks across students in a class
  const batchUpdateClassMarks = (term: TermNumber, updates: Record<string, Record<string, number>>) => {
    setStudents((prev) => {
      const next = prev.map((s) => {
        if (!updates[s.id]) return s;
        const mergedMarks = { ...(s.terms[term]?.marks || {}), ...updates[s.id] };
        const newRecord = calculateTermRecord(term, mergedMarks);
        return {
          ...s,
          terms: {
            ...s.terms,
            [term]: newRecord,
          },
        };
      });
      return assignRanks(next);
    });
  };

  // Add new student
  const addNewStudent = (data: {
    fullName: string;
    grade: GradeLevel;
    division: Division;
    gender: 'Male' | 'Female';
    medium: 'Sinhala' | 'Tamil' | 'English';
    attendanceRate: number;
    guardianName: string;
    contactNumber: string;
  }) => {
    const applicableSubjects = subjects.filter((s) => s.applicableGrades.includes(data.grade));
    const idNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `LK-${data.grade}${data.division}-${idNum}`;
    const newIndex = `IDX-${data.grade * 1000 + (students.length + 1)}`;

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
    return newId;
  };

  // Update existing student details (Full name, index number, division, attendance, etc.)
  const updateStudent = (studentId: string, updates: Partial<Student>) => {
    setStudents((prev) => {
      const next = prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          ...updates,
        };
      });
      return assignRanks(next);
    });
  };

  // Delete student
  const deleteStudent = (studentId: string) => {
    setStudents((prev) => assignRanks(prev.filter((s) => s.id !== studentId)));
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
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

    setStudents(assignRanks(updated));
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
        isAdminAuthenticated,
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
