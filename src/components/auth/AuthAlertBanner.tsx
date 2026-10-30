import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { AlertTriangle, Lock, LogIn, X, ShieldAlert } from 'lucide-react';
import { AdminLoginModal } from './AdminLoginModal';

export const AuthAlertBanner: React.FC = () => {
  const { adminNotification, clearAdminNotification, switchRole } = useLMS();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!adminNotification) return null;

  const handleOpenLogin = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    clearAdminNotification();
    setShowLoginModal(false);
    switchRole('admin');
  };

  return (
    <>
      <div className="relative z-20 bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 px-4 py-3 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
              <ShieldAlert className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  Security Alert
                </span>
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                  Real-time Authentication State Update
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5 font-medium">
                {adminNotification}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={handleOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In with New Password</span>
            </button>

            <button
              onClick={clearAdminNotification}
              className="p-1.5 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              title="Dismiss notification"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {showLoginModal && (
        <AdminLoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
};
