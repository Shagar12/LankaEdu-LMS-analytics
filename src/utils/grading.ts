import {
  GradeDefinition,
  GradeLetter,
  GradeLevel,
  Division,
  TermNumber,
  TermRecord,
  Student,
  SubjectConfig,
  ClassStatistics,
  SubjectRanking,
} from '../types/lms';

export const SRI_LANKAN_GRADE_RULES: Record<GradeLetter, GradeDefinition> = {
  A: {
    letter: 'A',
    label: 'Distinction',
    min: 75,
    max: 100,
    color: '#16a34a', // Emerald 600
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
    description: '75–100% · Outstanding mastery of curriculum competencies',
  },
  B: {
    letter: 'B',
    label: 'Very Good Pass',
    min: 65,
    max: 74,
    color: '#2563eb', // Blue 600
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
    description: '65–74% · High competency with consistent execution',
  },
  C: {
    letter: 'C',
    label: 'Credit Pass',
    min: 55,
    max: 64,
    color: '#0284c7', // Sky 600
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60',
    description: '55–64% · Commendable standard and subject understanding',
  },
  S: {
    letter: 'S',
    label: 'Ordinary Pass',
    min: 35,
    max: 54,
    color: '#d97706', // Amber 600
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
    description: '35–54% · Minimum required pass standard met',
  },
  W: {
    letter: 'W',
    label: 'Weak / Fail',
    min: 0,
    max: 34,
    color: '#dc2626', // Red 600
    badgeClass: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800/60',
    description: '0–34% · Below passing standard; academic intervention required',
  },
};

/**
 * Automate grade assignment for individual marks based on Sri Lankan rules:
 * A: 75–100, B: 65–74, C: 55–64, S: 35–54, W: 0–34
 */
export function getGradeFromMark(mark: number): GradeDefinition {
  const rounded = Math.round(Math.max(0, Math.min(100, isNaN(mark) ? 0 : mark)));
  if (rounded >= 75) return SRI_LANKAN_GRADE_RULES.A;
  if (rounded >= 65) return SRI_LANKAN_GRADE_RULES.B;
  if (rounded >= 55) return SRI_LANKAN_GRADE_RULES.C;
  if (rounded >= 35) return SRI_LANKAN_GRADE_RULES.S;
  return SRI_LANKAN_GRADE_RULES.W;
}

/**
 * Standard Sri Lankan Curriculum Subjects by Grade Level
 */
