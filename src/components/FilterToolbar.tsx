import React from 'react';
import { useLMS } from '../context/LMSContext';
import { GradeLevel, Division, TermNumber } from '../types/lms';
import { Search, Filter, Layers, Calendar } from 'lucide-react';

export const FilterToolbar: React.FC = () => {
  const {
    selectedGrade,
    selectedDivision,
    selectedTerm,
    setSelectedGrade,
    setSelectedDivision,
    setSelectedTerm,
    searchQuery,
    setSearchQuery,
    currentClassStats,
  } = useLMS();

  // Helper to categorize Sri Lankan educational stages
  const getStageName = (grade: GradeLevel): string => {
    if (grade <= 5) return 'Primary (Grades 1–5)';
    if (grade <= 9) return 'Junior Secondary (Grades 6–9)';
    if (grade <= 11) return 'G.C.E. O/L (Grades 10–11)';
    return 'G.C.E. A/L (Grades 12–13)';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Controls: Grade, Division, Term */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Grade Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="grade-select" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Grade</span>
              </label>
              <select
                id="grade-select"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <optgroup label="Primary (Grades 1-5)">
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </optgroup>
                <optgroup label="Junior Secondary (Grades 6-9)">
                  {[6, 7, 8, 9].map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </optgroup>
                <optgroup label="Senior Secondary - G.C.E. O/L (Grades 10-11)">
                  {[10, 11].map((g) => (
                    <option key={g} value={g}>Grade {g} (O/L)</option>
                  ))}
                </optgroup>
                <optgroup label="Collegiate - G.C.E. A/L (Grades 12-13)">
                  {[12, 13].map((g) => (
                    <option key={g} value={g}>Grade {g} (A/L)</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Division Selector (A, B, C) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">Class:</span>
              {(['A', 'B', 'C'] as Division[]).map((div) => (
                <button
                  key={div}
                  onClick={() => setSelectedDivision(div)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedDivision === div
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Div {div}
                </button>
              ))}
            </div>

            {/* Term Selector (Term 1, Term 2, Term 3) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
              {([1, 2, 3] as TermNumber[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTerm(t)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedTerm === t
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Term {t}
                </button>
              ))}
            </div>

            {/* Quick Context Chip */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Grade {selectedGrade}-{selectedDivision}
              </span>
              <span>·</span>
              <span>{getStageName(selectedGrade)}</span>
              <span>·</span>
              <span className="tabular-nums font-mono">{currentClassStats.totalStudents} Students</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search student or index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
