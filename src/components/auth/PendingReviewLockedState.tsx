import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import {
  Lock,
  Clock,
  RefreshCw,
  LogOut,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';

export const PendingReviewLockedState: React.FC = () => {
  const { currentUser, logoutUser, refreshCurrentUserStatus, setShowLandingPage, switchRole } = useLMS();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshNotice(null);
    try {
      await refreshCurrentUserStatus();
      setRefreshNotice('Refreshed account approval status from Firestore.');
      setTimeout(() => setRefreshNotice(null), 3500);
    } catch (e) {
      setRefreshNotice('Unable to reach server. Please check internet connection.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-800">
      
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-sm shadow-amber-600/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight block">
                LankaEdu LMS
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                School Registration & Clearance
              </span>
            </div>
          </div>

          <button
            onClick={logoutUser}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Locked State Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          
          {/* Animated Lock & Clock Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <Lock className="w-9 h-9" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm animate-pulse">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {/* Locked State Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>Registration Status: Pending Approval</span>
          </div>

          {/* Mandatory User Requirement Message */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 sm:p-5 mb-6 text-left">
            <h1 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>Your account registration is under review by the School Admin. You will receive portal access once your account is assigned a role.</span>
            </h1>
          </div>

          {/* Registered Profile Details */}
          {currentUser && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-800/40 text-xs text-left mb-6 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <span>Submitted Registration Profile</span>
                <span className="font-mono text-slate-500">{currentUser.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Full Name:
                </span>
                <strong className="text-slate-900 dark:text-white font-semibold">{currentUser.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email:
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Phone:
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{currentUser.phone}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Current Role:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Unassigned
                </span>
              </div>
            </div>
          )}

          {/* Live Firestore Notice */}
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-6 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Real-time Firestore listener active. When the Administrator assigns your role, this screen will instantly transition to your portal.
            </span>
          </div>

          {refreshNotice && (
            <div className="mb-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{refreshNotice}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking Firestore...' : 'Check Approval Status'}</span>
            </button>

            <button
              type="button"
              onClick={logoutUser}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 text-center text-xs text-slate-400">
        LankaEdu LMS Access Governance · Sri Lankan Ministry of Education Curriculum System
      </footer>

    </div>
  );
};