export const ALL_CURRICULUM_SUBJECTS: SubjectConfig[] = [
  // Primary (Grades 1-5)
  { id: 'sub_lang_pri', name: 'First Language (Sinhala/Tamil)', shortName: 'Language', code: 'LAN1', applicableGrades: [1, 2, 3, 4, 5], category: 'core' },
  { id: 'sub_eng_pri', name: 'English Language', shortName: 'English', code: 'ENG1', applicableGrades: [1, 2, 3, 4, 5], category: 'core' },
  { id: 'sub_math_pri', name: 'Mathematics', shortName: 'Maths', code: 'MAT1', applicableGrades: [1, 2, 3, 4, 5], category: 'core' },
  { id: 'sub_env_pri', name: 'Environmental Studies', shortName: 'Env Studies', code: 'ENV1', applicableGrades: [1, 2, 3, 4, 5], category: 'core' },
  { id: 'sub_rel_pri', name: 'Religion (Buddhism/Hinduism/Christianity/Islam)', shortName: 'Religion', code: 'REL1', applicableGrades: [1, 2, 3, 4, 5], category: 'core' },

  // Junior Secondary (Grades 6-9)
  { id: 'sub_lang_jnr', name: 'First Language (Sinhala/Tamil)', shortName: 'Language', code: 'LAN2', applicableGrades: [6, 7, 8, 9], category: 'core' },
  { id: 'sub_eng_jnr', name: 'English Language', shortName: 'English', code: 'ENG2', applicableGrades: [6, 7, 8, 9], category: 'core' },
  { id: 'sub_math_jnr', name: 'Mathematics', shortName: 'Maths', code: 'MAT2', applicableGrades: [6, 7, 8, 9], category: 'core' },
  { id: 'sub_sci_jnr', name: 'Science', shortName: 'Science', code: 'SCI2', applicableGrades: [6, 7, 8, 9], category: 'core' },
  { id: 'sub_hist_jnr', name: 'History', shortName: 'History', code: 'HIS2', applicableGrades: [6, 7, 8, 9], category: 'core' },
  { id: 'sub_rel_jnr', name: 'Religion', shortName: 'Religion', code: 'REL2', applicableGrades: [6, 7, 8, 9], category: 'core' },
  { id: 'sub_geo_jnr', name: 'Geography', shortName: 'Geography', code: 'GEO2', applicableGrades: [6, 7, 8, 9], category: 'core' },
  { id: 'sub_civ_jnr', name: 'Civic Education', shortName: 'Civics', code: 'CIV2', applicableGrades: [6, 7, 8, 9], category: 'core' },
  { id: 'sub_hpe_jnr', name: 'Health & Physical Education', shortName: 'Health & PE', code: 'HPE2', applicableGrades: [6, 7, 8, 9], category: 'core' },
  { id: 'sub_pts_jnr', name: 'Practical & Technical Skills', shortName: 'Tech Skills', code: 'PTS2', applicableGrades: [6, 7, 8, 9], category: 'basket' },

  // Senior Secondary / G.C.E. O/L (Grades 10-11 - The Standard 9 Subjects)
  { id: 'sub_lang_ol', name: 'First Language (Sinhala/Tamil)', shortName: 'Language', code: 'LAN3', applicableGrades: [10, 11], category: 'core' },
  { id: 'sub_eng_ol', name: 'English Language', shortName: 'English', code: 'ENG3', applicableGrades: [10, 11], category: 'core' },
  { id: 'sub_math_ol', name: 'Mathematics', shortName: 'Maths', code: 'MAT3', applicableGrades: [10, 11], category: 'core' },
  { id: 'sub_sci_ol', name: 'Science', shortName: 'Science', code: 'SCI3', applicableGrades: [10, 11], category: 'core' },
  { id: 'sub_hist_ol', name: 'History', shortName: 'History', code: 'HIS3', applicableGrades: [10, 11], category: 'core' },
  { id: 'sub_rel_ol', name: 'Religion', shortName: 'Religion', code: 'REL3', applicableGrades: [10, 11], category: 'core' },
  { id: 'sub_b1_ol', name: 'Commerce & Accounting / Geography', shortName: 'Commerce/Geo', code: 'BSK1', applicableGrades: [10, 11], category: 'basket' },
  { id: 'sub_b2_ol', name: 'Aesthetic Studies (Music/Art/Drama)', shortName: 'Aesthetics', code: 'BSK2', applicableGrades: [10, 11], category: 'basket' },
  { id: 'sub_b3_ol', name: 'ICT / Agriculture / Health Science', shortName: 'ICT/Agri', code: 'BSK3', applicableGrades: [10, 11], category: 'basket' },

  // Collegiate / G.C.E. A/L (Grades 12-13)
  { id: 'sub_al_1', name: 'Core Stream Subject 1 (Maths/Biology/Accounting)', shortName: 'Stream Sub 1', code: 'AL01', applicableGrades: [12, 13], category: 'al_stream' },
  { id: 'sub_al_2', name: 'Core Stream Subject 2 (Physics/Chemistry/Economics)', shortName: 'Stream Sub 2', code: 'AL02', applicableGrades: [12, 13], category: 'al_stream' },
  { id: 'sub_al_3', name: 'Core Stream Subject 3 (Chemistry/ICT/Business)', shortName: 'Stream Sub 3', code: 'AL03', applicableGrades: [12, 13], category: 'al_stream' },
  { id: 'sub_al_eng', name: 'General English', shortName: 'General English', code: 'GENG', applicableGrades: [12, 13], category: 'core' },
];

/**
 * Returns subjects applicable for a given grade level
 */
export function getSubjectsForGrade(grade: GradeLevel): SubjectConfig[] {
  return ALL_CURRICULUM_SUBJECTS.filter((sub) => sub.applicableGrades.includes(grade));
}

/**
 * Computes automated total, average, percentage, and A/B/C/S/W counts for a term record
 */
export function calculateTermRecord(term: TermNumber, marks: Record<string, number>): TermRecord {
  const markValues = Object.values(marks);
  const count = markValues.length;

  const totalMarks = markValues.reduce((sum, val) => sum + (isNaN(val) ? 0 : val), 0);
  const average = count > 0 ? Number((totalMarks / count).toFixed(1)) : 0;
  const percentage = average;

  const gradeCounts: Record<GradeLetter, number> = {
    A: 0,
    B: 0,
    C: 0,
    S: 0,
    W: 0,
  };

  let hasFailedAny = false;
  let passedAll = count > 0;

  markValues.forEach((val) => {
    const grade = getGradeFromMark(val).letter;
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    if (grade === 'W') {
      hasFailedAny = true;
      passedAll = false;
    }
  });

  const isAllAs = count > 0 && gradeCounts.A === count;

  let remarks = 'Good progress';
  if (isAllAs) {
    remarks = count === 9 ? 'Exceptional! 9 Distinction (9A) achievement' : 'Outstanding! All Distinction achievement';
  } else if (average >= 75) {
    remarks = 'Distinction level academic performance. Excellent commitment.';
  } else if (average >= 65) {
    remarks = 'Very good pass overall. Maintain focus for distinction.';
  } else if (average >= 50) {
    remarks = 'Satisfactory overall performance. Target improvement in weaker subjects.';
  } else {
    remarks = 'Needs remedial attention and dedicated teacher guidance.';
  }

  return {
    term,
    marks,
    totalMarks,
    average,
    percentage,
    gradeCounts,
    isAllAs,
    hasFailedAny,
    passedAll,
    remarks,
  };
}

