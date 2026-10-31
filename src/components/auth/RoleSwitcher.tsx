import React, { useState, useRef, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import { UserRole } from '../../types/lms';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  ChevronDown,
  Lock,
  LogOut,
  Check,
  Key,
  Settings,
  UserCheck,
} from 'lucide-react';
import { AdminLoginModal } from './AdminLoginModal';
import { TeacherLoginModal } from './TeacherLoginModal';

export const RoleSwitcher: React.FC = () => {
  const {
    currentRole,
    isAdminAuthenticated,
    currentTeacher,
    currentUser,
    switchRole,
    logoutAdmin,
    logoutTeacher,
    logoutUser,
    setActiveTab,
  } = useLMS();

  const [isOpen, setIsOpen] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (role: UserRole) => {
    setIsOpen(false);

    if (role === 'admin') {
      if (!isAdminAuthenticated) {
        setShowAdminLoginModal(true);
      } else {
        switchRole('admin');
      }
    } else if (role === 'teacher') {
      if (!currentTeacher) {
        setShowTeacherLoginModal(true);
      } else {
        switchRole('teacher');
      }
    } else if (role === 'student') {
      switchRole('student');
    } else {
      switchRole('parent');
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button with Active Role Badge */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            currentRole === 'admin'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
              : currentRole === 'teacher'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : currentRole === 'student'
              ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
              : 'bg-amber-50/80 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}
        >
          {currentRole === 'admin' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          ) : currentRole === 'teacher' ? (
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : currentRole === 'student' ? (
            <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          )}

          <div className="flex flex-col text-left leading-none">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Active Portal
            </span>
            <span className="font-bold truncate max-w-[130px] sm:max-w-[160px]">
              {currentRole === 'admin'
                ? 'Administrator'
                : currentRole === 'teacher'
                ? currentTeacher ? currentTeacher.fullName.split(' ')[0] + ' ' + (currentTeacher.fullName.split(' ')[1] || '') : 'Teacher Portal'
                : currentRole === 'student'
                ? currentUser ? currentUser.name.split(' ')[0] : 'Student Portal'
                : 'Parent Portal'}
            </span>
          </div>

          <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select 3-Tier Access Role
            </div>

            {/* Option 1: Administrator */}
            <div className="p-1">
              <button
                onClick={() => handleSelectRole('admin')}
                className={`w-full text-left p-2.5 rounded-lg text-xs flex items-start gap-2.5 transition-colors ${
                  currentRole === 'admin'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Administrator</span>
                    {currentRole === 'admin' && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Master Password Protected · All Classes 1–13, Faculty & Full Analytics
                  </span>
                  {!isAdminAuthenticated && (
                    <span className="text-[10px] text-amber-600 font-semibold block mt-1">
                      (Requires master password verification)
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Option 2: Teacher Portal */}
            <div className="p-1">
              <button
                onClick={() => handleSelectRole('teacher')}
                className={`w-full text-left p-2.5 rounded-lg text-xs flex items-start gap-2.5 transition-colors ${
                  currentRole === 'teacher'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Teacher Portal</span>
                    {currentRole === 'teacher' && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {currentTeacher
                      ? `Logged as ${currentTeacher.fullName} (${currentTeacher.employeeId})`
                      : 'Subject-Restricted Access · Teacher ID Login'}
                  </span>
                </div>
              </button>
            </div>

            {/* Option 3: Student Portal */}
            <div className="p-1">
              <button
                onClick={() => handleSelectRole('student')}
                className={`w-full text-left p-2.5 rounded-lg text-xs flex items-start gap-2.5 transition-colors ${
                  currentRole === 'student'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Student Portal</span>
                    {currentRole === 'student' && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {currentUser?.assignedRole === 'student' && currentUser.indexNumber
                      ? `Index: ${currentUser.indexNumber} · Term Results & Performance`
                      : 'Authorized Student Academic Progress View'}
                  </span>
                </div>
              </button>
            </div>

            {/* Option 4: Parent Portal */}
            <div className="p-1">
              <button
                onClick={() => handleSelectRole('parent')}
                className={`w-full text-left p-2.5 rounded-lg text-xs flex items-start gap-2.5 transition-colors ${
                  currentRole === 'parent'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Parent Results Portal</span>
                    {currentRole === 'parent' && (
                      <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    No login required · Lookup child results by Index Number
                  </span>
                </div>
              </button>
            </div>

            {/* Logout/Re-authenticate Action bar */}
            <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800 px-3 py-1.5 flex flex-col gap-1 text-xs">
              {currentRole === 'admin' && isAdminAuthenticated && (
                <div className="flex items-center justify-between w-full gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setIsOpen(false);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Password / Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      logoutAdmin();
                      setIsOpen(false);
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 shrink-0"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Lock Session</span>
                  </button>
                </div>
              )}

              {currentRole === 'teacher' && currentTeacher && (
                <button
                  onClick={() => {
                    logoutTeacher();
                    setShowTeacherLoginModal(true);
                    setIsOpen(false);
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Switch Faculty Account</span>
                </button>
              )}

              <button
                onClick={() => {
                  logoutUser();
                  setIsOpen(false);
                }}
                className="w-full text-left pt-1 mt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-red-600 hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Exit to Unified Signup & Login Portal</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <AdminLoginModal
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={() => switchRole('admin')}
        />
      )}

      {/* Teacher Login Modal */}
      {showTeacherLoginModal && (
        <TeacherLoginModal
          onClose={() => setShowTeacherLoginModal(false)}
          onSuccess={() => switchRole('teacher')}
        />
      )}
    </>
  );
};
