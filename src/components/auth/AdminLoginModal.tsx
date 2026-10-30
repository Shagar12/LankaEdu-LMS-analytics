import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { ShieldCheck, Lock, X, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSuccess }) => {
  const { loginAdmin, adminPassword } = useLMS();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = loginAdmin(password);
    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError('Invalid master administrator password. Please try again.');
    }
  };

  const handleFillDemo = () => {
    setPassword(adminPassword);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Administrator Authentication
              </h3>
              <p className="text-[11px] text-slate-500">
                Master security clearance required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-300">
            <div className="font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
              Tier 1: Full System Authority
            </div>
            <p className="text-[11px] leading-relaxed">
              Provides unrestricted control across all Grades 1–13 (Divisions A, B, C), student enrollment, faculty management, mark sheet overrides, and final result certification.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Master Administrator Password</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter master password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-wider"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Demo Hint Button */}
          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Demo Password:</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Key className="w-3 h-3" />
              <span>Use "{adminPassword}"</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify & Access Admin</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
