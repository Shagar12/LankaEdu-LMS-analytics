import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { LMSUser } from '../../types/lms';
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  X,
  Filter,
  Plus,
  RefreshCw,
  UserPlus,
} from 'lucide-react';

export const AccountApprovalsPanel: React.FC = () => {
  const {
    users,
    pendingUsers,
    assignUserAsTeacher,
    assignUserAsStudent,
    rejectUserRegistration,
    students,
    signupUser,
  } = useLMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewTab, setActiveViewTab] = useState<'pending' | 'all'>('pending');

  // Modal state for assigning as student (prompts for Index Number)
  const [studentModalUser, setStudentModalUser] = useState<LMSUser | null>(null);
  const [indexNumberInput, setIndexNumberInput] = useState('');
  const [modalError, setModalError] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Quick suggestions for student indices
  const suggestedIndices = [
    'IDX-10100',
    'IDX-10101',
    'IDX-10102',
    'IDX-11100',
    'IDX-11101',
    `IDX-${10000 + students.length + 1}`,
  ];

  const filteredPending = pendingUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
  );

  const filteredAll = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      (u.indexNumber && u.indexNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Action 1: Assign as Teacher
  const handleAssignTeacher = async (user: LMSUser) => {
    setActionLoadingId(user.id);
    setToastMessage(null);
    try {
      const res = await assignUserAsTeacher(user.id);
      if (res.success) {
        setToastMessage({ type: 'success', text: res.message });
      } else {
        setToastMessage({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setToastMessage({ type: 'error', text: e?.message || 'Failed to assign role.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action 2: Open Student Index prompt
  const handleOpenStudentModal = (user: LMSUser) => {
    setStudentModalUser(user);
    // Auto-generate or pick a suggestion
    const defaultIdx = user.indexNumber || `IDX-${10000 + students.length + 1}`;
    setIndexNumberInput(defaultIdx);
    setModalError('');
  };

  // Submit Student Assignment with Index Number
  const handleConfirmStudentAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentModalUser) return;

    const cleanIndex = indexNumberInput.trim().toUpperCase();
    if (!cleanIndex) {
      setModalError('Please enter a valid Examination Index Number.');
      return;
    }

    setActionLoadingId(studentModalUser.id);
    setModalError('');
    try {
      const res = await assignUserAsStudent(studentModalUser.id, cleanIndex);
      if (res.success) {
        setToastMessage({ type: 'success', text: res.message });
        setStudentModalUser(null);
      } else {
        setModalError(res.message);
      }
    } catch (e: any) {
      setModalError(e?.message || 'Failed to assign student role.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Optional: Reject registration
  const handleReject = async (user: LMSUser) => {
    if (!window.confirm(`Are you sure you want to decline registration for ${user.name}?`)) {
      return;
    }
    setActionLoadingId(user.id);
    try {
      const res = await rejectUserRegistration(user.id);
      setToastMessage({ type: 'success', text: res.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Helper for demo: Create a sample applicant
  const handleCreateSampleApplicant = async () => {
    const randomId = Math.floor(100 + Math.random() * 900);
    const names = ['Anura Kumara', 'Sanduni Perera', 'Nuwan Senanayake', 'Kavindi Silva'];
    const selectedName = names[Math.floor(Math.random() * names.length)];
    const email = `${selectedName.toLowerCase().replace(' ', '.')}.${randomId}@example.com`;

    await signupUser({
      name: `${selectedName} (${randomId})`,
      email,
      phone: `+94 77 ${randomId} 4567`,
      password: 'password123',
    });

    setToastMessage({
      type: 'success',
      text: `Created new sample applicant: ${selectedName} (${email}). Ready for admin assignment!`,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Control Dashboard · Role Assignment Hub</span>
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {pendingUsers.length} Pending Review
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Account Approvals & Role Assignment Hub
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              All new user registrations default to <strong>status: pending</strong>. Review applicant profiles and assign their authorized role as <strong>Teacher</strong> or <strong>Student</strong> (with examination index number).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleCreateSampleApplicant}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="Add a sample pending registration for testing"
            >
              <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
              <span>+ Simulate Applicant</span>
            </button>
          </div>
        </div>

        {/* Search and Tabs Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveViewTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeViewTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Review ({pendingUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveViewTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeViewTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Accounts ({users.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 border shadow-xs animate-in fade-in duration-150 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VIEW 1: PENDING APPROVALS LIST */}
      {activeViewTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Pending Registration Roster
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {filteredPending.length} {filteredPending.length === 1 ? 'user' : 'users'} awaiting assignment
            </span>
          </div>

          {filteredPending.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                All Account Registrations Reviewed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                There are currently no applicant profiles pending administrator clearance. New registrations will automatically appear here via Firestore live sync.
              </p>
              <button
                onClick={handleCreateSampleApplicant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-900"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simulate a New Pending Applicant</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPending.map((user) => (
                <div
                  key={user.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  
                  {/* Left: Applicant Information */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                          {user.name}
                        </h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Status: Pending</span>
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Role: Unassigned
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.email}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.phone}</span>
                        </span>
                        <span>·</span>
                        <span className="text-[11px] text-slate-400">
                          Applied: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: The Two Mandatory Action Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full md:w-auto justify-start md:justify-end mt-2 md:mt-0">
                    
                    {/* Action 1: Assign as Teacher */}
                    <button
                      type="button"
                      disabled={actionLoadingId === user.id}
                      onClick={() => handleAssignTeacher(user)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap"
                      title="Assign as Teacher (updates status: 'active' and assignedRole: 'teacher')"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Assign as Teacher</span>
                    </button>

                    {/* Action 2: Assign as Student */}
                    <button
                      type="button"
                      disabled={actionLoadingId === user.id}
                      onClick={() => handleOpenStudentModal(user)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap"
                      title="Assign as Student (prompts for Index Number, then updates status: 'active' and assignedRole: 'student')"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Assign as Student</span>
                    </button>

                    {/* Decline option */}
                    <button
                      type="button"
                      onClick={() => handleReject(user)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
                      title="Decline registration"
                    >
                      <X className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: ALL REGISTERED ACCOUNTS */}
      {activeViewTab === 'all' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              All System User Accounts & Roles
            </span>
            <span className="text-xs font-mono text-slate-400">
              Total: {filteredAll.length} accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-semibold">User / Name</th>
                  <th className="py-3 px-3 font-semibold">Email & Phone</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-3 font-semibold text-center">Assigned Role</th>
                  <th className="py-3 px-3 font-semibold">Index Number</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAll.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{u.id}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-700 dark:text-slate-300">{u.email}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.phone}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : u.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                          u.assignedRole === 'admin'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : u.assignedRole === 'teacher'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : u.assignedRole === 'student'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {u.assignedRole}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.indexNumber ? (
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {u.indexNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.status === 'pending' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleAssignTeacher(u)}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded"
                          >
                            Teacher
                          </button>
                          <button
                            onClick={() => handleOpenStudentModal(u)}
                            className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded"
                          >
                            Student
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Assigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MODAL: PROMPT FOR INDEX NUMBER (Assign as Student) */}
      {studentModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Assign Student Index Number
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assigning role: <strong>Student</strong> (status: active)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStudentModalUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmStudentAssignment} className="space-y-4 mt-4">
              
              {/* Applicant Card */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Student Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{studentModalUser.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{studentModalUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{studentModalUser.phone}</span>
                </div>
              </div>

              {/* Prompt Input for Index Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Examination Index Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. IDX-10100"
                    value={indexNumberInput}
                    onChange={(e) => {
                      setIndexNumberInput(e.target.value.toUpperCase());
                      setModalError('');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  This examination index number links to official term evaluation marks and report cards.
                </p>
              </div>

              {/* Quick suggestions pills */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Quick Index Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedIndices.map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setIndexNumberInput(idx)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors border ${
                        indexNumberInput === idx
                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {idx}
                    </button>
                  ))}
                </div>
              </div>

              {modalError && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStudentModalUser(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === studentModalUser.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Confirm & Activate Student</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
