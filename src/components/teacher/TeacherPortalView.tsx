import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { GradeLevel, Division, TermNumber, TeacherAssignment } from '../../types/lms';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { TeacherLoginModal } from '../auth/TeacherLoginModal';

export const TeacherPortalView: React.FC = () => {
  const {
    currentTeacher,
    subjects,
    selectedGrade,
    selectedDivision,
    selectedTerm,
    setSelectedGrade,
    setSelectedDivision,
    setSelectedTerm,
    setActiveTab,
    markSubmissions,
    submitMarksForReview,
    getSubmissionStatus,
    instantSaveMode,
    setInstantSaveMode,
    logoutTeacher,
  } = useLMS();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!currentTeacher) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center max-w-xl mx-auto shadow-xs my-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mx-auto mb-3">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Academic Faculty Authentication Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Please log in with your Assigned Teacher Employee ID (e.g. EMP-4011) to access your authorized subjects, grade rosters, and mark entry sheets.
        </p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-2"
        >
          <span>Authenticate Teacher ID</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {showLoginModal && (
          <TeacherLoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  // Handle Submission for Admin Review
  const handleSubmitSubjectForReview = (asgn: TeacherAssignment) => {
    const div = asgn.division === 'all' ? selectedDivision : asgn.division;
    submitMarksForReview(asgn.subjectId, asgn.grade, div, selectedTerm, submissionNotes);
    setSuccessMessage(`Marks for ${asgn.subjectId} (Grade ${asgn.grade}-${div}) submitted for Administrator verification!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleOpenMarkEntry = (asgn: TeacherAssignment) => {
    setSelectedGrade(asgn.grade);
    if (asgn.division !== 'all') {
      setSelectedDivision(asgn.division);
    }
    setActiveTab('batch_entry');
  };

  return (
    <div className="space-y-6">
      
      {/* Teacher Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-base flex items-center justify-center shrink-0">
              {currentTeacher.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentTeacher.fullName}
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                  {currentTeacher.employeeId}
                </span>
                {currentTeacher.isClassTeacherOf && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Class Teacher: Grade {currentTeacher.isClassTeacherOf.grade}-{currentTeacher.isClassTeacherOf.division}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {currentTeacher.qualification} · {currentTeacher.email} · {currentTeacher.phone}
              </p>
            </div>
          </div>

          {/* Quick Instant Save Mode Toggle & Action */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-3 text-xs">
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  {instantSaveMode ? 'Instant-Save Mode (Live)' : 'Admin Review Workflow'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {instantSaveMode ? 'Changes commit directly to results' : 'Requires admin review & sign-off'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInstantSaveMode(!instantSaveMode)}
                className="text-emerald-600 hover:text-emerald-700 transition-colors"
                title="Toggle Instant-Save vs Submit for Review"
              >
                {instantSaveMode ? (
                  <ToggleRight className="w-7 h-7" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400" />
                )}
              </button>
            </div>

            <button
              onClick={() => setActiveTab('batch_entry')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Enter Subject Marks</span>
            </button>
          </div>
        </div>

        {/* Permission Rules Disclaimer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>RBAC Security Notice:</strong> You are authorized to enter and edit marks <em>only</em> for the {currentTeacher.assignments.length} assigned subject classes listed below. Other teachers' subject columns and student personal identities are locked to prevent unauthorized changes.
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Assigned Subjects & Submission Status Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              My Assigned Subject Classes & Review Submissions (Term {selectedTerm})
            </h2>
            <p className="text-xs text-slate-500">
              Select any assigned class to open mark entry or submit for administrative verification
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <span className="text-slate-500 px-1 font-semibold text-[11px]">Term:</span>
            {([1, 2, 3] as TermNumber[]).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTerm(t)}
                className={`px-2.5 py-0.5 rounded font-bold transition-all ${
                  selectedTerm === t
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                T{t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentTeacher.assignments.map((asgn) => {
            const subject = subjects.find((s) => s.id === asgn.subjectId);
            const div = asgn.division === 'all' ? selectedDivision : asgn.division;
            const status = getSubmissionStatus(asgn.subjectId, asgn.grade, div, selectedTerm);

            return (
              <div
                key={asgn.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {subject?.code || 'SUB'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                        {subject?.name || asgn.subjectId}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : status === 'submitted'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {status === 'approved' ? '✓ Approved' : status === 'submitted' ? '⏳ Under Review' : 'Draft'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-4">
                    <div>
                      Class Allocation:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        Grade {asgn.grade}{asgn.division === 'all' ? ' (All Divisions A, B, C)' : `-${asgn.division}`}
                      </strong>
                    </div>
                    <div>
                      Evaluation:{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Term {selectedTerm} Examination
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenMarkEntry(asgn)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-600 transition-colors flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Enter Marks</span>
                  </button>

                  <button
                    onClick={() => handleSubmitSubjectForReview(asgn)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{instantSaveMode ? 'Instant Save' : 'Submit for Review'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
