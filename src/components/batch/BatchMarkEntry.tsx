import React, { useState, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import { SRI_LANKAN_GRADE_RULES, getGradeFromMark } from '../../utils/grading';
import {
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  UserCheck,
  Lock,
  Unlock,
  Send,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
} from 'lucide-react';

export const BatchMarkEntry: React.FC = () => {
  const {
    students,
    selectedGrade,
    selectedDivision,
    selectedTerm,
    currentSubjects,
    batchUpdateClassMarks,
    getTeacherForSubject,
    currentClassTeacher,
    currentRole,
    currentTeacher,
    isAdminAuthenticated,
    isSubjectEditableByCurrentRole,
    instantSaveMode,
    setInstantSaveMode,
    submitMarksForReview,
    getSubmissionStatus,
    approveMarksSubmission,
    markSubmissions,
  } = useLMS();

  // Local state for mark grid: studentId -> subjectId -> number
  const [localMarks, setLocalMarks] = useState<Record<string, Record<string, number>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string>('');

  // Filter students for currently selected Grade & Division
  const classStudents = students.filter(
    (s) => s.grade === selectedGrade && s.division === selectedDivision
  );

  // Sync local marks when grade/division/term changes or students update
  useEffect(() => {
    const initial: Record<string, Record<string, number>> = {};
    classStudents.forEach((s) => {
      initial[s.id] = { ...(s.terms[selectedTerm]?.marks || {}) };
    });
    setLocalMarks(initial);
    setHasChanges(false);
    setSaveSuccess(false);
  }, [selectedGrade, selectedDivision, selectedTerm, students]);

  // Handle individual mark change
  const handleMarkChange = (studentId: string, subjectId: string, valueStr: string) => {
    // RBAC validation guard
    if (!isSubjectEditableByCurrentRole(subjectId, selectedGrade, selectedDivision)) {
      return;
    }

    const num = valueStr === '' ? 0 : parseInt(valueStr, 10);
    const clamped = isNaN(num) ? 0 : Math.min(100, Math.max(0, num));

    setLocalMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: clamped,
      },
    }));
    setHasChanges(true);
    setSaveSuccess(false);

    // If instant-save mode is toggled on, auto-save to global state
    if (instantSaveMode) {
      batchUpdateClassMarks(selectedTerm, {
        [studentId]: {
          ...(localMarks[studentId] || {}),
          [subjectId]: clamped,
        },
      });
    }
  };

  // Save changes
  const handleSave = () => {
    batchUpdateClassMarks(selectedTerm, localMarks);
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Reset to original
  const handleReset = () => {
    const initial: Record<string, Record<string, number>> = {};
    classStudents.forEach((s) => {
      initial[s.id] = { ...(s.terms[selectedTerm]?.marks || {}) };
    });
    setLocalMarks(initial);
    setHasChanges(false);
  };

  // Teacher submits their assigned subjects for admin review
  const handleSubmitForReview = () => {
    // Save any pending local marks first
    batchUpdateClassMarks(selectedTerm, localMarks);
    setHasChanges(false);

    if (currentRole === 'teacher' && currentTeacher) {
      // Find subjects this teacher teaches in this class
      const teacherSubjects = currentSubjects.filter((sub) =>
        isSubjectEditableByCurrentRole(sub.id, selectedGrade, selectedDivision)
      );

      teacherSubjects.forEach((sub) => {
        submitMarksForReview(
          sub.id,
          selectedGrade,
          selectedDivision,
          selectedTerm,
          instantSaveMode
            ? 'Direct instant entry by faculty instructor'
            : 'Submitted for administrative approval & verification'
        );
      });

      setSubmissionFeedback(
        instantSaveMode
          ? 'Marks saved and certified successfully!'
          : `Marks for ${teacherSubjects.map((s) => s.shortName).join(', ')} submitted for Administrator Review!`
      );
      setTimeout(() => setSubmissionFeedback(''), 4500);
    }
  };

  // Prefill realistic benchmark marks (Admin only)
  const handlePrefillBenchmark = () => {
    if (currentRole !== 'admin') return;
    const updated: Record<string, Record<string, number>> = {};
    classStudents.forEach((s, idx) => {
      updated[s.id] = {};
      currentSubjects.forEach((sub, sIdx) => {
        const mark = Math.min(98, Math.max(35, 55 + ((idx * 7 + sIdx * 11) % 42)));
        updated[s.id][sub.id] = mark;
      });
    });
    setLocalMarks(updated);
    setHasChanges(true);
  };

  // Check pending admin submissions for this class
  const pendingSubmissionsForThisClass = markSubmissions.filter(
    (m) =>
      m.grade === selectedGrade &&
      m.division === selectedDivision &&
      m.term === selectedTerm &&
      m.status === 'submitted'
  );

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Grade {selectedGrade}-{selectedDivision}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-500">
                Term {selectedTerm} Examination Marks
              </span>
              <span className="text-xs text-slate-400">·</span>
              
              {/* RBAC Role Indicator */}
              {currentRole === 'admin' ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Authority (All Subjects Unlocked)</span>
                </span>
              ) : currentRole === 'teacher' ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Teacher Access: {currentTeacher?.fullName} (Assigned Subjects Only)</span>
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Parent Mode: Read-Only
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Batch Mark Entry & Auto-Grading Console
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentRole === 'teacher'
                ? `You can enter and update marks for your assigned subjects in Grade ${selectedGrade}-${selectedDivision}. Other subjects are locked.`
                : 'Spreadsheet-style bulk mark entry with live calculation of Total Marks, Average %, and Sri Lankan letter grades (A, B, C, S, W)'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Teacher Review vs Instant-Save Mode Toggle */}
            {currentRole === 'teacher' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {instantSaveMode ? 'Instant-Save' : 'Admin Review Mode'}
                </span>
                <button
                  type="button"
                  onClick={() => setInstantSaveMode(!instantSaveMode)}
                  className="text-emerald-600 hover:text-emerald-700"
                  title="Toggle Instant-Save vs Submit for Review"
                >
                  {instantSaveMode ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>
            )}

            {/* Admin Benchmark Prefill */}
            {currentRole === 'admin' && (
              <button
                onClick={handlePrefillBenchmark}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Benchmark Prefill</span>
              </button>
            )}

            {/* Revert Changes */}
            {hasChanges && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revert Changes</span>
              </button>
            )}

            {/* Teacher Submit for Review Button */}
            {currentRole === 'teacher' ? (
              <button
                onClick={handleSubmitForReview}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{instantSaveMode ? 'Save Marks' : 'Submit for Admin Review'}</span>
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 ${
                  hasChanges
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Batch Marks</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Feedback message */}
        {submissionFeedback && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{submissionFeedback}</span>
          </div>
        )}

        {/* Admin Review Action Banner if pending teacher submissions exist */}
        {currentRole === 'admin' && pendingSubmissionsForThisClass.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {pendingSubmissionsForThisClass.length} Faculty Submission(s) Awaiting Administrator Sign-Off:
                </span>
                <span className="text-amber-700 dark:text-amber-300 ml-1">
                  {pendingSubmissionsForThisClass.map((m) => `${m.teacherName} (${m.subjectId})`).join(', ')}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                pendingSubmissionsForThisClass.forEach((subm) => approveMarksSubmission(subm.id));
                alert('Marks for this class verified and certified by Administrator!');
              }}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded shadow-xs text-xs whitespace-nowrap shrink-0"
            >
              Approve All Submissions
            </button>
          </div>
        )}

        {/* Class Teacher Header Callout */}
        {currentClassTeacher && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <UserCheck className="w-4 h-4 text-indigo-500" />
            <span>Class Master/Mistress:</span>
            <span className="font-bold text-slate-900 dark:text-white">{currentClassTeacher.fullName}</span>
            <span className="text-slate-400">({currentClassTeacher.qualification})</span>
          </div>
        )}
      </div>

      {/* Spreadsheet Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-bold sticky left-0 bg-slate-50 dark:bg-slate-800 z-20 min-w-[180px] border-r border-slate-200 dark:border-slate-700">
                  Student Name & Index
                </th>

                {/* Subject Columns with Assigned Teacher Info & Locked/Unlocked Status */}
                {currentSubjects.map((sub) => {
                  const teacher = getTeacherForSubject(sub.id, selectedGrade, selectedDivision);
                  const isEditable = isSubjectEditableByCurrentRole(sub.id, selectedGrade, selectedDivision);
                  const submissionStatus = getSubmissionStatus(sub.id, selectedGrade, selectedDivision, selectedTerm);

                  return (
                    <th
                      key={sub.id}
                      className={`py-2 px-2.5 font-bold text-center min-w-[120px] border-r border-slate-200 dark:border-slate-700/60 transition-colors ${
                        isEditable
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'bg-slate-100/50 dark:bg-slate-800/40 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="truncate font-semibold">{sub.shortName}</span>
                        {isEditable ? (
                          <span title="Editable by you">
                            <Unlock className="w-3 h-3 text-emerald-600" />
                          </span>
                        ) : (
                          <span title={`Locked: Assigned to ${teacher?.fullName || 'another instructor'}`}>
                            <Lock className="w-3 h-3 text-slate-400" />
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-slate-400 font-normal truncate max-w-[120px] mt-0.5">
                        {teacher ? teacher.fullName.split(' ')[0] + ' ' + (teacher.fullName.split(' ')[1] || '') : 'Staff'}
                      </div>

                      {/* Status indicator */}
                      <div className="mt-1">
                        <span
                          className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded capitalize ${
                            submissionStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : submissionStatus === 'submitted'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {submissionStatus === 'approved' ? 'Approved' : submissionStatus === 'submitted' ? 'Review' : 'Draft'}
                        </span>
                      </div>
                    </th>
                  );
                })}

                <th className="py-3 px-3 font-bold text-right min-w-[80px] bg-indigo-50/40 dark:bg-indigo-950/20 border-r border-slate-200 dark:border-slate-700">
                  Total
                </th>
                <th className="py-3 px-3 font-bold text-right min-w-[80px] bg-indigo-50/40 dark:bg-indigo-950/20 border-r border-slate-200 dark:border-slate-700">
                  Avg %
                </th>
                <th className="py-3 px-4 font-bold text-center min-w-[120px]">
                  Grade Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classStudents.map((student) => {
                const sMarks = localMarks[student.id] || {};
                const markValues = currentSubjects.map((sub) => sMarks[sub.id] ?? 0);
                const total = markValues.reduce((sum, v) => sum + v, 0);
                const avg = currentSubjects.length > 0 ? Number((total / currentSubjects.length).toFixed(1)) : 0;

                // Grade counts
                const aCount = markValues.filter((m) => m >= 75).length;
                const wCount = markValues.filter((m) => m < 35).length;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Student Name Sticky Column (Protected from editing in mark sheet) */}
                    <td className="py-2.5 px-4 font-medium sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                        {student.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {student.indexNumber}
                      </div>
                    </td>

                    {/* Subject Mark Inputs with RBAC permission locks */}
                    {currentSubjects.map((sub) => {
                      const currentVal = sMarks[sub.id] ?? 0;
                      const gradeInfo = getGradeFromMark(currentVal);
                      const isInvalid = currentVal > 100 || currentVal < 0;
                      const isEditable = isSubjectEditableByCurrentRole(sub.id, selectedGrade, selectedDivision);

                      return (
                        <td
                          key={sub.id}
                          className={`p-1.5 border-r border-slate-100 dark:border-slate-800 text-center ${
                            isEditable ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : 'bg-slate-50/60 dark:bg-slate-800/20'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              disabled={!isEditable}
                              value={currentVal === 0 ? '' : currentVal}
                              placeholder="0"
                              onChange={(e) => handleMarkChange(student.id, sub.id, e.target.value)}
                              className={`w-14 text-center py-1 px-1 text-xs font-mono font-bold rounded border transition-colors ${
                                !isEditable
                                  ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 border-slate-200 dark:border-slate-700/50 cursor-not-allowed opacity-80'
                                  : isInvalid
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500'
                              }`}
                              title={
                                !isEditable
                                  ? 'Locked: You do not have teaching clearance for this subject'
                                  : `Edit mark (0-100) for ${sub.name}`
                              }
                            />
                            <span
                              className={`text-[10px] font-bold w-4 ${
                                gradeInfo.letter === 'A'
                                  ? 'text-emerald-600'
                                  : gradeInfo.letter === 'B'
                                  ? 'text-blue-600'
                                  : gradeInfo.letter === 'C'
                                  ? 'text-sky-600'
                                  : gradeInfo.letter === 'S'
                                  ? 'text-amber-600'
                                  : 'text-red-500'
                              }`}
                            >
                              {gradeInfo.letter}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Live Auto-calculated Total */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white bg-indigo-50/20 dark:bg-indigo-950/10 border-r border-slate-200 dark:border-slate-700">
                      {total}
                    </td>

                    {/* Live Auto-calculated Average */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-r border-slate-200 dark:border-slate-700">
                      {avg}%
                    </td>

                    {/* Live Grade Status Badge */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono">
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold">
                          {aCount}A
                        </span>
                        {wCount > 0 ? (
                          <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-bold">
                            {wCount}W
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-medium">
                            Passed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sri Lankan Grading Threshold Reference Strip */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <span className="font-bold text-slate-900 dark:text-white block mb-1">
          Automated Sri Lankan National Grading Scale:
        </span>
        <div className="flex flex-wrap gap-4">
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
            A (Distinction): 75–100%
          </span>
          <span className="text-blue-700 dark:text-blue-400 font-semibold">
            B (Very Good Pass): 65–74%
          </span>
          <span className="text-sky-700 dark:text-sky-400 font-semibold">
            C (Credit Pass): 55–64%
          </span>
          <span className="text-amber-700 dark:text-amber-400 font-semibold">
            S (Ordinary Pass): 35–54%
          </span>
          <span className="text-red-700 dark:text-red-400 font-semibold">
            W (Weak / Fail): 0–34%
          </span>
        </div>
      </div>

    </div>
  );
};
