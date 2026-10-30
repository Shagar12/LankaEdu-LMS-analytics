import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Student } from '../../types/lms';
import {
  Search,
  Award,
  Eye,
  FileText,
  UserPlus,
  AlertCircle,
  TrendingUp,
  Edit2,
} from 'lucide-react';
import { EditStudentModal } from './EditStudentModal';

interface StudentListViewProps {
  onOpenAddStudent: () => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({ onOpenAddStudent }) => {
  const {
    students,
    selectedGrade,
    selectedDivision,
    selectedTerm,
    searchQuery,
    setSearchQuery,
    setSelectedStudentId,
    setActiveTab,
    currentRole,
  } = useLMS();

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Filter students based on current grade, division, and search query
  const filteredStudents = students.filter((s) => {
    const matchesGrade = s.grade === selectedGrade;
    const matchesDivision = s.division === selectedDivision;
    const query = searchQuery.trim().toLowerCase();

    if (!query) return matchesGrade && matchesDivision;

    const matchesQuery =
      s.fullName.toLowerCase().includes(query) ||
      s.indexNumber.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query);

    return matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Title & Stats Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Grade {selectedGrade}-{selectedDivision} Roster
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-500">
                Evaluation Term {selectedTerm}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Student Directory & Performance Profiles
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse student academic portfolios, automated letter grade counts, class rankings, and printable report cards
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('batch_entry')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Batch Enter Marks
            </button>
            {currentRole === 'admin' && (
              <button
                onClick={onOpenAddStudent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 rounded-lg shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Enroll Student</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Enrolled Students ({filteredStudents.length})
            </span>
            {searchQuery && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Filtering by: "{searchQuery}"
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">
            Click on any student row to view visual charts & report cards
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No students found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or select another grade / division in the filter bar.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear Search Query
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Student Name & ID</th>
                  <th className="py-3 px-3 font-semibold">Index Number</th>
                  <th className="py-3 px-3 font-semibold">Medium</th>
                  <th className="py-3 px-3 font-semibold text-right">Attendance</th>
                  <th className="py-3 px-3 font-semibold text-right">Total Marks</th>
                  <th className="py-3 px-3 font-semibold text-right">Average %</th>
                  <th className="py-3 px-4 font-semibold text-center">Sri Lankan Grade Breakdown</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((st) => {
                  const t = st.terms[selectedTerm];
                  return (
                    <tr
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold">
                        {t?.rankInClass === 1 ? (
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 inline-flex items-center justify-center text-[10px]">
                            1
                          </span>
                        ) : (
                          <span className="text-slate-400">#{t?.rankInClass || '-'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{st.fullName}</span>
                          {t?.isAllAs && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                              All A
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {st.id} · Gr.{st.grade}-{st.division}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                        {st.indexNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {st.medium}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {st.attendanceRate}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {t?.totalMarks || 0}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                        {t?.average || 0}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold font-mono text-[11px]">
                            {t?.gradeCounts.A || 0}A
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold font-mono text-[11px]">
                            {t?.gradeCounts.B || 0}B
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-bold font-mono text-[11px]">
                            {t?.gradeCounts.C || 0}C
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold font-mono text-[11px]">
                            {t?.gradeCounts.S || 0}S
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-bold font-mono text-[11px]">
                            {t?.gradeCounts.W || 0}W
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {currentRole === 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStudent(st);
                              }}
                              title="Edit Student Name & Details"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentId(st.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Profile</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Details Modal */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
        />
      )}

    </div>
  );
};
