import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Teacher } from '../../types/lms';
import {
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building,
  GraduationCap,
  Download,
  Database,
  Sliders,
  Check,
  ArrowRight,
  Sparkles,
  Cloud,
  Users,
  Copy,
  Smartphone,
  Laptop,
  Radio,
  Search,
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const {
    adminPassword,
    changeAdminPassword,
    resetAdminPasswordToDefault,
    students,
    teachers,
    subjects,
    resetToDemoData,
    logoutAdmin,
    switchRole,
    currentRole,
    isAdminAuthenticated,
    isFirebaseConnected,
    isFirebaseSyncing,
    lastFirebaseSync,
    updateTeacherPassword,
    syncAllCredentialsToFirebase,
  } = useLMS();

  // Password form state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  
  // Visibility toggles
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Faculty Password Management State
  const [teacherSearch, setTeacherSearch] = useState('');
  const [editingTeacherForPassword, setEditingTeacherForPassword] = useState<Teacher | null>(null);
  const [teacherNewPwd, setTeacherNewPwd] = useState('');
  const [teacherConfirmPwd, setTeacherConfirmPwd] = useState('');
  const [showTeacherNewPwd, setShowTeacherNewPwd] = useState(false);
  const [revealedTeacherPasswords, setRevealedTeacherPasswords] = useState<Record<string, boolean>>({});
  const [teacherActionStatus, setTeacherActionStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [copiedTeacherId, setCopiedTeacherId] = useState<string | null>(null);

  // Status message
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Reset confirmation modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDataResetSuccess, setShowDataResetSuccess] = useState(false);

  // Compute password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    if (pwd.length < 5) return { score: 1, label: 'Too short (min 5 chars)', color: 'bg-red-500 text-red-600' };
    let score = 1;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500 text-amber-600' };
    if (score <= 4) return { score: 3, label: 'Good', color: 'bg-blue-500 text-blue-600' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500 text-emerald-600' };
  };

  const strength = getPasswordStrength(newPwd);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!currentPwd) {
      setStatusMessage({ type: 'error', text: 'Please enter your current administrator password.' });
      return;
    }

    if (newPwd.length < 5) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 5 characters long.' });
      return;
    }

    if (newPwd !== confirmPwd) {
      setStatusMessage({ type: 'error', text: 'The new password and confirm password do not match.' });
      return;
    }

    const res = changeAdminPassword(currentPwd, newPwd);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleResetToDefault = () => {
    resetAdminPasswordToDefault();
    setStatusMessage({
      type: 'success',
      text: 'Administrator master password has been reset to default ("admin123").',
    });
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  // Export database backup JSON
  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      institution: 'LankaEdu School Management System',
      curriculum: 'Sri Lankan National Curriculum (Grades 1–13)',
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalSubjects: subjects.length,
      students,
      teachers,
      subjects,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lankaedu_lms_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetAllData = () => {
    resetToDemoData();
    setShowResetConfirm(false);
    setShowDataResetSuccess(true);
    setTimeout(() => setShowDataResetSuccess(false), 4000);
  };

  // Update a teacher's password directly from the Settings menu
  const handleTeacherPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacherForPassword) return;
    setTeacherActionStatus(null);

    if (teacherNewPwd.length < 4) {
      setTeacherActionStatus({
        type: 'error',
        text: 'Teacher password must be at least 4 characters long.',
      });
      return;
    }

    if (teacherNewPwd !== teacherConfirmPwd) {
      setTeacherActionStatus({
        type: 'error',
        text: 'The confirmation password does not match.',
      });
      return;
    }

    const res = await updateTeacherPassword(editingTeacherForPassword.id, teacherNewPwd);
    if (res.success) {
      setTeacherActionStatus({ type: 'success', text: res.message });
      setTeacherNewPwd('');
      setTeacherConfirmPwd('');
      setTimeout(() => {
        setEditingTeacherForPassword(null);
        setTeacherActionStatus(null);
      }, 2500);
    } else {
      setTeacherActionStatus({ type: 'error', text: res.message });
    }
  };

  const handleToggleRevealTeacherPwd = (teacherId: string) => {
    setRevealedTeacherPasswords((prev) => ({
      ...prev,
      [teacherId]: !prev[teacherId],
    }));
  };

  const handleCopyTeacherCredential = (teacher: Teacher) => {
    const text = `Teacher Portal Login:\nEmployee ID: ${teacher.employeeId}\nPassword: ${teacher.password || 'teacher123'}`;
    navigator.clipboard.writeText(text);
    setCopiedTeacherId(teacher.id);
    setTimeout(() => setCopiedTeacherId(null), 2500);
  };

  const handleManualSyncAll = async () => {
    setIsSyncingAll(true);
    const res = await syncAllCredentialsToFirebase();
    setIsSyncingAll(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Administrator Clearance Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          System settings are restricted to verified administrators with master security authorization.
        </p>
        <button
          onClick={() => switchRole('admin')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          Verify Administrator Session
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Title & Status Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Tier 1 Administration</span>
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Session Authenticated
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              System Settings & Security Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update your master administrator password, configure institutional parameters, and manage school system backups
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                logoutAdmin();
                switchRole('parent');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Session</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Password Management Form (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    In-App Password Management (Master Administrator)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Update your master admin password directly from this interface. Persisted in browser localStorage and synced to Firebase Firestore across all devices.
                  </p>
                </div>
              </div>

              {/* Firebase Live Cloud Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 self-start shrink-0">
                <Cloud className={`w-3.5 h-3.5 text-emerald-600 ${isFirebaseSyncing ? 'animate-bounce' : ''}`} />
                <span>{isFirebaseSyncing ? 'Syncing with Cloud...' : 'Firebase Firestore Active'}</span>
                {lastFirebaseSync && (
                  <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 border-l border-emerald-200 dark:border-emerald-800 pl-1.5 ml-0.5">
                    {lastFirebaseSync}
                  </span>
                )}
              </div>
            </div>

            {/* Status alerts */}
            {statusMessage && (
              <div
                className={`mb-5 p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block">
                    {statusMessage.type === 'success' ? 'Password Changed' : 'Update Failed'}
                  </span>
                  <span>{statusMessage.text}</span>
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              
              {/* Field 1: Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Master Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    required
                    placeholder="Enter existing administrator password..."
                    value={currentPwd}
                    onChange={(e) => {
                      setCurrentPwd(e.target.value);
                      if (statusMessage) setStatusMessage(null);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Toggle password visibility"
                  >
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span>Current active password in this session: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{adminPassword}</code></span>
                  <button
                    type="button"
                    onClick={() => setCurrentPwd(adminPassword)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Fill current
                  </button>
                </div>
              </div>

              {/* Field 2: New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Master Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    placeholder="Enter new master password (min 5 characters)..."
                    value={newPwd}
                    onChange={(e) => {
                      setNewPwd(e.target.value);
                      if (statusMessage) setStatusMessage(null);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Toggle password visibility"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPwd && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Security Strength:</span>
                      <span className={`font-semibold ${strength.color}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.score >= 1 ? 'bg-red-500' : 'bg-transparent'}`}></div>
                      <div className={`h-full ${strength.score >= 2 ? 'bg-amber-500' : 'bg-transparent'}`}></div>
                      <div className={`h-full ${strength.score >= 3 ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                      <div className={`h-full ${strength.score >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new master password..."
                    value={confirmPwd}
                    onChange={(e) => {
                      setConfirmPwd(e.target.value);
                      if (statusMessage) setStatusMessage(null);
                    }}
                    className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 pr-10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 font-mono ${
                      confirmPwd && newPwd !== confirmPwd
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPwd && newPwd !== confirmPwd && (
                  <p className="mt-1 text-[11px] text-red-500">
                    Passwords do not match yet.
                  </p>
                )}
                {confirmPwd && newPwd === confirmPwd && (
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match!
                  </p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1 order-2 sm:order-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restore default ("admin123")</span>
                </button>

                <button
                  type="submit"
                  disabled={!currentPwd || !newPwd || !confirmPwd || newPwd !== confirmPwd}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors order-1 sm:order-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Update Master Password</span>
                </button>
              </div>

            </form>
          </div>

          {/* Faculty Credentials & Passwords Management Card (Firebase Firestore Synced) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Teacher Credentials & Passwords</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                      Cloud Sync
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage login passwords for subject teachers. Any password update saved here syncs immediately to Firebase Firestore across all devices.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualSyncAll}
                disabled={isSyncingAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50 shrink-0 self-start"
                title="Sync all faculty credentials with Firebase Firestore"
              >
                <Cloud className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'Syncing...' : 'Sync All to Cloud'}</span>
              </button>
            </div>

            {/* Quick Filter Search */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search teachers by name or employee ID (e.g. EMP-4001)..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Teacher Credential Cards */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {teachers
                .filter(
                  (t) =>
                    t.fullName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                    t.employeeId.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                    t.qualification.toLowerCase().includes(teacherSearch.toLowerCase())
                )
                .map((teacher) => {
                  const isRevealed = Boolean(revealedTeacherPasswords[teacher.id]);
                  const pwd = teacher.password || 'teacher123';
                  const isCopied = copiedTeacherId === teacher.id;

                  return (
                    <div
                      key={teacher.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {teacher.fullName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                            {teacher.employeeId}
                          </span>
                          {teacher.isClassTeacherOf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                              Grade {teacher.isClassTeacherOf.grade}-{teacher.isClassTeacherOf.division}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {teacher.assignments.length > 0
                            ? teacher.assignments
                                .map((a) => {
                                  const sub = subjects.find((s) => s.id === a.subjectId);
                                  return `${sub?.shortName || sub?.name || 'Subject'} (Gr.${a.grade})`;
                                })
                                .join(', ')
                            : 'No active assignments'}
                        </p>
                      </div>

                      {/* Password and Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                          <span className="text-slate-400 text-[10px] mr-1.5 font-medium">Password:</span>
                          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[70px]">
                            {isRevealed ? pwd : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleRevealTeacherPwd(teacher.id)}
                            className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                            title={isRevealed ? 'Hide password' : 'Show password'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyTeacherCredential(teacher)}
                            className="ml-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5"
                            title="Copy teacher login credentials"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeacherForPassword(teacher);
                            setTeacherNewPwd('');
                            setTeacherConfirmPwd('');
                            setTeacherActionStatus(null);
                          }}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/80 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Key className="w-3 h-3" />
                          <span>Change</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-4 p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-[11px] text-indigo-900 dark:text-indigo-200">
              <Radio className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />
              <span>
                <strong>Multi-Device Security:</strong> Passwords changed here are immediately broadcast via Firestore real-time listeners to all devices. The teacher must supply the new password on their next sign-in.
              </span>
            </div>
          </div>

          {/* System Data Maintenance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  School Database Maintenance
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data backups and curriculum seed restoration
                </p>
              </div>
            </div>

            {showDataResetSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>All student records, faculty assignments, and term marks have been restored to initial demo data!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Download JSON Backup</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Export entire database ({students.length} students, {teachers.length} teachers, all term marks) as an offline JSON snapshot.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  <span>Export Backup File</span>
                </button>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    <RefreshCw className="w-3.5 h-3.5 text-red-500" />
                    <span>Reset Initial Mock Dataset</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Restores mock Grade 1–13 student rosters, faculty assignments, and sample mark entries back to defaults.
                  </p>
                </div>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset All Data</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Institutional Profile & Grading Policies (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Institutional Specs Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Institutional Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sri Lankan National School System
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Academic Year</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">2026 Academic Cycle</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Grade Coverage</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Grades 1 to 13 (Divisions A, B, C)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Enrolled Students</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{students.length} Students</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Appointed Faculty</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{teachers.length} Teachers</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Curriculum Subjects</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{subjects.length} Subjects</span>
              </div>
            </div>
          </div>

          {/* Sri Lankan Grading Standards Overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ministry Grading Standards
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Standard threshold rules enforced automatically
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold font-mono text-xs flex items-center justify-center">A</span>
                  <div>
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">Distinction</div>
                    <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400">Outstanding mastery</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">75–100%</span>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold font-mono text-xs flex items-center justify-center">B</span>
                  <div>
                    <div className="font-bold text-blue-900 dark:text-blue-200 text-xs">Very Good Pass</div>
                    <div className="text-[10px] text-blue-700/80 dark:text-blue-400">Above average competence</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300">65–74%</span>
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold font-mono text-xs flex items-center justify-center">C</span>
                  <div>
                    <div className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">Credit Pass</div>
                    <div className="text-[10px] text-indigo-700/80 dark:text-indigo-400">Satisfactory grasp of core syllabi</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">55–64%</span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-500 text-white font-bold font-mono text-xs flex items-center justify-center">S</span>
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-200 text-xs">Ordinary Pass</div>
                    <div className="text-[10px] text-amber-700/80 dark:text-amber-400">Minimum passing standard</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-300">35–54%</span>
              </div>

              <div className="p-2.5 rounded-lg bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-red-600 text-white font-bold font-mono text-xs flex items-center justify-center">W</span>
                  <div>
                    <div className="font-bold text-red-900 dark:text-red-200 text-xs">Weak / Fail</div>
                    <div className="text-[10px] text-red-700/80 dark:text-red-400">Requires academic intervention</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-red-700 dark:text-red-300">0–34%</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Confirmation Modal for Resetting All Data */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-slate-900 dark:text-white mb-1">
              Reset Entire School Database?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
              This will overwrite all modified marks, enrolled students, and custom faculty assignments back to the Sri Lankan demonstration dataset. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAllData}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Teacher Password */}
      {editingTeacherForPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Update Teacher Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {editingTeacherForPassword.fullName} ({editingTeacherForPassword.employeeId})
                </p>
              </div>
            </div>

            {teacherActionStatus && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  teacherActionStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}
              >
                {teacherActionStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{teacherActionStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleTeacherPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showTeacherNewPwd ? 'text' : 'password'}
                    required
                    placeholder="Enter new password (min 4 characters)..."
                    value={teacherNewPwd}
                    onChange={(e) => setTeacherNewPwd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherNewPwd(!showTeacherNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showTeacherNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showTeacherNewPwd ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password..."
                  value={teacherConfirmPwd}
                  onChange={(e) => setTeacherConfirmPwd(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 font-mono ${
                    teacherConfirmPwd && teacherNewPwd !== teacherConfirmPwd
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
                  }`}
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Saves directly to Firebase Firestore with instant cross-device synchronization.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeacherForPassword(null);
                    setTeacherActionStatus(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!teacherNewPwd || teacherNewPwd !== teacherConfirmPwd || isFirebaseSyncing}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isFirebaseSyncing ? 'Saving to Cloud...' : 'Save & Sync Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