/**
 * Calculates rank in class and rank in grade for each student across all terms
 */
export function assignRanks(students: Student[]): Student[] {
  const updatedStudents = JSON.parse(JSON.stringify(students)) as Student[];

  // Terms 1, 2, 3
  const terms: TermNumber[] = [1, 2, 3];

  terms.forEach((term) => {
    // 1. Group by Grade to calculate grade ranks
    const byGrade: Record<number, Student[]> = {};
    updatedStudents.forEach((student) => {
      if (!byGrade[student.grade]) byGrade[student.grade] = [];
      byGrade[student.grade].push(student);
    });

    Object.values(byGrade).forEach((gradeStudents) => {
      // Sort by average descending
      gradeStudents.sort((a, b) => (b.terms[term]?.average || 0) - (a.terms[term]?.average || 0));
      gradeStudents.forEach((st, idx) => {
        if (st.terms[term]) {
          st.terms[term].rankInGrade = idx + 1;
        }
      });
    });

    // 2. Group by Grade + Division to calculate class ranks
    const byClass: Record<string, Student[]> = {};
    updatedStudents.forEach((student) => {
      const classKey = `${student.grade}-${student.division}`;
      if (!byClass[classKey]) byClass[classKey] = [];
      byClass[classKey].push(student);
    });

    Object.values(byClass).forEach((classStudents) => {
      classStudents.sort((a, b) => (b.terms[term]?.average || 0) - (a.terms[term]?.average || 0));
      classStudents.forEach((st, idx) => {
        if (st.terms[term]) {
          st.terms[term].rankInClass = idx + 1;
        }
      });
    });
  });

  return updatedStudents;
}

/**
 * Calculates aggregated statistics for a specific Grade & Division
 */
export function calculateClassStatistics(
  students: Student[],
  grade: GradeLevel,
  division: Division,
  term: TermNumber,
  subjects: SubjectConfig[]
): ClassStatistics {
  const classStudents = students.filter((s) => s.grade === grade && s.division === division);

  if (classStudents.length === 0) {
    return {
      grade,
      division,
      term,
      totalStudents: 0,
      classAverage: 0,
      highestAverage: 0,
      lowestAverage: 0,
      passRate: 0,
      failureRate: 0,
      allAsCount: 0,
      allAsPercentage: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, S: 0, W: 0 },
      subjectAverages: {},
    };
  }

  let totalAvgSum = 0;
  let highest = -1;
  let lowest = 999;
  let allAsCount = 0;
  let passedAllCount = 0;
  let failedAnyCount = 0;

  const aggregateGrades: Record<GradeLetter, number> = { A: 0, B: 0, C: 0, S: 0, W: 0 };
  const subjectStats: Record<string, { total: number; count: number; passes: number; high: number; low: number }> = {};

  subjects.forEach((sub) => {
    subjectStats[sub.id] = { total: 0, count: 0, passes: 0, high: 0, low: 100 };
  });

  classStudents.forEach((s) => {
    const termRecord = s.terms[term];
    if (!termRecord) return;

    totalAvgSum += termRecord.average;
    if (termRecord.average > highest) highest = termRecord.average;
    if (termRecord.average < lowest) lowest = termRecord.average;

    if (termRecord.isAllAs) allAsCount++;
    if (termRecord.passedAll) passedAllCount++;
    if (termRecord.hasFailedAny) failedAnyCount++;

    // Aggregate letter grades
    Object.entries(termRecord.gradeCounts).forEach(([letter, cnt]) => {
      aggregateGrades[letter as GradeLetter] += cnt;
    });

    // Subject breakdown
    Object.entries(termRecord.marks).forEach(([subId, mark]) => {
      if (subjectStats[subId]) {
        subjectStats[subId].total += mark;
        subjectStats[subId].count += 1;
        if (mark >= 35) subjectStats[subId].passes += 1;
        if (mark > subjectStats[subId].high) subjectStats[subId].high = mark;
        if (mark < subjectStats[subId].low) subjectStats[subId].low = mark;
      }
    });
  });

  const total = classStudents.length;
  const classAvg = total > 0 ? Number((totalAvgSum / total).toFixed(1)) : 0;
  const passRate = total > 0 ? Number(((passedAllCount / total) * 100).toFixed(1)) : 0;
  const failureRate = total > 0 ? Number(((failedAnyCount / total) * 100).toFixed(1)) : 0;
  const allAsPercentage = total > 0 ? Number(((allAsCount / total) * 100).toFixed(1)) : 0;

  const subjectAverages: Record<string, { subjectName: string; average: number; passRate: number; highest: number; lowest: number }> = {};

  subjects.forEach((sub) => {
    const st = subjectStats[sub.id];
    if (st && st.count > 0) {
      subjectAverages[sub.id] = {
        subjectName: sub.name,
        average: Number((st.total / st.count).toFixed(1)),
        passRate: Number(((st.passes / st.count) * 100).toFixed(1)),
        highest: st.high,
        lowest: st.low === 100 && st.count === 0 ? 0 : st.low,
      };
    }
  });

  return {
    grade,
    division,
    term,
    totalStudents: total,
    classAverage: classAvg,
    highestAverage: highest === -1 ? 0 : highest,
    lowestAverage: lowest === 999 ? 0 : lowest,
    passRate,
    failureRate,
    allAsCount,
    allAsPercentage,
    gradeDistribution: aggregateGrades,
    subjectAverages,
  };
}

