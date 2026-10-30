import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Teacher } from '../../types/lms';
import { GraduationCap, Lock, X, Key, AlertCircle, User, ArrowRight, BookOpen } from 'lucide-react';

interface TeacherLoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({ onClose, onSuccess }) => {
  const { teachers, subjects, loginTeacher } = useLMS();

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('teacher123');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) return;

    setError('');
    const result = loginTeacher(employeeId, password);

    if (result.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(result.message);
    }
  };

  const handleSelectQuickTeacher = (teacher: Teacher) => {
    setEmployeeId(teacher.employeeId);
    setPassword('teacher123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Academic Teacher Portal Login
              </h3>
              <p className="text-[11px] text-slate-500">
                Subject-Restricted Assessment Clearance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-600 dark:text-slate-300">
            <div className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
              Tier 2: Subject-Restricted Permissions
            </div>
            <p className="text-[11px] leading-relaxed">
              Once authenticated, you will only have authorization to view and enter marks for the specific curriculum subjects and class divisions officially assigned to you. Student records and other subjects remain read-only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned Teacher Employee ID</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EMP-4011 or EMP-4012"
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Teacher Portal Password</span>
              </label>
              <input
                type="password"
                required
                placeholder="Enter password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-wider"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Default password for all staff: <strong className="font-mono">teacher123</strong>
              </span>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Authenticate & Enter Teacher Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Staff Accounts */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Select Demo Faculty Profile (One-Click Testing):
            </span>
            <div className="space-y-2">
              {teachers.slice(0, 4).map((teacher) => {
                const assignedSubjectNames = teacher.assignments
                  .map((a) => {
                    const sub = subjects.find((s) => s.id === a.subjectId);
                    return `${sub?.shortName || a.subjectId} (Gr.${a.grade}-${a.division})`;
                  })
                  .join(', ');

                return (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => handleSelectQuickTeacher(teacher)}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{teacher.fullName}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold">
                          {teacher.employeeId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        Subjects: {assignedSubjectNames || 'General'}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Select
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
