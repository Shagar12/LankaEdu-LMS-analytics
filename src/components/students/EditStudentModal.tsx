import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Student, GradeLevel, Division } from '../../types/lms';
import { X, UserCheck, Trash2, Save, AlertTriangle } from 'lucide-react';

interface EditStudentModalProps {
  student: Student;
  onClose: () => void;
  onUpdated?: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  onClose,
  onUpdated,
}) => {
  const { updateStudent, deleteStudent } = useLMS();

  const [fullName, setFullName] = useState(student.fullName);
  const [indexNumber, setIndexNumber] = useState(student.indexNumber);
  const [grade, setGrade] = useState<GradeLevel>(student.grade);
  const [division, setDivision] = useState<Division>(student.division);
  const [gender, setGender] = useState<'Male' | 'Female'>(student.gender);
  const [medium, setMedium] = useState<'Sinhala' | 'Tamil' | 'English'>(student.medium);
  const [attendanceRate, setAttendanceRate] = useState<number>(student.attendanceRate);
  const [guardianName, setGuardianName] = useState(student.guardianName);
  const [contactNumber, setContactNumber] = useState(student.contactNumber);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    updateStudent(student.id, {
      fullName: fullName.trim(),
      indexNumber: indexNumber.trim(),
      grade,
      division,
      gender,
      medium,
      attendanceRate: Math.min(100, Math.max(0, attendanceRate)),
      guardianName: guardianName.trim(),
      contactNumber: contactNumber.trim(),
    });

    if (onUpdated) onUpdated();
    onClose();
  };

  const handleDelete = () => {
    deleteStudent(student.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Student Details
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {student.id} · {student.fullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Student Full Legal Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Index Number & Student ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Examination Index Number
              </label>
              <input
                type="text"
                required
                value={indexNumber}
                onChange={(e) => setIndexNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unique Student ID (System)
              </label>
              <input
                type="text"
                disabled
                value={student.id}
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          {/* Grade & Division */}
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
                Class Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value as Division)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="A">Division A</option>
                <option value="B">Division B</option>
                <option value="C">Division C</option>
              </select>
            </div>
          </div>

          {/* Medium of Study & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medium of Instruction
              </label>
              <select
                value={medium}
                onChange={(e) => setMedium(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="Sinhala">Sinhala Medium</option>
                <option value="Tamil">Tamil Medium</option>
                <option value="English">English Medium</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Attendance % */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Attendance Record (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={attendanceRate}
              onChange={(e) => setAttendanceRate(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Guardian & Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parent / Guardian Name
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Delete Danger Zone */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            {showDeleteConfirm ? (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Permanently remove this student?</span>
                </div>
                <p className="text-[11px]">
                  All term marks and report card records for {student.fullName} will be deleted.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded font-semibold text-xs hover:bg-red-700"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Student Record</span>
              </button>
            )}
          </div>

          {/* Footer Actions */}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
