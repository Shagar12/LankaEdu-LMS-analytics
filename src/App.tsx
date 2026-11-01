import React, { useState } from 'react';
import { LMSProvider, useLMS } from './context/LMSContext';
import { Header } from './components/Header';
import { FilterToolbar } from './components/FilterToolbar';
import { SchoolOverview } from './components/analytics/SchoolOverview';
import { ClassDivisionAnalytics } from './components/analytics/ClassDivisionAnalytics';
import { StudentListView } from './components/students/StudentListView';
import { StudentDetailModal } from './components/students/StudentDetailModal';
import { AddStudentModal } from './components/students/AddStudentModal';
import { BatchMarkEntry } from './components/batch/BatchMarkEntry';
import { TeachersAndSubjectsModule } from './components/teachers/TeachersAndSubjectsModule';
import { DataManagement } from './components/data/DataManagement';
import { ParentPortalView } from './components/parent/ParentPortalView';
import { TeacherPortalView } from './components/teacher/TeacherPortalView';
import { AdminSettingsView } from './components/settings/AdminSettingsView';

import { UnifiedAuthPortal } from './components/auth/UnifiedAuthPortal';
import { PendingReviewLockedState } from './components/auth/PendingReviewLockedState';
import { AccountApprovalsPanel } from './components/admin/AccountApprovalsPanel';
import { AuditTrailView } from './components/admin/AuditTrailView';
import { BootLoader } from './components/common/BootLoader';

const LMSDashboardContent: React.FC = () => {
  const {
    activeTab,
    selectedStudentId,
    setSelectedStudentId,
    currentRole,
    isPendingReview,
    showLandingPage,
  } = useLMS();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBooting, setIsBooting] = useState<boolean>(true);

  // 0. Pre-flight Bootloading Interface & Subsystem Check
  if (isBooting) {
    return <BootLoader onComplete={() => setIsBooting(false)} />;
  }

  // 1. If user registration is pending administrator review
  if (isPendingReview) {
    return <PendingReviewLockedState />;
  }

  // 2. If user is unauthenticated or has requested the Landing Portal
  if (showLandingPage) {
    return (
      <>
        <UnifiedAuthPortal />
        {/* Floating Bootloader / Diagnostics Launcher */}
        <button
          onClick={() => setIsBooting(true)}
          title="Run System Diagnostics & Dual Backend Handshake"
          className="fixed bottom-4 right-4 z-40 px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-sm transition-all flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Health & Diagnostics</span>
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-indigo-500/20 selection:text-indigo-700 dark:selection:text-indigo-300">
      
      {/* Top Header with Role Switcher & Bootloader Trigger */}
      <Header
        onOpenAddStudent={() => setIsAddModalOpen(true)}
        onOpenBootloader={() => setIsBooting(true)}
      />

      {/* Filter Toolbar for Grades, Divisions & Terms */}
      {!(
        (currentRole === 'parent' && activeTab === 'students') ||
        (currentRole === 'student' && activeTab === 'students') ||
        activeTab === 'settings' ||
        activeTab === 'approvals' ||
        activeTab === 'audit_trail'
      ) && <FilterToolbar />}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Parent Portal Role Views */}
        {currentRole === 'parent' && (
          <>
            {activeTab === 'students' && <ParentPortalView />}
            {activeTab === 'overview' && <SchoolOverview />}
            {activeTab !== 'students' && activeTab !== 'overview' && <ParentPortalView />}
          </>
        )}

        {/* Student Portal Role Views */}
        {currentRole === 'student' && (
          <>
            {activeTab === 'students' && <ParentPortalView />}
            {activeTab === 'overview' && <SchoolOverview />}
            {activeTab !== 'students' && activeTab !== 'overview' && <ParentPortalView />}
          </>
        )}

        {/* Teacher Portal Role Views */}
        {currentRole === 'teacher' && (
          <>
            {activeTab === 'teachers_subjects' && <TeacherPortalView />}
            {activeTab === 'batch_entry' && <BatchMarkEntry />}
            {activeTab === 'analytics' && <ClassDivisionAnalytics />}
            {activeTab === 'students' && (
              <StudentListView onOpenAddStudent={() => setIsAddModalOpen(true)} />
            )}
            {activeTab === 'overview' && <SchoolOverview />}
          </>
        )}

        {/* Administrator Role Views (Full Access) */}
        {currentRole === 'admin' && (
          <>
            {activeTab === 'overview' && <SchoolOverview />}
            {activeTab === 'approvals' && <AccountApprovalsPanel />}
            {activeTab === 'analytics' && <ClassDivisionAnalytics />}
            {activeTab === 'students' && (
              <StudentListView onOpenAddStudent={() => setIsAddModalOpen(true)} />
            )}
            {activeTab === 'batch_entry' && <BatchMarkEntry />}
            {activeTab === 'teachers_subjects' && <TeachersAndSubjectsModule />}
            {activeTab === 'data_management' && <DataManagement />}
            {activeTab === 'settings' && <AdminSettingsView />}
            {activeTab === 'audit_trail' && <AuditTrailView />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 transition-colors no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              LankaEdu LMS & Analytics System
            </span>
            <span>·</span>
            <span>Sri Lankan National Curriculum (Grades 1–13)</span>
          </div>
          <div>
            <span>Ministry of Education Grading Standards Automated · 2026 Academic Cycle</span>
          </div>
        </div>
      </footer>

      {/* Student Performance & Report Card Modal */}
      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <AddStudentModal onClose={() => setIsAddModalOpen(false)} />
      )}

    </div>
  );
};

export default function App() {
  return (
    <LMSProvider>
      <LMSDashboardContent />
    </LMSProvider>
  );
}
