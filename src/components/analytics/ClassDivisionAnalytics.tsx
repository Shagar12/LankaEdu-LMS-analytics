import React from 'react';
import { useLMS } from '../../context/LMSContext';
import { GradeLetter, Division } from '../../types/lms';
import { SRI_LANKAN_GRADE_RULES } from '../../utils/grading';
import '../charts/ChartSetup';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  BarChart3,
  PieChart as PieIcon,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  Users,
} from 'lucide-react';

export const ClassDivisionAnalytics: React.FC = () => {
  const {
    students,
    selectedGrade,
    selectedDivision,
    selectedTerm,
    currentSubjects,
    currentClassStats,
    currentSubjectRankings,
    currentDivisionComparison,
    theme,
    setSelectedStudentId,
    currentClassTeacher,
  } = useLMS();

  const isDark = theme === 'dark';

  // 1. Chart: Division Comparison (e.g. 10-A vs 10-B vs 10-C)
  const divisionLabels = currentDivisionComparison.map((d) => `Grade ${selectedGrade}-${d.division}`);
  const divisionAverages = currentDivisionComparison.map((d) => d.average);
  const divisionPassRates = currentDivisionComparison.map((d) => d.passRate);

  const divisionComparisonData = {
    labels: divisionLabels,
    datasets: [
      {
        label: 'Class Average (%)',
        data: divisionAverages,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Overall Pass Rate (%)',
        data: divisionPassRates,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(5, 150, 105)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const divisionComparisonOptions = {
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

  // 2. Chart: Grade Letter Distribution in Current Class (A, B, C, S, W)
  const gradeLetters: GradeLetter[] = ['A', 'B', 'C', 'S', 'W'];
  const gradeDistributionData = {
    labels: gradeLetters.map((l) => `${l} (${SRI_LANKAN_GRADE_RULES[l].label})`),
    datasets: [
      {
        data: gradeLetters.map((l) => currentClassStats.gradeDistribution[l] || 0),
        backgroundColor: [
          '#16a34a', // A (Emerald)
          '#2563eb', // B (Blue)
          '#0284c7', // C (Sky)
          '#d97706', // S (Amber)
          '#dc2626', // W (Red)
        ],
        borderWidth: 2,
        borderColor: isDark ? '#0f172a' : '#ffffff',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: isDark ? '#cbd5e1' : '#334155',
          font: { family: 'Plus Jakarta Sans', size: 11 },
          boxWidth: 12,
        },
      },
    },
    cutout: '65%',
  };

  // Filter students for current class leaderboard
  const classStudents = students
    .filter((s) => s.grade === selectedGrade && s.division === selectedDivision)
    .sort((a, b) => (b.terms[selectedTerm]?.average || 0) - (a.terms[selectedTerm]?.average || 0));

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Class Details & Appointed Faculty */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Grade {selectedGrade}-{selectedDivision}
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Evaluation Term {selectedTerm}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Academic Analytics & Comparative Intelligence
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated Sri Lankan grading analysis, inter-division benchmarking, and subject performance rankings
            </p>
          </div>

          {currentClassTeacher && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="text-slate-400 block text-[11px]">Appointed Class Teacher</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentClassTeacher.fullName}</span>
              <span className="text-[11px] text-slate-500 block truncate max-w-xs">{currentClassTeacher.qualification}</span>
            </div>
          )}
        </div>

        {/* Quick KPI Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Class Average</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold tabular-nums font-mono text-indigo-600 dark:text-indigo-400">
                {currentClassStats.classAverage}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400">High: {currentClassStats.highestAverage}%</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Pass Rate (All Passed)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
                {currentClassStats.passRate}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400">No failing 'W' grades</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">All Distinction Achievers</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold tabular-nums font-mono text-amber-600 dark:text-amber-400">
                {currentClassStats.allAsCount}
              </span>
              <span className="text-xs text-slate-400">({currentClassStats.allAsPercentage}%)</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {currentSubjects.length === 9 ? '9 Distinction (9A)' : 'All Distinction'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Remedial Intervention</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold tabular-nums font-mono text-red-600 dark:text-red-400">
                {currentClassStats.failureRate}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Has 1+ 'W' (Weak) mark</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Enrolled Students</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold tabular-nums font-mono text-slate-900 dark:text-white">
                {currentClassStats.totalStudents}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Grade {selectedGrade}-{selectedDivision} Active</span>
          </div>
        </div>
      </div>

      {/* Comparative Charts: Division Comparison & Grade Letter Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Division Comparison: 10-A vs 10-B vs 10-C */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Inter-Division Benchmarking (Grade {selectedGrade})
              </h2>
              <p className="text-xs text-slate-500">
                Comparing Class Average vs. Pass Percentage across Divisions A, B, and C
              </p>
            </div>
          </div>
          <div className="h-64">
            <Bar data={divisionComparisonData} options={divisionComparisonOptions} />
          </div>
        </div>

        {/* Overall Grade Distribution Doughnut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-indigo-500" />
                Overall Sri Lankan Grade Distribution (A, B, C, S, W)
              </h2>
              <p className="text-xs text-slate-500">
                Distribution of assigned letter grades across all student subject papers in Grade {selectedGrade}-{selectedDivision}
              </p>
            </div>
          </div>
          <div className="h-64">
            <Doughnut data={gradeDistributionData} options={doughnutOptions} />
          </div>
        </div>

      </div>

      {/* Two Column Grid: Automated Subject Rankings & Student Class Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Automated Subject Rankings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-indigo-500" />
                Automated Subject Academic Ranking
              </h2>
              <p className="text-xs text-slate-500">
                Ranked from highest performing subject to toughest subject
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {currentSubjectRankings.length} Subjects
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Rank</th>
                  <th className="py-2.5 px-4 font-semibold">Subject</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Avg Mark</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Pass Rate (≥35)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Distinction (≥75)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentSubjectRankings.map((sub, idx) => (
                  <tr key={sub.subjectId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                      {sub.subjectName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                      {sub.average}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {sub.passRate}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                      {sub.aRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Automated Student Class Rank Leaderboard */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-500" />
                Student Class Academic Rank
              </h2>
              <p className="text-xs text-slate-500">
                Official merit rank based on Term {selectedTerm} percentage average
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {classStudents.length} Students
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Rank</th>
                  <th className="py-2.5 px-4 font-semibold">Student Name</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total Marks</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Average %</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Distinctions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classStudents.map((s, idx) => {
                  const t = s.terms[selectedTerm];
                  const rank = idx + 1;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {rank === 1 ? (
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 inline-flex items-center justify-center text-[10px]">
                            1
                          </span>
                        ) : (
                          <span className="text-slate-400">#{rank}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{s.fullName}</span>
                          {t?.isAllAs && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                              All A
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{s.indexNumber}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                        {t?.totalMarks || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                        {t?.average || 0}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-[11px]">
                          {t?.gradeCounts.A || 0} A
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
