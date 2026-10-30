import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import {
  Key,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  HardDrive,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AdminPasswordSettingsCardProps {
  defaultExpanded?: boolean;
  compact?: boolean;
}

export const AdminPasswordSettingsCard: React.FC<AdminPasswordSettingsCardProps> = ({
  defaultExpanded = true,
  compact = false,
}) => {
  const {
    adminPassword,
    isCustomPasswordSet,
    changeAdminPassword,
    resetAdminPasswordToDefault,
    setActiveTab,
    isAdminAuthenticated,
  } = useLMS();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showStoredPassword, setShowStoredPassword] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Compute password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    if (pwd.length < 5) return { score: 1, label: 'Too short (min 5 chars)', color: 'bg-red-500 text-red-600' };
    let score = 1;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 2, label: 'Fair strength', color: 'bg-amber-500 text-amber-600' };
    if (score <= 4) return { score: 3, label: 'Good strength', color: 'bg-blue-500 text-blue-600' };
    return { score: 4, label: 'Strong password', color: 'bg-emerald-500 text-emerald-600' };
  };

  const strength = getPasswordStrength(newPwd);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!currentPwd) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your current administrator password.',
      });
      return;
    }

    if (newPwd.length < 5) {
      setStatusMessage({
        type: 'error',
        text: 'New password must be at least 5 characters long.',
      });
      return;
    }

    if (newPwd !== confirmPwd) {
      setStatusMessage({
        type: 'error',
        text: 'The new password and confirm password do not match.',
      });
      return;
    }

    const res = changeAdminPassword(currentPwd, newPwd);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: 'Administrator master password updated! Saved in browser localStorage and will persist across sessions and device reboots.',
      });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handleResetToDefault = () => {
    resetAdminPasswordToDefault();
    setStatusMessage({
      type: 'success',
      text: 'Administrator master password has been reset to default ("admin123") in localStorage.',
    });
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  const handlePreFillCurrent = () => {
    setCurrentPwd(adminPassword);
    setStatusMessage(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-all">
      {/* Card Header & Toggle */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>In-App Password Management</span>
              </h2>

              {isCustomPasswordSet ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Custom Password Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Default Password In Use ("admin123")</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <HardDrive className="w-3 h-3 text-indigo-500" />
                <span>Saved to localStorage</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Update your master administrator password anytime directly from this dashboard without modifying code.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => setActiveTab('settings')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2.5 py-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors flex items-center gap-1"
            title="Open comprehensive system settings view"
          >
            <span>Full Settings</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            aria-label={isExpanded ? 'Collapse password settings' : 'Expand password settings'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Form */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Security Notice Banner */}
          {!isCustomPasswordSet && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold block">Security Recommendation: Set Your Desired Password</span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                    The LMS is currently running on the default master password (<code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">admin123</code>). Enter your chosen password below to protect access to Grades 1–13 student marks and teacher controls.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePreFillCurrent}
                className="shrink-0 text-[11px] font-semibold text-amber-800 dark:text-amber-300 underline hover:no-underline px-2 py-1 bg-amber-100 dark:bg-amber-900/40 rounded border border-amber-300 dark:border-amber-700"
              >
                Auto-fill current
              </button>
            </div>
          )}

          {/* Stored in LocalStorage Status Card */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">
                Storage Key: <code className="font-mono font-semibold text-slate-800 dark:text-slate-200">lankaedu_admin_password_v1</code> (Browser LocalStorage)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowStoredPassword(!showStoredPassword)}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                {showStoredPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showStoredPassword ? `Hide (${adminPassword})` : 'Reveal Active Password'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] font-medium text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
                title="Reset to default password admin123"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to Default</span>
              </button>
            </div>
          </div>

          {/* Status Message Alerts */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border transition-all ${
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
                  {statusMessage.type === 'success' ? 'Password Updated & Persisted' : 'Password Update Failed'}
                </span>
                <span className="text-[11px] leading-relaxed">{statusMessage.text}</span>
              </div>
            </div>
          )}

          {/* Password Update Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Field 1: Current Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  {!isCustomPasswordSet && (
                    <button
                      type="button"
                      onClick={handlePreFillCurrent}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Fill default
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    required
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showCurrentPwd ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Field 2: New Desired Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Desired Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Your desired new password..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showNewPwd ? 'Hide password' : 'Show password'}
                  >
                    {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Strength Meter */}
                {newPwd && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Strength:</span>
                      <span className={`font-semibold ${strength.color.split(' ')[1]}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color.split(' ')[0]}`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Desired Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Re-enter desired password..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showConfirmPwd ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {confirmPwd && (
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    {newPwd === confirmPwd ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium">Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Actions Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Minimum 5 characters. Changes take effect instantly across all admin views.
              </span>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Save Password to localStorage</span>
                </button>
              </div>
            </div>
          </form>

        </div>
      )}
    </div>
  );
};
