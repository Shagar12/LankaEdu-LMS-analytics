import React from 'react';
import { useLMS } from '../../context/LMSContext';
import { GradeLevel, Division } from '../../types/lms';
import '../charts/ChartSetup';
import { Bar } from 'react-chartjs-2';
import {
  GraduationCap,
  Users,
  Award,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Layers,
  Sparkles,
  CheckCircle2,
  Key,
  UserCheck,
  Clock,
} from 'lucide-react';
import { AdminPasswordSettingsCard } from '../settings/AdminPasswordSettingsCard';

export const SchoolOverview: React.FC = () => {
  const {
    students,
    teachers,
    subjects,
    selectedTerm,
    setSelectedGrade,
    setSelectedDivision,
    setActiveTab,
    setSelectedStudentId,
    theme,
    currentRole,
    isCustomPasswordSet,
    pendingUsers,
  } = useLMS();

  const isDark = theme === 'dark';

  // Total enrolled students
  const totalStudents = students.length;

  // School-wide statistics across all grades for current term
  let totalAverageSum = 0;
  let totalPasses = 0;
  let totalAllAs = 0;

  students.forEach((s) => {
    const t = s.terms[selectedTerm];
    if (t) {
      totalAverageSum += t.average;
      if (t.passedAll) totalPasses++;
      if (t.isAllAs) totalAllAs++;
    }
  });

  const overallSchoolAverage = totalStudents > 0 ? Number((totalAverageSum / totalStudents).toFixed(1)) : 0;
  const overallSchoolPassRate = totalStudents > 0 ? Number(((totalPasses / totalStudents) * 100).toFixed(1)) : 0;

  // Grade 1-13 Averages for Chart
  const gradeLevels: GradeLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const gradeAverages = gradeLevels.map((g) => {
    const gradeStudents = students.filter((s) => s.grade === g);
    if (gradeStudents.length === 0) return 0;
    const sum = gradeStudents.reduce((acc, s) => acc + (s.terms[selectedTerm]?.average || 0), 0);
    return Number((sum / gradeStudents.length).toFixed(1));
  });

  const gradePassRates = gradeLevels.map((g) => {
    const gradeStudents = students.filter((s) => s.grade === g);
    if (gradeStudents.length === 0) return 0;
    const passes = gradeStudents.filter((s) => s.terms[selectedTerm]?.passedAll).length;
    return Number(((passes / gradeStudents.length) * 100).toFixed(1));
  });

  const gradeChartData = {
    labels: gradeLevels.map((g) => `Grade ${g}`),
    datasets: [
      {
        label: 'Term Average (%)',
        data: gradeAverages,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Pass Rate (%)',
        data: gradePassRates,
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: 'rgb(5, 150, 105)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const gradeChartOptions = {
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

  // Top Achievers across the school
  const topAchievers = [...students]
    .sort((a, b) => (b.terms[selectedTerm]?.average || 0) - (a.terms[selectedTerm]?.average || 0))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* Account Approvals Notice for Admin */}
      {currentRole === 'admin' && pendingUsers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Account Registrations Pending Review ({pendingUsers.length})
                </h3>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                New applicants have signed up and are waiting for role clearance in the Account Approvals panel.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('approvals')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <span>Review & Assign Roles</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Welcome & High Level Metrics Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                National Sri Lankan Curriculum · Grades 1 to 13
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-500">Academic Year 2026</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              School Academic Performance & Executive Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Real-time monitoring across 39 classes (Grades 1–13, Divisions A, B, C), automated A/B/C/S/W grading, faculty assignments, and term evaluation analytics.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {currentRole === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors border ${
                  !isCustomPasswordSet
                    ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 animate-pulse'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-xs'
                }`}
                title="Update your administrator password in settings"
              >
                <Key className="w-3.5 h-3.5 text-indigo-500" />
                <span>Password Settings</span>
                {!isCustomPasswordSet && (
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab('batch_entry')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <span>Batch Mark Entry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <span>Deep Class Analytics</span>
            </button>
          </div>
        </div>

        {/* High-level School KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Students</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalStudents}
            </div>
            <span className="text-[11px] text-slate-400">39 Class Divisions</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">School Average</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
              {overallSchoolAverage}%
            </div>
            <span className="text-[11px] text-slate-400">Term {selectedTerm} Standard</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Overall Pass Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {overallSchoolPassRate}%
            </div>
            <span className="text-[11px] text-slate-400">Passing all subjects (≥35)</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">All 'A' Achievers</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {totalAllAs}
            </div>
            <span className="text-[11px] text-slate-400">Potential 9A / Top Tier</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Academic Staff</span>
              <BookOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {teachers.length}
            </div>
            <span className="text-[11px] text-slate-400">{subjects.length} Registered Subjects</span>
          </div>
        </div>

        {/* Real-time Cloud Broadcast Telemetry Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Live Cloud Synchronization Active
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              Admin enrollments, mark changes, and role approvals dynamically broadcast in real time across all devices.
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Dual-Engine: Firestore + PostgreSQL 16</span>
          </div>
        </div>
      </div>

      {/* In-App Admin Password Settings Module (Admin Dashboard) */}
      {currentRole === 'admin' && (
        <AdminPasswordSettingsCard defaultExpanded={!isCustomPasswordSet} />
      )}

      {/* Grade-by-Grade Progression Spectrum (Grades 1 to 13) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              Comprehensive Grade-by-Grade Academic Spectrum (Grades 1–13)
            </h2>
            <p className="text-xs text-slate-500">
              Average academic performance vs. overall pass rates across the primary, secondary, and collegiate divisions
            </p>
          </div>
        </div>
        <div className="h-72">
          <Bar data={gradeChartData} options={gradeChartOptions} />
        </div>
      </div>

      {/* Honor Roll: Top Achievers & Quick Class Jump Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Academic Achievers Honor Roll */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Academic Distinction Honor Roll
              </h2>
              <p className="text-xs text-slate-500">
                Top performing students across all grades in Term {selectedTerm}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topAchievers.map((st, idx) => {
              const t = st.terms[selectedTerm];
              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudentId(st.id)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold font-mono text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {st.fullName}
                        </span>
                        {t?.isAllAs && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Distinction
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span className="font-mono">{st.indexNumber}</span>
                        <span>·</span>
                        <span>Grade {st.grade}-{st.division}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                      {t?.average}%
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {t?.gradeCounts.A} Distinctions
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Class Navigator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Quick Grade & Class Jump
            </h2>
            <p className="text-xs text-slate-500">
              Jump directly to any class roster, mark sheet, or division analysis
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[10, 11, 12, 13, 9, 8, 7, 5].map((g) => {
              return (
                <div
                  key={g}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                >
                  <span className="font-bold text-slate-900 dark:text-white block mb-1.5">
                    Grade {g}
                  </span>
                  <div className="flex items-center gap-1">
                    {(['A', 'B', 'C'] as Division[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setSelectedGrade(g as GradeLevel);
                          setSelectedDivision(d);
                          setActiveTab('analytics');
                        }}
                        className="px-2 py-1 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-colors text-[11px] font-semibold border border-slate-200 dark:border-slate-600"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-indigo-700 dark:text-indigo-400 block mb-0.5">
              Sri Lankan Curriculum Architecture Note:
            </span>
            Grades 10–11 prepare students for the National G.C.E. Ordinary Level examination across the 9 standard subjects. Grades 12–13 represent the Collegiate Advanced Level streams.
          </div>
        </div>

      </div>

    </div>
  );
};
