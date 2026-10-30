import React from 'react';
import { useLMS } from '../context/LMSContext';
import { GraduationCap, Sun, Moon, Plus, BookOpen, Search, Settings } from 'lucide-react';
import { RoleSwitcher } from './auth/RoleSwitcher';

interface HeaderProps {
  onOpenAddStudent: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddStudent }) => {
  const { activeTab, setActiveTab, theme, toggleTheme, currentRole, isAdminAuthenticated } = useLMS();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 lg:gap-8 h-16">
          
          {/* Zone 1: Single wordmark brand */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                LankaEdu LMS
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                Sri Lankan Curriculum Analytics
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation tabs tailored to Active RBAC Role */}
          <nav className="hidden lg:flex items-center gap-1 sm:gap-1.5 text-sm font-medium">
            {currentRole === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'overview'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  School Overview
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'analytics'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Class Analytics
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'students'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Student Profiles
                </button>
                <button
                  onClick={() => setActiveTab('batch_entry')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'batch_entry'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Batch Mark Entry
                </button>
                <button
                  onClick={() => setActiveTab('teachers_subjects')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'teachers_subjects'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Faculty & Subjects
                </button>
                <button
                  onClick={() => setActiveTab('data_management')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'data_management'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  CSV Exchange
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === 'settings'
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
              </>
            )}

            {currentRole === 'teacher' && (
              <>
                <button
                  onClick={() => setActiveTab('teachers_subjects')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'teachers_subjects'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Teacher Portal Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('batch_entry')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'batch_entry'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Subject Mark Entry
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'analytics'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Class Analytics
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'students'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Student Roster (Read-Only)
                </button>
              </>
            )}

            {currentRole === 'parent' && (
              <>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'students'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Parent Results Lookup
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'overview'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  School Benchmarks
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Role Switcher & Action controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* RBAC Role Switcher Dropdown */}
            <RoleSwitcher />

            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark Mode"
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Admin Settings Quick Shortcut */}
            {currentRole === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                title="Administrator Security & Password Settings"
                aria-label="Admin Settings & Password"
                className={`p-2 rounded-lg transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Primary Action Button: Role-aware */}
            {currentRole === 'admin' ? (
              <button
                onClick={onOpenAddStudent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Enroll Student</span>
                <span className="sm:hidden">Enroll</span>
              </button>
            ) : currentRole === 'teacher' ? (
              <button
                onClick={() => setActiveTab('batch_entry')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4" />
                <span>Enter Marks</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('students')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search Index</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800">
          {currentRole === 'admin' && (
            (
              [
                { key: 'overview', label: 'Overview' },
                { key: 'analytics', label: 'Analytics' },
                { key: 'students', label: 'Students' },
                { key: 'batch_entry', label: 'Mark Entry' },
                { key: 'teachers_subjects', label: 'Staff & Subjects' },
                { key: 'data_management', label: 'CSV' },
                { key: 'settings', label: 'Settings' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium ${
                  activeTab === t.key
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))
          )}

          {currentRole === 'teacher' && (
            (
              [
                { key: 'teachers_subjects', label: 'Portal' },
                { key: 'batch_entry', label: 'Enter Marks' },
                { key: 'analytics', label: 'Analytics' },
                { key: 'students', label: 'Roster' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium ${
                  activeTab === t.key
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))
          )}

          {currentRole === 'parent' && (
            (
              [
                { key: 'students', label: 'Results Lookup' },
                { key: 'overview', label: 'School Benchmarks' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium ${
                  activeTab === t.key
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))
          )}
        </div>
      </div>
    </header>
  );
};
