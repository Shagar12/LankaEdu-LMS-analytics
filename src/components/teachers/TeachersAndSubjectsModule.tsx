import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Teacher, SubjectConfig, GradeLevel, Division, TeacherAssignment } from '../../types/lms';
import {
  Users,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Mail,
  Phone,
  Briefcase,
  Check,
  X,
  Layers,
  Award,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export const TeachersAndSubjectsModule: React.FC = () => {
  const {
    teachers,
    subjects,
    selectedGrade,
    selectedDivision,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    assignTeacherToSubject,
    removeTeacherAssignment,
    addSubject,
    updateSubject,
    deleteSubject,
  } = useLMS();

  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'subjects' | 'matrix'>('teachers');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectConfig | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState<Teacher | null>(null);

  // Filtered teachers
  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.qualification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered subjects
  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete confirmations
  const handleDeleteTeacher = (teacher: Teacher) => {
    if (window.confirm(`Are you sure you want to remove teacher "${teacher.fullName}"?`)) {
      deleteTeacher(teacher.id);
    }
  };

  const handleDeleteSubject = (subject: SubjectConfig) => {
    if (window.confirm(`Are you sure you want to remove subject "${subject.name}"?`)) {
      deleteSubject(subject.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Teacher & Subject Management
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assign academic staff to subjects & grade divisions, manage curricula, and configure class teachers
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sub-tab pills */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <button
                onClick={() => setActiveSubTab('teachers')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'teachers'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Teachers ({teachers.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('subjects')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'subjects'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Curriculum Subjects ({subjects.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('matrix')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'matrix'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Allocation Matrix</span>
              </button>
            </div>

            {/* Action button */}
            {activeSubTab === 'teachers' && (
              <button
                onClick={() => {
                  setEditingTeacher(null);
                  setIsTeacherModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Teacher</span>
              </button>
            )}

            {activeSubTab === 'subjects' && (
              <button
                onClick={() => {
                  setEditingSubject(null);
                  setIsSubjectModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Filter / Search Input */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <input
            type="text"
            placeholder={activeSubTab === 'teachers' ? 'Search teacher by name, ID or qualification...' : 'Search subject by name or code...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Current Selected Class: <span className="font-semibold text-slate-800 dark:text-slate-200">Grade {selectedGrade}-{selectedDivision}</span>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: TEACHERS DIRECTORY */}
      {activeSubTab === 'teachers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => {
            return (
              <div
                key={teacher.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {teacher.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {teacher.fullName}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {teacher.employeeId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTeacher(teacher);
                          setIsTeacherModalOpen(true);
                        }}
                        title="Edit Teacher"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher)}
                        title="Delete Teacher"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Qualification */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {teacher.qualification}
                  </p>

                  {/* Class Teacher Badge if assigned */}
                  {teacher.isClassTeacherOf && (
                    <div className="mb-3 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      <Award className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Class Teacher: Grade {teacher.isClassTeacherOf.grade}-{teacher.isClassTeacherOf.division}</span>
                    </div>
                  )}

                  {/* Contact info */}
                  <div className="space-y-1 mb-4 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{teacher.phone}</span>
                    </div>
                  </div>

                  {/* Assigned Subjects & Grades */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Assigned Subject Classes ({teacher.assignments.length})
                      </span>
                      <button
                        onClick={() => {
                          setAssigningTeacher(teacher);
                          setIsAssignModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {teacher.assignments.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">No subject allocations yet</span>
                      ) : (
                        teacher.assignments.map((asgn) => {
                          const sub = subjects.find((s) => s.id === asgn.subjectId);
                          return (
                            <div
                              key={asgn.id}
                              className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded border border-slate-100 dark:border-slate-700/50"
                            >
                              <div className="truncate pr-2">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {sub?.shortName || asgn.subjectId}
                                </span>
                                <span className="text-slate-400 ml-1 text-[11px]">
                                  (Gr. {asgn.grade}{asgn.division === 'all' ? ' All' : `-${asgn.division}`})
                                </span>
                              </div>
                              <button
                                onClick={() => removeTeacherAssignment(teacher.id, asgn.id)}
                                title="Remove assignment"
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Workload:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {teacher.assignments.length} Curricular Units
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 2: CURRICULUM SUBJECTS */}
      {activeSubTab === 'subjects' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              National Curriculum Subject Registry
            </h2>
            <span className="text-xs text-slate-500">
              Total: {subjects.length} Subjects
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-semibold">Subject Code</th>
                  <th className="py-3 px-4 font-semibold">Official Subject Title</th>
                  <th className="py-3 px-3 font-semibold">Short Name</th>
                  <th className="py-3 px-3 font-semibold">Curriculum Category</th>
                  <th className="py-3 px-4 font-semibold">Applicable Grades</th>
                  <th className="py-3 px-4 font-semibold">Faculty / Lead Teachers</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSubjects.map((sub) => {
                  // Find teachers assigned to this subject
                  const assignedTeachers = teachers.filter((t) =>
                    t.assignments.some((a) => a.subjectId === sub.id)
                  );

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {sub.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {sub.name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {sub.shortName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {sub.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {sub.applicableGrades.map((g) => (
                            <span
                              key={g}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                g === selectedGrade
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              Gr.{g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {assignedTeachers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedTeachers.map((t) => (
                              <span
                                key={t.id}
                                className="inline-block text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-200"
                              >
                                {t.fullName.split(' ')[0]} {t.fullName.split(' ')[1] || ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingSubject(sub);
                              setIsSubjectModalOpen(true);
                            }}
                            title="Edit Subject"
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sub)}
                            title="Delete Subject"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CLASS TEACHER & STAFF ALLOCATION MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Class Teacher & Staff Allocation Matrix (Grades 1–13)
            </h2>
            <p className="text-xs text-slate-500">
              Overview of appointed class masters, mistresses, and assigned curriculum subject teachers for each division
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[10, 11, 12, 13, 9, 8, 7, 6, 5].map((grade) => {
              return (
                <div
                  key={grade}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 mb-3">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Grade {grade}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {grade <= 5 ? 'Primary' : grade <= 9 ? 'Junior' : grade <= 11 ? 'G.C.E. O/L' : 'G.C.E. A/L'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(['A', 'B', 'C'] as Division[]).map((div) => {
                      const classTeacher = teachers.find(
                        (t) => t.isClassTeacherOf?.grade === grade && t.isClassTeacherOf?.division === div
                      );
                      const isCurrent = selectedGrade === grade && selectedDivision === div;

                      return (
                        <div
                          key={div}
                          className={`p-2.5 rounded-md border text-xs ${
                            isCurrent
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 dark:text-white">
                              Division {div}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-indigo-600 text-white rounded">
                                Active Filter
                              </span>
                            )}
                          </div>

                          <div className="text-[11px]">
                            <span className="text-slate-400">Class Teacher:</span>{' '}
                            {classTeacher ? (
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {classTeacher.fullName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Vacant appointment</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT TEACHER */}
      {isTeacherModalOpen && (
        <TeacherModal
          teacher={editingTeacher}
          onClose={() => setIsTeacherModalOpen(false)}
        />
      )}

      {/* MODAL 2: ADD / EDIT SUBJECT */}
      {isSubjectModalOpen && (
        <SubjectModal
          subject={editingSubject}
          onClose={() => setIsSubjectModalOpen(false)}
        />
      )}

      {/* MODAL 3: ASSIGN TEACHER TO SUBJECT & GRADE */}
      {isAssignModalOpen && assigningTeacher && (
        <AssignTeacherModal
          teacher={assigningTeacher}
          onClose={() => setIsAssignModalOpen(false)}
        />
      )}
    </div>
  );
};

/* --- SUB-COMPONENTS: MODALS --- */

interface TeacherModalProps {
  teacher: Teacher | null;
  onClose: () => void;
}

const TeacherModal: React.FC<TeacherModalProps> = ({ teacher, onClose }) => {
  const { addTeacher, updateTeacher } = useLMS();

  const [fullName, setFullName] = useState(teacher?.fullName || '');
  const [email, setEmail] = useState(teacher?.email || '');
  const [phone, setPhone] = useState(teacher?.phone || '');
  const [qualification, setQualification] = useState(teacher?.qualification || '');

  // Class teacher assignment
  const [isClassTeacher, setIsClassTeacher] = useState(Boolean(teacher?.isClassTeacherOf));
  const [classGrade, setClassGrade] = useState<GradeLevel>(teacher?.isClassTeacherOf?.grade || 10);
  const [classDivision, setClassDivision] = useState<Division>(teacher?.isClassTeacherOf?.division || 'A');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const classTeacherObj = isClassTeacher ? { grade: classGrade, division: classDivision } : undefined;

    if (teacher) {
      updateTeacher(teacher.id, {
        fullName,
        email,
        phone,
        qualification,
        isClassTeacherOf: classTeacherObj,
      });
    } else {
      addTeacher({
        fullName,
        email,
        phone,
        qualification,
        isClassTeacherOf: classTeacherObj,
        assignments: [],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {teacher ? 'Edit Academic Staff Profile' : 'Add New Academic Teacher'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name (with Title) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mrs. Pushpa Kumarihamy"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="teacher@school.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Contact
              </label>
              <input
                type="text"
                placeholder="+94 77 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Academic & Teaching Qualifications
            </label>
            <input
              type="text"
              placeholder="e.g. B.Sc. (Hons) University of Colombo, PGDE (NIE)"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Class Teacher Allocation */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={isClassTeacher}
                onChange={(e) => setIsClassTeacher(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Designate as Appointed Class Teacher
              </span>
            </label>

            {isClassTeacher && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Class Grade</label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Division</label>
                  <select
                    value={classDivision}
                    onChange={(e) => setClassDivision(e.target.value as Division)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {teacher ? 'Update Teacher' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SubjectModalProps {
  subject: SubjectConfig | null;
  onClose: () => void;
}

const SubjectModal: React.FC<SubjectModalProps> = ({ subject, onClose }) => {
  const { addSubject, updateSubject } = useLMS();

  const [name, setName] = useState(subject?.name || '');
  const [shortName, setShortName] = useState(subject?.shortName || '');
  const [code, setCode] = useState(subject?.code || '');
  const [category, setCategory] = useState<'core' | 'basket' | 'al_stream'>(subject?.category || 'core');
  const [applicableGrades, setApplicableGrades] = useState<number[]>(
    subject?.applicableGrades || [10, 11]
  );

  const toggleGrade = (g: number) => {
    setApplicableGrades((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g].sort((a, b) => a - b)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim() || applicableGrades.length === 0) return;

    if (subject) {
      updateSubject(subject.id, {
        name,
        shortName,
        code,
        category,
        applicableGrades,
      });
    } else {
      addSubject({
        name,
        shortName,
        code: code || `SUB-${Date.now().toString().slice(-4)}`,
        category,
        applicableGrades,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {subject ? 'Edit Curriculum Subject' : 'Add New Curriculum Subject'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Official Subject Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Information & Communication Technology"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Short Name (Report Cards) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ICT"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ministry Code
              </label>
              <input
                type="text"
                placeholder="e.g. ICT3"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Curricular Classification
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="core">Core Compulsory Subject</option>
              <option value="basket">Basket / Elective Subject</option>
              <option value="al_stream">Advanced Level Stream Subject</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Applicable Sri Lankan Grades (Select at least one) *
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((g) => {
                const isSelected = applicableGrades.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGrade(g)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Gr.{g}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {subject ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AssignTeacherModalProps {
  teacher: Teacher;
  onClose: () => void;
}

const AssignTeacherModal: React.FC<AssignTeacherModalProps> = ({ teacher, onClose }) => {
  const { subjects, assignTeacherToSubject } = useLMS();

  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [grade, setGrade] = useState<GradeLevel>(10);
  const [division, setDivision] = useState<Division | 'all'>('all');

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;

    assignTeacherToSubject(teacher.id, selectedSubjectId, grade, division);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assign Subject & Grade
            </h3>
            <p className="text-xs text-slate-500">
              Allocating curriculum to {teacher.fullName}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAssign} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grade Level
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Division / Section
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Divisions (A, B & C)</option>
                <option value="A">Division A Only</option>
                <option value="B">Division B Only</option>
                <option value="C">Division C Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
