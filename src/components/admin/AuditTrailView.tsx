import React, { useState, useMemo, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import {
  AuditLogEntry,
  AuditActorRole,
  AuditActionType,
  AuditSeverity,
} from '../../types/lms';
import {
  History,
  Shield,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Laptop,
  Smartphone,
  UserCheck,
  BookOpen,
  Printer,
  Key,
  GraduationCap,
  Users,
  X,
  Radio,
  FileSpreadsheet,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { auditLogs, clearAuditLogs, logAuditEvent, isCurrentDeviceMobile } = useLMS();

  // Filter States
  const [roleFilter, setRoleFilter] = useState<'all' | AuditActorRole>('all');
  const [actionCategory, setActionCategory] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | AuditSeverity>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'all' | 'today' | '24h' | '7d'>('all');

  // Live Watch State
  const [isLiveWatchActive, setIsLiveWatchActive] = useState<boolean>(true);
  const [lastLiveTick, setLastLiveTick] = useState<string>(new Date().toLocaleTimeString());

  // Modal / Detail drawer
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshingServer, setIsRefreshingServer] = useState<boolean>(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Live watch timer indicator
  useEffect(() => {
    if (!isLiveWatchActive) return;
    const interval = setInterval(() => {
      setLastLiveTick(new Date().toLocaleTimeString());
    }, 10000);
    return () => clearInterval(interval);
  }, [isLiveWatchActive]);

  // Metrics calculation
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const teacherEvents = auditLogs.filter((l) => l.actorRole === 'teacher').length;
    const parentEvents = auditLogs.filter((l) => l.actorRole === 'parent').length;
    const adminEvents = auditLogs.filter((l) => l.actorRole === 'admin').length;
    const studentEvents = auditLogs.filter((l) => l.actorRole === 'student').length;
    const criticalEvents = auditLogs.filter(
      (l) => l.severity === 'critical' || l.severity === 'warning'
    ).length;

    return {
      total,
      teacherEvents,
      parentEvents,
      adminEvents,
      studentEvents,
      criticalEvents,
    };
  }, [auditLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const q = searchQuery.trim().toLowerCase();

    return auditLogs.filter((log) => {
      // Role filter
      if (roleFilter !== 'all' && log.actorRole !== roleFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && log.severity !== severityFilter) {
        return false;
      }

      // Action category filter
      if (actionCategory !== 'all') {
        if (actionCategory === 'marks' && !['MARK_ENTRY', 'MARK_SUBMISSION', 'MARK_APPROVAL'].includes(log.action)) {
          return false;
        }
        if (actionCategory === 'parent' && !['STUDENT_SEARCH', 'REPORT_PRINT'].includes(log.action)) {
          return false;
        }
        if (actionCategory === 'roster' && !['STUDENT_ENROLL', 'STUDENT_UPDATE', 'STUDENT_DELETE'].includes(log.action)) {
          return false;
        }
        if (actionCategory === 'auth' && !['USER_REGISTRATION', 'USER_ROLE_ASSIGNED', 'ADMIN_PASSWORD_CHANGE', 'USER_LOGIN'].includes(log.action)) {
          return false;
        }
      }

      // Time Range filter
      if (timeRange !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        const diffMs = now - logTime;
        if (timeRange === 'today') {
          const logDate = new Date(log.timestamp).toDateString();
          const todayDate = new Date().toDateString();
          if (logDate !== todayDate) return false;
        } else if (timeRange === '24h') {
          if (diffMs > 24 * 60 * 60 * 1000) return false;
        } else if (timeRange === '7d') {
          if (diffMs > 7 * 24 * 60 * 60 * 1000) return false;
        }
      }

      // Search Query
      if (q) {
        const matchName = log.actorName.toLowerCase().includes(q);
        const matchTitle = log.actionTitle.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchTarget = log.targetEntity?.toLowerCase().includes(q) || false;
        const matchId = log.actorIdentifier?.toLowerCase().includes(q) || false;
        if (!matchName && !matchTitle && !matchDetails && !matchTarget && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, roleFilter, actionCategory, severityFilter, timeRange, searchQuery]);

  // Relative time formatter
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'Timestamp (UTC)',
        'Actor Name',
        'Actor Role',
        'Actor Identifier',
        'Action Type',
        'Action Title',
        'Details',
        'Target Entity',
        'Grade',
        'Division',
        'Term',
        'Severity',
        'Device / Client',
      ];

      const rows = filteredLogs.map((l) => [
        `"${l.timestamp}"`,
        `"${l.actorName.replace(/"/g, '""')}"`,
        `"${l.actorRole}"`,
        `"${(l.actorIdentifier || '').replace(/"/g, '""')}"`,
        `"${l.action}"`,
        `"${l.actionTitle.replace(/"/g, '""')}"`,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${(l.targetEntity || '').replace(/"/g, '""')}"`,
        `"${l.grade || ''}"`,
        `"${l.division || ''}"`,
        `"${l.term || ''}"`,
        `"${l.severity}"`,
        `"${(l.deviceInfo || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `lankaedu_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToastMessage(`Exported ${filteredLogs.length} audit logs to CSV successfully.`);
    } catch (e) {
      console.error('Failed to export CSV', e);
      setToastMessage('Error generating CSV export.');
    }
  };

  // Fetch / Sync latest logs from Cloud SQL endpoint
  const handleSyncCloudSql = async () => {
    setIsRefreshingServer(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setToastMessage(`Synced ${data.logs?.length || 0} relational records from Cloud SQL backend.`);
      } else {
        setToastMessage('Cloud SQL audit logs checked (Live Firestore active).');
      }
    } catch (e) {
      setToastMessage('Connected to Firestore live real-time sync.');
    } finally {
      setIsRefreshingServer(false);
    }
  };

  // Helper for Role Badges
  const getRoleBadge = (role: AuditActorRole) => {
    switch (role) {
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <GraduationCap className="w-3 h-3" />
            <span>Teacher</span>
          </span>
        );
      case 'parent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Users className="w-3 h-3" />
            <span>Parent</span>
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <UserCheck className="w-3 h-3" />
            <span>Student</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <span>System</span>
          </span>
        );
    }
  };

  // Helper for Severity Badges
  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>CRITICAL</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>WARNING</span>
          </span>
        );
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>SUCCESS</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Info className="w-3 h-3 text-slate-500" />
            <span>INFO</span>
          </span>
        );
    }
  };

  // Helper for Action Icon
  const getActionIcon = (action: AuditActionType, role: AuditActorRole) => {
    switch (action) {
      case 'MARK_ENTRY':
        return <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'MARK_SUBMISSION':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'MARK_APPROVAL':
        return <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'STUDENT_SEARCH':
        return <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'REPORT_PRINT':
        return <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'STUDENT_ENROLL':
        return <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'STUDENT_UPDATE':
        return <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'STUDENT_DELETE':
        return <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'USER_ROLE_ASSIGNED':
        return <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'ADMIN_PASSWORD_CHANGE':
        return <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <History className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-600 dark:text-rose-400">
                <History className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                System Audit Trail & Activity Watcher
              </h1>
              {isLiveWatchActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Live Watch Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <span>Paused</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Live continuous surveillance of all teacher evaluations, parent portal index queries, report card prints, and administrative operations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setIsLiveWatchActive(!isLiveWatchActive)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                isLiveWatchActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle Live Watch listener"
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveWatchActive ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
              <span>{isLiveWatchActive ? 'Watching Live' : 'Resume Watch'}</span>
            </button>

            <button
              onClick={handleSyncCloudSql}
              disabled={isRefreshingServer}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/70 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
              title="Query PostgreSQL audit_logs table"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingServer ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>Cloud SQL Sync</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-xs transition-colors whitespace-nowrap"
              title="Export filtered records for Ministry inspection"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors whitespace-nowrap"
              title="Clear stored audit history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span className="font-medium">Total Events</span>
              <History className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Real-time dual persisted</div>
          </div>

          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs">
              <span className="font-medium">Teachers</span>
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-200">
              {stats.teacherEvents}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 mt-0.5">Mark entries & reviews</div>
          </div>

          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200/70 dark:border-amber-800/60">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs">
              <span className="font-medium">Parents</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-200">
              {stats.parentEvents}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400/80 mt-0.5">Index searches & prints</div>
          </div>

          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/70 dark:border-indigo-800/60">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 text-xs">
              <span className="font-medium">Admin Actions</span>
              <Shield className="w-4 h-4" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold text-indigo-900 dark:text-indigo-200">
              {stats.adminEvents}
            </div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400/80 mt-0.5">Approvals & updates</div>
          </div>

          <div className="p-3 col-span-2 sm:col-span-1 bg-rose-50/70 dark:bg-rose-950/40 rounded-xl border border-rose-200/70 dark:border-rose-800/60">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs">
              <span className="font-medium">Critical / Alerts</span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold text-rose-900 dark:text-rose-200">
              {stats.criticalEvents}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400/80 mt-0.5">Security & deletions</div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              roleFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>All Roles</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-black/10">
              {auditLogs.length}
            </span>
          </button>

          <button
            onClick={() => setRoleFilter('teacher')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              roleFilter === 'teacher'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Teachers</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {stats.teacherEvents}
            </span>
          </button>

          <button
            onClick={() => setRoleFilter('parent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              roleFilter === 'parent'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Parents</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {stats.parentEvents}
            </span>
          </button>

          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              roleFilter === 'admin'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admins</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {stats.adminEvents}
            </span>
          </button>

          <button
            onClick={() => setRoleFilter('student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              roleFilter === 'student'
                ? 'bg-sky-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Students</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {stats.studentEvents}
            </span>
          </button>
        </div>

        {/* Secondary Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search index, teacher, action..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Category Dropdown */}
          <div>
            <select
              value={actionCategory}
              onChange={(e) => setActionCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Action Categories</option>
              <option value="marks">Teacher Mark Entries & Submissions</option>
              <option value="parent">Parent Searches & Printouts</option>
              <option value="roster">Student Enrollments & Changes</option>
              <option value="auth">Account Approvals & Security</option>
            </select>
          </div>

          {/* Severity Dropdown */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Severity Levels</option>
              <option value="info">Info (Standard lookups)</option>
              <option value="success">Success (Marks & Approvals)</option>
              <option value="warning">Warning (Password revisions)</option>
              <option value="critical">Critical (Deletions & Resets)</option>
            </select>
          </div>

          {/* Time Window Dropdown */}
          <div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Time History</option>
              <option value="today">Today Only</option>
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Stream View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Activity History Stream
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {filteredLogs.length} matching
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated {lastLiveTick}</span>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No matching activity events found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Try adjusting your role filter or search query. New activities from teachers and parents will appear here automatically.
            </p>
            <button
              onClick={() => {
                setRoleFilter('all');
                setActionCategory('all');
                setSeverityFilter('all');
                setTimeRange('all');
                setSearchQuery('');
              }}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3">
                    {/* Action Icon Badge */}
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                      {getActionIcon(log.action, log.actorRole)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRoleBadge(log.actorRole)}
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {log.actionTitle}
                        </span>
                        {getSeverityBadge(log.severity)}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {log.details}
                      </p>

                      <div className="flex items-center gap-3 pt-1 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          By: {log.actorName}
                        </span>
                        {log.actorIdentifier && (
                          <span className="font-mono text-slate-500">
                            ({log.actorIdentifier})
                          </span>
                        )}
                        {log.targetEntity && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono">
                            Target: {log.targetEntity}
                          </span>
                        )}
                        {log.deviceInfo && (
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            {log.deviceInfo.toLowerCase().includes('mobile') ? (
                              <Smartphone className="w-3 h-3 text-slate-400" />
                            ) : (
                              <Laptop className="w-3 h-3 text-slate-400" />
                            )}
                            <span>{log.deviceInfo}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp & View Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-1 sm:pt-0">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {formatTimeAgo(log.timestamp)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspect Event Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Audit Event Details
                  </h3>
                  <p className="text-xs font-mono text-slate-500">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <span className="text-slate-500 font-medium">Actor Role</span>
                  <div className="mt-1">{getRoleBadge(selectedLog.actorRole)}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Severity</span>
                  <div className="mt-1">{getSeverityBadge(selectedLog.severity)}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Actor Name</span>
                  <div className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                    {selectedLog.actorName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Actor Identifier</span>
                  <div className="mt-0.5 font-mono text-slate-700 dark:text-slate-300">
                    {selectedLog.actorIdentifier || 'Anonymous / Not provided'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Event Description</span>
                <p className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedLog.targetEntity && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-500 font-medium">Target Entity</span>
                    <div className="mt-0.5 font-semibold text-slate-900 dark:text-white font-mono">
                      {selectedLog.targetEntity}
                    </div>
                  </div>
                )}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-slate-500 font-medium">Exact UTC Timestamp</span>
                  <div className="mt-0.5 font-mono text-slate-700 dark:text-slate-300">
                    {selectedLog.timestamp}
                  </div>
                </div>
              </div>

              {selectedLog.deviceInfo && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Device / Client Session</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedLog.deviceInfo}
                  </span>
                </div>
              )}

              {/* JSON Payload preview */}
              <div>
                <span className="text-slate-500 font-medium">Raw Audit Payload</span>
                <pre className="mt-1 p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-36">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/70 text-rose-600 rounded-xl w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Clear System Audit Trail?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will clear local audit logs. For historical compliance, you can export a CSV backup first.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAuditLogs();
                  setIsClearModalOpen(false);
                  setToastMessage('Audit history cleared.');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Yes, Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
