import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { TermNumber, GradeLetter, Student } from '../../types/lms';
import { SRI_LANKAN_GRADE_RULES, getGradeFromMark } from '../../utils/grading';
import '../charts/ChartSetup';
import { Bar, Radar, Line } from 'react-chartjs-2';
import {
  Search,
  Users,
  Award,
  CheckCircle2,
  Calendar,
  BarChart3,
  Compass,
  TrendingUp,
  Printer,
  ShieldCheck,
  UserCheck,
  Phone,
  HelpCircle,
  FileText,
} from 'lucide-react';

export const ParentPortalView: React.FC = () => {
  const {
    students,
    subjects,
    selectedTerm,
    setSelectedTerm,
    getTeacherForSubject,
    getClassTeacher,
    theme,
  } = useLMS();

  const isDark = theme === 'dark';

  // Sample index numbers for quick demonstration
  const sampleIndices = [
    { label: 'Grade 10-A (9A Distinction)', index: 'IDX-10100' },
    { label: 'Grade 10-A (Very Good Pass)', index: 'IDX-10101' },
    { label: 'Grade 11-A (Distinction)', index: 'IDX-11100' },
    { label: 'Grade 5-A (Primary)', index: 'IDX-5100' },
  ];

  const [searchIndex, setSearchIndex] = useState('IDX-10100');
  const [activeStudent, setActiveStudent] = useState<Student | null>(() => {
    return students.find((s) => s.indexNumber === 'IDX-10100') || students[0] || null;
  });
  const [hasSearched, setHasSearched] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const query = searchIndex.trim().toUpperCase();

    if (!query) {
      setErrorMessage('Please enter an Examination Index Number or Student ID.');
      return;
    }

    const found = students.find(
      (s) => s.indexNumber.toUpperCase() === query || s.id.toUpperCase() === query
    );

    if (found) {
      setActiveStudent(found);
      setHasSearched(true);
    } else {
      setErrorMessage(`No student record found with Index Number or ID "${query}". Please check the index number on the student's admission card.`);
    }
  };

  const handleSelectSample = (idx: string) => {
    setSearchIndex(idx);
    setErrorMessage('');
    const found = students.find((s) => s.indexNumber === idx);
    if (found) {
      setActiveStudent(found);
      setHasSearched(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentTermRecord = activeStudent ? activeStudent.terms[selectedTerm] : null;

  // Subjects applicable for this student's grade
  const applicableSubjects = activeStudent
    ? subjects.filter((s) => s.applicableGrades.includes(activeStudent.grade))
    : [];

  const classTeacher = activeStudent ? getClassTeacher(activeStudent.grade, activeStudent.division) : null;

  // Visual Chart Data
  const chartLabels = applicableSubjects.map((s) => s.shortName);
  const studentMarks = applicableSubjects.map((s) => currentTermRecord?.marks[s.id] ?? 0);

  // Bar Chart: Student Marks vs Passing Standard
  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: `${activeStudent?.fullName || 'Student'} (Term Marks)`,
        data: studentMarks,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Sri Lankan Distinction (75%)',
        data: applicableSubjects.map(() => 75),
        backgroundColor: 'rgba(16, 185, 129, 0.25)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#cbd5e1' : '#334155',
          font: { family: 'Plus Jakarta Sans', size: 11 },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: isDark ? '#94a3b8' : '#64748b' },
        grid: { color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)' },
      },
      x: {
        ticks: { color: isDark ? '#94a3b8' : '#64748b' },
        grid: { display: false },
      },
    },
  };

  // Radar Chart: Subject Strengths & Weaknesses
  const radarChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Curriculum Competency',
        data: studentMarks,
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: 'rgb(99, 102, 241)',
        pointBackgroundColor: 'rgb(79, 70, 229)',
        pointBorderColor: '#fff',
        borderWidth: 2,
      },
      {
        label: 'Minimum Ordinary Pass (35%)',
        data: applicableSubjects.map(() => 35),
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderDash: [3, 3],
        backgroundColor: 'transparent',
        pointRadius: 0,
        borderWidth: 1,
      },
    ],
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#cbd5e1' : '#334155',
          font: { family: 'Plus Jakarta Sans', size: 11 },
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          color: isDark ? '#94a3b8' : '#64748b',
          backdropColor: 'transparent',
        },
        grid: { color: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)' },
        pointLabels: {
          color: isDark ? '#cbd5e1' : '#334155',
          font: { family: 'Plus Jakarta Sans', size: 10 },
        },
      },
    },
  };

  // Trend Line Chart across terms
  const lineChartData = {
    labels: ['Term 1 Examination', 'Term 2 Examination', 'Term 3 Examination'],
    datasets: [
      {
        label: 'Average Progression (%)',
        data: [
          activeStudent?.terms[1]?.average ?? 0,
          activeStudent?.terms[2]?.average ?? 0,
          activeStudent?.terms[3]?.average ?? 0,
        ],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 6,
        pointBackgroundColor: 'rgb(79, 70, 229)',
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#cbd5e1' : '#334155',
          font: { family: 'Plus Jakarta Sans', size: 11 },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: isDark ? '#94a3b8' : '#64748b' },
        grid: { color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)' },
      },
      x: {
        ticks: { color: isDark ? '#94a3b8' : '#64748b' },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="space-y-6">
      
      {/* Parent Portal Header & Search Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Parent & Guardian Portal · Read-Only Results
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-500">No Login Required</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Official Student Academic Progress & Results Lookup
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Enter your child's Examination Index Number (found on their school admission or ID card) to view official term results, automated Sri Lankan letter grades, and performance analytics.
            </p>
          </div>

          {activeStudent && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Print Term Progress Report</span>
            </button>
          )}
        </div>

        {/* Index Number Search Input */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2 max-w-xl">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Enter Student Index Number (e.g., IDX-10100)..."
                value={searchIndex}
                onChange={(e) => setSearchIndex(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase font-semibold"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-lg shadow-xs transition-colors shrink-0"
            >
              Lookup Results
            </button>
          </form>

          {errorMessage && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Quick Sample Index Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 text-xs">
            <span className="text-slate-400 text-[11px]">Quick Demo Samples:</span>
            {sampleIndices.map((s) => (
              <button
                key={s.index}
                type="button"
                onClick={() => handleSelectSample(s.index)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors border ${
                  activeStudent?.indexNumber === s.index
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                {s.label}: {s.index}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Content */}
      {activeStudent && (
        <>
          {/* Student Profile Card & Term Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-base flex items-center justify-center shrink-0">
                  {activeStudent.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeStudent.fullName}
                    </h2>
                    {currentTermRecord?.isAllAs && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>All Distinction Achiever</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      Index: {activeStudent.indexNumber}
                    </span>
                    <span>·</span>
                    <span>Student ID: {activeStudent.id}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Grade {activeStudent.grade}-{activeStudent.division}
                    </span>
                    <span>·</span>
                    <span>Medium: {activeStudent.medium}</span>
                    <span>·</span>
                    <span>Attendance: {activeStudent.attendanceRate}%</span>
                  </div>
                </div>
              </div>

              {/* Term Selector */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60 self-start lg:self-auto">
                <Calendar className="w-4 h-4 text-slate-500 ml-1.5" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Evaluation Term:
                </span>
                {([1, 2, 3] as TermNumber[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTerm(t)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      selectedTerm === t
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Term {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Class Teacher Contact strip */}
            {classTeacher && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>Appointed Class Teacher:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{classTeacher.fullName}</strong>
                  <span className="text-[11px] text-slate-400">({classTeacher.qualification})</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span>Email: {classTeacher.email}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{classTeacher.phone}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Overall Term Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Marks</span>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {currentTermRecord?.totalMarks || 0}
                </div>
                <span className="text-[11px] text-slate-400">Out of {applicableSubjects.length * 100}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Term Average</span>
                <div className="text-xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {currentTermRecord?.average || 0}%
                </div>
                <span className="text-[11px] text-slate-400">
                  {currentTermRecord && currentTermRecord.average >= 75
                    ? 'Distinction Standard'
                    : currentTermRecord && currentTermRecord.average >= 65
                    ? 'Very Good Standard'
                    : currentTermRecord && currentTermRecord.average >= 55
                    ? 'Credit Standard'
                    : 'Passing Standard'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Class Rank</span>
                <div className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
                  #{currentTermRecord?.rankInClass || 1}
                </div>
                <span className="text-[11px] text-slate-400">In Grade {activeStudent.grade}-{activeStudent.division}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Curriculum Status</span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {currentTermRecord?.passedAll ? 'Passed All' : 'Needs Review'}
                </div>
                <span className="text-[11px] text-slate-400">
                  {currentTermRecord?.isAllAs ? 'All Distinction (A)' : 'Eligible for advancement'}
                </span>
              </div>
            </div>
          </div>

          {/* National Sri Lankan Letter Grade Counts (A, B, C, S, W) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(['A', 'B', 'C', 'S', 'W'] as GradeLetter[]).map((letter) => {
              const rule = SRI_LANKAN_GRADE_RULES[letter];
              const count = currentTermRecord?.gradeCounts[letter] || 0;
              return (
                <div
                  key={letter}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${rule.badgeClass}`}>
                        {letter}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {rule.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Standard: {rule.min}–{rule.max}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subject Marks Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Term {selectedTerm} Official Subject Marks & Grade Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Automated grade assignment adhering to standard Sri Lankan Ministry of Education rules
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {applicableSubjects.length} Curricular Subjects
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Subject Title</th>
                    <th className="py-3 px-3 font-semibold text-right">Student Mark (100)</th>
                    <th className="py-3 px-3 font-semibold text-center">Letter Grade</th>
                    <th className="py-3 px-3 font-semibold">Performance Description</th>
                    <th className="py-3 px-4 font-semibold">Assigned Subject Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {applicableSubjects.map((subject) => {
                    const mark = currentTermRecord?.marks[subject.id] ?? 0;
                    const gradeInfo = getGradeFromMark(mark);
                    const teacher = getTeacherForSubject(subject.id, activeStudent.grade, activeStudent.division);

                    return (
                      <tr key={subject.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{subject.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{subject.code}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-sm tabular-nums text-slate-900 dark:text-white">
                          {mark}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${gradeInfo.badgeClass}`}>
                            {gradeInfo.letter}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {gradeInfo.label} ({gradeInfo.min}–{gradeInfo.max}%)
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {teacher ? (
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {teacher.fullName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Academic Master</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Charts: Bar & Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Bar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="mb-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  Subject Marks vs. Sri Lankan Distinction Standard
                </h3>
              </div>
              <div className="h-64">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="mb-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-500" />
                  Curriculum Strengths & Competency Radar
                </h3>
              </div>
              <div className="h-64">
                <Radar data={radarChartData} options={radarChartOptions} />
              </div>
            </div>

          </div>

          {/* Progression Line Chart across terms */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Annual Term-by-Term Percentage Progression (Terms 1, 2, 3)
              </h3>
            </div>
            <div className="h-48">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Printable Official Term Progress Report Card Section */}
          <div className="report-card-container bg-white text-slate-900 p-8 rounded-xl border border-slate-300 max-w-4xl mx-auto shadow-sm">
            <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center font-serif font-black text-sm">
                  LK
                </div>
                <h1 className="text-xl font-bold tracking-tight uppercase">
                  SRI LANKA MINISTRY OF EDUCATION CURRICULUM
                </h1>
              </div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-700">
                OFFICIAL STUDENT PROGRESS & TERM EVALUATION REPORT
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Academic Year 2026 · Term {selectedTerm} Examination · Parent Record
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-md mb-6 text-xs">
              <div>
                <span className="text-slate-500 block">Student Name:</span>
                <span className="font-bold text-slate-900 text-sm">{activeStudent.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Index Number:</span>
                <span className="font-mono font-bold text-slate-900">{activeStudent.indexNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Grade & Class:</span>
                <span className="font-bold text-slate-900">Grade {activeStudent.grade}-{activeStudent.division}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Class Teacher:</span>
                <span className="font-semibold text-slate-900">
                  {classTeacher ? classTeacher.fullName : 'Class Teacher'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Attendance:</span>
                <span className="font-mono font-semibold text-slate-900">{activeStudent.attendanceRate}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Class Merit Position:</span>
                <span className="font-bold text-slate-900">#{currentTermRecord?.rankInClass || 1}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Term Average:</span>
                <span className="font-mono font-bold text-indigo-700">{currentTermRecord?.average}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Marks:</span>
                <span className="font-mono font-bold text-slate-900">{currentTermRecord?.totalMarks}</span>
              </div>
            </div>

            <div className="text-right no-print mb-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Copy</span>
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
