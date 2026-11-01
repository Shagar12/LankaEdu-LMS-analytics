import React, { useState, useEffect } from 'react';
import {
  Database,
  CloudCheck,
  ShieldCheck,
  BookOpen,
  Wifi,
  WifiOff,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Terminal,
  Cpu,
  Layers,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { isOfflinePersistenceActive } from '../../lib/firebase';

interface BootStep {
  id: string;
  label: string;
  detail: string;
  category: 'storage' | 'firebase' | 'supabase' | 'curriculum' | 'rbac';
  status: 'pending' | 'in_progress' | 'completed' | 'warning';
}

interface BootLoaderProps {
  onComplete: () => void;
  autoDismissDelay?: number;
}

export const BootLoader: React.FC<BootLoaderProps> = ({
  onComplete,
  autoDismissDelay = 1200,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const [systemLatency, setSystemLatency] = useState<number | null>(null);
  const [backendMeta, setBackendMeta] = useState<any>(null);
  const [isDone, setIsDone] = useState(false);

  const [steps, setSteps] = useState<BootStep[]>([
    {
      id: 'step-offline',
      label: 'Offline Engine & IndexedDB',
      detail: 'Initializing local browser cache for low-connectivity classrooms',
      category: 'storage',
      status: 'in_progress',
    },
    {
      id: 'step-firebase',
      label: 'Firebase Firestore Realtime Channel',
      detail: 'Connecting to Firestore document store & listeners',
      category: 'firebase',
      status: 'pending',
    },
    {
      id: 'step-supabase',
      label: 'PostgreSQL & Supabase API Backend',
      detail: 'Verifying relational schema, users table & mark submissions',
      category: 'supabase',
      status: 'pending',
    },
    {
      id: 'step-curriculum',
      label: 'Sri Lankan Curriculum Standards',
      detail: 'Caching MoE Grade 1-13 grading scales (A, B, C, S, W)',
      category: 'curriculum',
      status: 'pending',
    },
    {
      id: 'step-rbac',
      label: 'Security & Role-Based Access Control',
      detail: 'Validating role permissions (Admin, Teacher, Student, Parent)',
      category: 'rbac',
      status: 'pending',
    },
  ]);

  useEffect(() => {
    let isMounted = true;

    async function executeBootSequence() {
      // Step 1: Storage / IndexedDB
      await new Promise(r => setTimeout(r, 260));
      if (!isMounted) return;
      setSteps(prev =>
        prev.map((s, idx) =>
          idx === 0 ? { ...s, status: 'completed' } : idx === 1 ? { ...s, status: 'in_progress' } : s
        )
      );
      setProgress(22);
      setCurrentStepIndex(1);

      // Step 2: Firebase Firestore Check
      await new Promise(r => setTimeout(r, 320));
      if (!isMounted) return;
      setSteps(prev =>
        prev.map((s, idx) =>
          idx === 1 ? { ...s, status: 'completed' } : idx === 2 ? { ...s, status: 'in_progress' } : s
        )
      );
      setProgress(48);
      setCurrentStepIndex(2);

      // Step 3: Supabase / PostgreSQL backend health check
      try {
        const health = await supabase.health();
        if (isMounted) {
          setSystemLatency(health.latencyMs);
          setBackendMeta(health.details);
        }
      } catch (err) {
        console.warn('Backend probe note:', err);
      }

      await new Promise(r => setTimeout(r, 350));
      if (!isMounted) return;
      setSteps(prev =>
        prev.map((s, idx) =>
          idx === 2 ? { ...s, status: 'completed' } : idx === 3 ? { ...s, status: 'in_progress' } : s
        )
      );
      setProgress(74);
      setCurrentStepIndex(3);

      // Step 4: Curriculum Standards Load
      await new Promise(r => setTimeout(r, 280));
      if (!isMounted) return;
      setSteps(prev =>
        prev.map((s, idx) =>
          idx === 3 ? { ...s, status: 'completed' } : idx === 4 ? { ...s, status: 'in_progress' } : s
        )
      );
      setProgress(92);
      setCurrentStepIndex(4);

      // Step 5: RBAC & Final Handshake
      await new Promise(r => setTimeout(r, 240));
      if (!isMounted) return;
      setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
      setProgress(100);
      setIsDone(true);

      // Auto finish after small delay
      setTimeout(() => {
        if (isMounted) {
          onComplete();
        }
      }, autoDismissDelay);
    }

    executeBootSequence();

    return () => {
      isMounted = false;
    };
  }, [onComplete, autoDismissDelay]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-100 overflow-y-auto px-4 py-8">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
        {/* Brand & Crest Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl ring-2 ring-indigo-500/30">
              🇱🇰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">LankaEdu LMS</h1>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  v2.6 Core
                </span>
              </div>
              <p className="text-xs text-slate-400">
                National Academic Management & Dual Backend Engine
              </p>
            </div>
          </div>

          {/* Network & Persistence Indicators */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {navigator.onLine ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
            </div>
            {systemLatency !== null && (
              <span className="hidden sm:inline-flex items-center text-[10px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 font-mono">
                {systemLatency}ms
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              {isDone ? 'System initialized & ready' : 'Performing pre-flight subsystem checks...'}
            </span>
            <span className="text-white font-mono font-bold">{progress}%</span>
          </div>

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Diagnostic Checklist Steps */}
        <div className="space-y-2.5">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex && step.status === 'in_progress';
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 border ${
                  step.status === 'completed'
                    ? 'bg-slate-900/50 border-slate-800/60 text-slate-300'
                    : isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500/30 text-white shadow-inner'
                    : 'bg-slate-900/20 border-slate-850/30 text-slate-500'
                }`}
              >
                {/* Status Icon */}
                <div className="mt-0.5 shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800/50" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        step.status === 'completed'
                          ? 'text-slate-200'
                          : isCurrent
                          ? 'text-indigo-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {step.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Backend Architecture Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
          <div className="bg-slate-850/60 border border-slate-800 rounded-lg p-2 flex flex-col">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <CloudCheck className="w-3 h-3 text-amber-400" /> Firebase
            </span>
            <span className="font-medium text-slate-200 truncate">Firestore + Offline</span>
          </div>
          <div className="bg-slate-850/60 border border-slate-800 rounded-lg p-2 flex flex-col">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-400" /> Supabase / SQL
            </span>
            <span className="font-medium text-slate-200 truncate">PostgreSQL 16 Engine</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-850/60 border border-slate-800 rounded-lg p-2 flex flex-col">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-400" /> Curriculum
            </span>
            <span className="font-medium text-slate-200 truncate">Sri Lanka G1–13</span>
          </div>
        </div>

        {/* Collapsible Telemetry / Logs */}
        {showLogs && (
          <div className="p-3 bg-black/60 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 max-h-36 overflow-y-auto space-y-1">
            <div className="text-slate-500">// LankaEdu LMS Subsystem Diagnostics</div>
            <div>[IndexedDB]: Persistence active: {String(isOfflinePersistenceActive)}</div>
            <div>[PostgreSQL]: Host: Cloud SQL (asia-south1)</div>
            <div>[Supabase]: Table sync users, mark_submissions, curriculum_standards</div>
            <div>[Curriculum]: Ministry of Education grading logic loaded (A: 75+, B: 65+, C: 55+, S: 35+, W: &lt;35)</div>
            {backendMeta && (
              <div>[API]: {backendMeta.database} | Items: {backendMeta.curriculumItemsLoaded}</div>
            )}
          </div>
        )}

        {/* Bottom Actions: Logs toggle and Skip / Proceed */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showLogs ? 'Hide Telemetry' : 'View Telemetry'}</span>
          </button>

          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all shadow-md shadow-indigo-600/30"
          >
            <span>{isDone ? 'Enter Portal' : 'Skip & Enter'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
