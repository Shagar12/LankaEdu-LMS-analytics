import { GradeLevel, Division, Student } from '../types/lms';
import { getSubjectsForGrade, calculateTermRecord, assignRanks } from '../utils/grading';

const FIRST_NAMES = [
  'Kavindu', 'Tharushi', 'Dinuka', 'Fathima', 'Sivakumar', 'Chamari', 'Kaveen', 'Archana',
  'Mohamed', 'Nethmi', 'Sanjeewa', 'Rashmi', 'Praveen', 'Heshani', 'Dulshan', 'Ananya',
  'Ravindu', 'Shenali', 'Tharindu', 'Bavani', 'Lakshan', 'Sanduni', 'Pradeep', 'Gimhani',
  'Ashen', 'Devika', 'Isuru', 'Pooja', 'Nipuna', 'Shalini', 'Kushan', 'Thilini'
];

const LAST_NAMES = [
  'Perera', 'Fernando', 'Jayawardena', 'Rizwan', 'Thivakaran', 'Bandara', 'Senanayake', 'Selvarajah',
  'Farhan', 'Dissanayake', 'Gunaratne', 'Abeykoon', 'Mendis', 'Alwis', 'Karunaratne', 'Navaratnam',
  'Wickramasinghe', 'Kulasekara', 'Ranasinghe', 'Sathasivam', 'Rajapaksha', 'Weerasinghe', 'Hettiarachchi',
  'Tennakoon', 'Samarasinghe', 'Silva', 'Pathirana', 'Vidanapathirana', 'Balasuriya', 'Wijethunga'
];

const GUARDIAN_PREFIXES = ['Mr.', 'Mrs.', 'Dr.', 'Prof.'];

/**
 * Seed initial students across Grades 1–13 (Divisions A, B, C)
 */
export function generateInitialMockStudents(): Student[] {
  const students: Student[] = [];
  let studentCounter = 1001;

  const grades: GradeLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const divisions: Division[] = ['A', 'B', 'C'];

  grades.forEach((grade) => {
    const subjects = getSubjectsForGrade(grade);

    divisions.forEach((division) => {
      // Create 10 to 14 students per class
      const classSize = grade === 10 || grade === 11 ? 12 : 8;

      for (let i = 0; i < classSize; i++) {
        const studentId = `LK-${grade}${division}-${String(studentCounter).padStart(4, '0')}`;
        const indexNumber = `IDX-${grade * 1000 + i + 100}`;
        const fName = FIRST_NAMES[(studentCounter * 7 + i * 3) % FIRST_NAMES.length];
        const lName = LAST_NAMES[(studentCounter * 11 + i * 5) % LAST_NAMES.length];
        const fullName = `${fName} ${lName}`;
        const gender: 'Male' | 'Female' = i % 2 === 0 ? 'Male' : 'Female';
        const medium = i % 5 === 0 ? 'English' : i % 7 === 0 ? 'Tamil' : 'Sinhala';

        // Student profile archetype
        // Archetype 0: High flyer (Potential 9 A's or high 80s-90s)
        // Archetype 1: Good B/A student (65-80)
        // Archetype 2: Solid Credit student (55-70)
        // Archetype 3: Ordinary Pass student (40-60)
        // Archetype 4: Needs Support / weak in 1-2 subjects (25-45)
        const archetype = i % 5;

        // Generate marks for Terms 1, 2, 3 with realistic progression
        const term1Marks: Record<string, number> = {};
        const term2Marks: Record<string, number> = {};
        const term3Marks: Record<string, number> = {};

        subjects.forEach((sub, subIdx) => {
          let baseMark = 60;
          if (archetype === 0) {
            // High Achiever
            baseMark = 82 + ((studentCounter + subIdx) % 16); // 82 - 97
          } else if (archetype === 1) {
            baseMark = 68 + ((studentCounter + subIdx) % 18); // 68 - 85
          } else if (archetype === 2) {
            baseMark = 55 + ((studentCounter + subIdx) % 18); // 55 - 72
          } else if (archetype === 3) {
            baseMark = 42 + ((studentCounter + subIdx) % 20); // 42 - 61
          } else {
            // Struggling student
            baseMark = 28 + ((studentCounter + subIdx) % 25); // 28 - 52
          }

          // Bound
          baseMark = Math.min(99, Math.max(18, baseMark));

          // Term 1
          term1Marks[sub.id] = baseMark;

          // Term 2 (slight fluctuation ± 4)
          const delta2 = ((studentCounter * 3 + subIdx * 2) % 9) - 4;
          term2Marks[sub.id] = Math.min(100, Math.max(15, baseMark + delta2));

          // Term 3 (general improvement towards end of year + 3 ± 4)
          const delta3 = ((studentCounter * 5 + subIdx) % 9) - 2;
          term3Marks[sub.id] = Math.min(100, Math.max(15, baseMark + delta3));
        });

        // Add 1 student in 10-A and 11-A with pure 9 A's guaranteed (a celebrated milestone in Sri Lanka)
        if ((grade === 10 || grade === 11) && division === 'A' && i === 0) {
          subjects.forEach((sub) => {
            term1Marks[sub.id] = 88;
            term2Marks[sub.id] = 92;
            term3Marks[sub.id] = 95;
          });
        }

        const t1Record = calculateTermRecord(1, term1Marks);
        const t2Record = calculateTermRecord(2, term2Marks);
        const t3Record = calculateTermRecord(3, term3Marks);

        const guardianPrefix = GUARDIAN_PREFIXES[i % GUARDIAN_PREFIXES.length];
        const guardian = `${guardianPrefix} ${lName}`;
        const attendance = 85 + (studentCounter % 15);

        students.push({
          id: studentId,
          indexNumber,
          fullName,
          grade,
          division,
          gender,
          medium,
          attendanceRate: attendance,
          guardianName: guardian,
          contactNumber: `+94 7${1 + (studentCounter % 8)} ${100 + (studentCounter % 900)} ${2000 + (studentCounter % 8000)}`,
          terms: {
            1: t1Record,
            2: t2Record,
            3: t3Record,
          },
        });

        studentCounter++;
      }
    });
  });

  return assignRanks(students);
}