/**
 * Calculates rank ordering of subjects by academic performance (average & pass rate)
 */
export function calculateSubjectRankings(
  students: Student[],
  grade: GradeLevel,
  division: Division | 'all',
  term: TermNumber,
  subjects: SubjectConfig[]
): SubjectRanking[] {
  const targetStudents = students.filter(
    (s) => s.grade === grade && (division === 'all' || s.division === division)
  );

  if (targetStudents.length === 0) return [];

  const rankings: SubjectRanking[] = subjects.map((sub) => {
    let sum = 0;
    let count = 0;
    let passes = 0;
    let aGrades = 0;

    targetStudents.forEach((student) => {
      const mark = student.terms[term]?.marks[sub.id];
      if (typeof mark === 'number') {
        sum += mark;
        count++;
        if (mark >= 35) passes++;
        if (mark >= 75) aGrades++;
      }
    });

    const average = count > 0 ? Number((sum / count).toFixed(1)) : 0;
    const passRate = count > 0 ? Number(((passes / count) * 100).toFixed(1)) : 0;
    const aRate = count > 0 ? Number(((aGrades / count) * 100).toFixed(1)) : 0;

    return {
      subjectId: sub.id,
      subjectName: sub.shortName,
      average,
      passRate,
      aRate,
    };
  });

  // Sort by average descending
  return rankings.sort((a, b) => b.average - a.average);
}

/**
 * CSV Export generation
 */
export function exportToCSV(
  students: Student[],
  grade: GradeLevel,
  division: Division,
  term: TermNumber,
  subjects: SubjectConfig[]
): string {
  const classStudents = students.filter((s) => s.grade === grade && s.division === division);

  const headers = [
    'Student ID',
    'Index Number',
    'Full Name',
    'Grade',
    'Division',
    'Term',
    ...subjects.map((s) => `${s.shortName} (Mark)`),
    ...subjects.map((s) => `${s.shortName} (Grade)`),
    'Total Marks',
    'Average %',
    'Rank In Class',
    'Count A',
    'Count B',
    'Count C',
    'Count S',
    'Count W',
    'Remarks',
  ];

  const rows = classStudents.map((s) => {
    const t = s.terms[term];
    const markVals = subjects.map((sub) => t?.marks[sub.id] ?? '');
    const gradeVals = subjects.map((sub) => {
      const m = t?.marks[sub.id];
      return typeof m === 'number' ? getGradeFromMark(m).letter : '';
    });

    return [
      `"${s.id}"`,
      `"${s.indexNumber}"`,
      `"${s.fullName}"`,
      s.grade,
      s.division,
      term,
      ...markVals,
      ...gradeVals,
      t?.totalMarks ?? 0,
      t?.average ?? 0,
      t?.rankInClass ?? '',
      t?.gradeCounts.A ?? 0,
      t?.gradeCounts.B ?? 0,
      t?.gradeCounts.C ?? 0,
      t?.gradeCounts.S ?? 0,
      t?.gradeCounts.W ?? 0,
      `"${t?.remarks ?? ''}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generates an empty CSV template for batch mark import
 */
export function generateEmptyCSVTemplate(grade: GradeLevel, division: Division, subjects: SubjectConfig[]): string {
  const headers = [
    'Student ID',
    'Index Number',
    'Full Name',
    'Grade',
    'Division',
    'Term',
    ...subjects.map((s) => s.shortName),
  ];

  const sampleRow1 = [
    'LK-2026-901',
    'IDX-700101',
    'Saman Kumara',
    grade,
    division,
    1,
    ...subjects.map(() => '78'),
  ];

  const sampleRow2 = [
    'LK-2026-902',
    'IDX-700102',
    'Fathima Zeenath',
    grade,
    division,
    1,
    ...subjects.map(() => '85'),
  ];

  return [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
}
