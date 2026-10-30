import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { TermNumber, GradeLetter } from '../../types/lms';
import { SRI_LANKAN_GRADE_RULES, getGradeFromMark } from '../../utils/grading';
import '../charts/ChartSetup';
import { Bar, Radar, Line } from 'react-chartjs-2';
import {
  X,
  Printer,
  Award,
  TrendingUp,
  BarChart3,
  Compass,
  User,
  Calendar,
  UserCheck,
  Edit2,
} from 'lucide-react';
import { EditStudentModal } from './EditStudentModal';

interface StudentDetailModalProps {
  studentId: string;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ studentId, onClose }) => {
  const {
    students,
    selectedTerm,
    setSelectedTerm,
    currentSubjects,
    currentClassStats,
    theme,
    getTeacherForSubject,
    getClassTeacher,
    currentRole,
  } = useLMS();

  const student = students.find((s) => s.id === studentId);
  const [activeSubTab, setActiveSubTab] = useState<'performance' | 'report_card'>('performance');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!student) return null;

  const currentTermRecord = student.terms[selectedTerm];
  const isDark = theme === 'dark';

  // Appointed Class Teacher for this student's grade & division
  const appointedClassTeacher = getClassTeacher(student.grade, student.division);

  // 1. Data for Bar Chart: Student Marks vs Class Average
  const barChartLabels = currentSubjects.map((s) => s.shortName);
  const studentMarks = currentSubjects.map((s) => currentTermRecord?.marks[s.id] ?? 0);
  const classAverages = currentSubjects.map((s) => currentClassStats.subjectAverages[s.id]?.average ?? 0);

  const barChartData = {
    labels: barChartLabels,
    datasets: [
      {
        label: `${student.fullName} (Marks)`,
        data: studentMarks,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Class Average',
        data: classAverages,
        backgroundColor: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(203, 213, 225, 0.7)',
        borderColor: isDark ? 'rgb(148, 163, 184)' : 'rgb(148, 163, 184)',
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
          font: { family: 'Plus Jakarta Sans', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#ffffff' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
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

  // 2. Data for Radar Chart: Subject Strengths & Weaknesses
  const radarChartData = {
    labels: barChartLabels,
    datasets: [
      {
        label: 'Student Mark Profile',
        data: studentMarks,
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: 'rgb(99, 102, 241)',
        pointBackgroundColor: 'rgb(79, 70, 229)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(79, 70, 229)',
        borderWidth: 2,
      },
      {
        label: 'Sri Lankan Distinction (75%)',
        data: currentSubjects.map(() => 75),
        borderColor: 'rgba(16, 185, 129, 0.6)',
        borderDash: [4, 4],
        backgroundColor: 'transparent',
        pointRadius: 0,
        borderWidth: 1.5,
      },
      {
        label: 'Pass Threshold (35%)',
        data: currentSubjects.map(() => 35),
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
        angleLines: { color: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)' },
        pointLabels: {
          color: isDark ? '#cbd5e1' : '#334155',
          font: { family: 'Plus Jakarta Sans', size: 10 },
        },
      },
    },
  };

  // 3. Data for Line Chart: Percentage Trend Lines Over Terms
  const trendLabels = ['Term 1', 'Term 2', 'Term 3'];
  const trendAverages = [
    student.terms[1]?.average ?? 0,
    student.terms[2]?.average ?? 0,
    student.terms[3]?.average ?? 0,
  ];

  const lineChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: `${student.fullName} (% Average)`,
        data: trendAverages,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 5,
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-5xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {student.fullName}
                </h2>
                {currentTermRecord?.isAllAs && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    {currentSubjects.length === 9 ? '9 Distinction (9A)' : 'All Distinction'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-mono tabular-nums">{student.id}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">Index: {student.indexNumber}</span>
                <span>·</span>
                <span>Grade {student.grade}-{student.division}</span>
                <span>·</span>
                <span>Medium: {student.medium}</span>
                {appointedClassTeacher && (
                  <>
                    <span>·</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      Class Teacher: {appointedClassTeacher.fullName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Analytics vs Printable Report Card */}
            <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-lg">
              <button
                onClick={() => setActiveSubTab('performance')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeSubTab === 'performance'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Analytics View
              </button>
              <button
                onClick={() => setActiveSubTab('report_card')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeSubTab === 'report_card'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Term Report Card
              </button>
            </div>

            {currentRole === 'admin' && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Edit Student Name & Details"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Edit Details</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              title="Print Official Term Report Card"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Term Toggle in Student View */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 no-print">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Evaluation Term:
              </span>
              {([1, 2, 3] as TermNumber[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTerm(t)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedTerm === t
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Term {t}
                </button>
              ))}
            </div>

            {/* Quick KPI stats */}
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400">Class Position:</span>{' '}
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  #{currentTermRecord?.rankInClass || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Total:</span>{' '}
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {currentTermRecord?.totalMarks || 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Average:</span>{' '}
                <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {currentTermRecord?.average || 0}%
                </span>
              </div>
            </div>
          </div>

          {activeSubTab === 'performance' ? (
            <>
              {/* Summary Grade Pill Breakdown (Sri Lankan A, B, C, S, W) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(['A', 'B', 'C', 'S', 'W'] as GradeLetter[]).map((letter) => {
                  const rule = SRI_LANKAN_GRADE_RULES[letter];
                  const count = currentTermRecord?.gradeCounts[letter] || 0;
                  return (
                    <div
                      key={letter}
                      className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${rule.badgeClass}`}>
                          {letter}
                        </span>
                        <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {rule.label} ({rule.min}–{rule.max}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Subject Breakdown Table with Linked Teacher */}
              <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Subject Score & Automated Sri Lankan Grading
                  </h3>
                  <span className="text-xs text-slate-400">
                    {currentSubjects.length} Curricular Subjects
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Subject</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Student Mark</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Assigned Grade</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Class Avg</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Performance Delta</th>
                        <th className="py-2.5 px-4 font-semibold">Assigned Subject Teacher</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentSubjects.map((subject) => {
                        const mark = currentTermRecord?.marks[subject.id] ?? 0;
                        const gradeInfo = getGradeFromMark(mark);
                        const classAvg = currentClassStats.subjectAverages[subject.id]?.average ?? 0;
                        const delta = Number((mark - classAvg).toFixed(1));
                        const teacher = getTeacherForSubject(subject.id, student.grade, student.division);

                        return (
                          <tr key={subject.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                              {subject.name}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                              {mark}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${gradeInfo.badgeClass}`}>
                                {gradeInfo.letter}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                              {classAvg}%
                            </td>
                            <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                              delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                            }`}>
                              {delta >= 0 ? `+${delta}` : delta}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                              {teacher ? (
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {teacher.fullName}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Not Assigned</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visual Charts Grid: Bar Chart, Radar Chart, Trend Line */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart: Subject Marks vs Class Average */}
                <div className="bg-white dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      Subject Performance vs. Class Average
                    </h3>
                  </div>
                  <div className="h-64">
                    <Bar data={barChartData} options={barChartOptions} />
                  </div>
                </div>

                {/* Radar Chart: Subject Strengths & Weaknesses */}
                <div className="bg-white dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-indigo-500" />
                      Subject Competency Radar Profile
                    </h3>
                  </div>
                  <div className="h-64">
                    <Radar data={radarChartData} options={radarChartOptions} />
                  </div>
                </div>
              </div>

              {/* Term Trend Line Chart */}
              <div className="bg-white dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    Overall Academic Percentage Progression Across Terms
                  </h3>
                  <span className="text-xs text-slate-400">
                    Terms 1, 2, and 3
                  </span>
                </div>
                <div className="h-48">
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </div>
            </>
          ) : (
            /* Printable Sri Lankan Term Report Card with Linked Faculty */
            <div className="report-card-container bg-white text-slate-900 p-8 rounded-lg border border-slate-300 dark:border-slate-700 max-w-4xl mx-auto shadow-sm">
              
              {/* Report Card Header */}
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
                  Academic Year 2026 · Term {selectedTerm} Examination
                </p>
              </div>

              {/* Student Metadata Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-md mb-6 text-xs">
                <div>
                  <span className="text-slate-500 block">Student Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Index Number:</span>
                  <span className="font-mono font-bold text-slate-900">{student.indexNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Grade & Division:</span>
                  <span className="font-bold text-slate-900">Grade {student.grade}-{student.division}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Class Teacher:</span>
                  <span className="font-semibold text-slate-900">
                    {appointedClassTeacher ? appointedClassTeacher.fullName : 'Academic Master'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Attendance Rate:</span>
                  <span className="font-mono font-semibold text-slate-900">{student.attendanceRate}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Class Rank:</span>
                  <span className="font-bold text-slate-900">#{currentTermRecord?.rankInClass || 1} of {currentClassStats.totalStudents}</span>
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

              {/* Report Card Marks Table with Assigned Subject Teachers */}
              <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-6">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                    <th className="py-2 px-3 border-r border-slate-300 font-bold">#</th>
                    <th className="py-2 px-3 border-r border-slate-300 font-bold">Subject Name</th>
                    <th className="py-2 px-3 border-r border-slate-300 font-bold">Subject Teacher</th>
                    <th className="py-2 px-3 border-r border-slate-300 font-bold text-right">Marks (100)</th>
                    <th className="py-2 px-3 border-r border-slate-300 font-bold text-center">Grade</th>
                    <th className="py-2 px-3 border-r border-slate-300 font-bold text-right">Class Avg</th>
                    <th className="py-2 px-3 font-bold">Evaluation Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSubjects.map((sub, index) => {
                    const mark = currentTermRecord?.marks[sub.id] ?? 0;
                    const gradeInfo = getGradeFromMark(mark);
                    const classAvg = currentClassStats.subjectAverages[sub.id]?.average ?? 0;
                    const teacher = getTeacherForSubject(sub.id, student.grade, student.division);
                    return (
                      <tr key={sub.id} className="border-b border-slate-200">
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-500 font-mono">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-medium">
                          {sub.name}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                          {teacher ? teacher.fullName : '—'}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold">
                          {mark}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-bold">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${gradeInfo.badgeClass}`}>
                            {gradeInfo.letter}
                          </span>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right font-mono text-slate-600">
                          {classAvg}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {gradeInfo.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Sri Lankan Grading Standard Guide */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-6 text-[11px] text-slate-600">
                <span className="font-bold text-slate-900 block mb-1">Sri Lankan National Grading Scheme:</span>
                <div className="flex flex-wrap gap-4">
                  <span><strong>A:</strong> 75–100% (Distinction)</span>
                  <span><strong>B:</strong> 65–74% (Very Good Pass)</span>
                  <span><strong>C:</strong> 55–64% (Credit Pass)</span>
                  <span><strong>S:</strong> 35–54% (Ordinary Pass)</span>
                  <span><strong>W:</strong> 0–34% (Weak / Fail)</span>
                </div>
              </div>

              {/* Teacher Remarks & Principal Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
                <div>
                  <span className="font-semibold block text-slate-800 mb-1">Class Teacher's Observations:</span>
                  <p className="italic text-slate-600 mb-4">
                    "{currentTermRecord?.remarks}"
                  </p>
                  <div className="border-t border-dashed border-slate-400 pt-2 text-slate-600">
                    <span className="font-bold block text-slate-800">
                      {appointedClassTeacher ? appointedClassTeacher.fullName : 'Class Teacher'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {appointedClassTeacher?.qualification || 'Appointed Form Teacher'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-semibold block text-slate-800 mb-1">School Certification:</span>
                  <p className="text-slate-500 mb-4 text-xs">
                    Certified authentic record under Ministry standards.
                  </p>
                  <div className="border-t border-dashed border-slate-400 pt-2 text-slate-600">
                    <span className="font-bold block text-slate-800">Principal / Vice Principal</span>
                    <span className="text-[11px] text-slate-500 block">Official Examination Seal</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Edit Student Details Modal */}
      {isEditModalOpen && (
        <EditStudentModal
          student={student}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
};
