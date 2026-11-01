import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import {
  upsertUser,
  getDbUsers,
  updateUserRole,
  saveMarkSubmission,
  getDbMarkSubmissions,
  getDbCurriculumStandards,
  recordAudit,
  getDbAuditLogs,
} from './src/db/queries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. System Health Check Endpoint (Cloud SQL, Supabase-compatible PostgreSQL, and Firebase Admin)
  app.get('/api/health', async (req, res) => {
    try {
      const standards = await getDbCurriculumStandards();
      res.json({
        status: 'ok',
        database: 'PostgreSQL 16 (Cloud SQL / Supabase compatible)',
        tables: ['users', 'mark_submissions', 'curriculum_standards', 'audit_logs'],
        curriculumItemsLoaded: standards.length,
        timestamp: new Date().toISOString(),
        engine: 'Express + Drizzle ORM + Firebase Admin SDK',
      });
    } catch (error: any) {
      res.status(200).json({
        status: 'degraded',
        database: 'PostgreSQL',
        error: error.message || 'Database connection notice',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 2. Users API (Relational PostgreSQL + Supabase schema query)
  app.get('/api/users', async (req, res) => {
    try {
      const users = await getDbUsers();
      res.json({ users });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch users' });
    }
  });

  // 3. Dual-sync User between Firestore & PostgreSQL
  app.post('/api/users/sync', async (req, res) => {
    try {
      const { uid, email, fullName, phone, assignedRole, status, indexNumber } = req.body;
      if (!uid || !email) {
        return res.status(400).json({ error: 'Missing required uid or email' });
      }

      const user = await upsertUser({
        uid,
        email,
        fullName,
        phone,
        assignedRole,
        status,
        indexNumber,
      });

      await recordAudit('USER_SYNC', email, `Role: ${assignedRole}, Status: ${status}`, req.ip);
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // 4. Role Assignment & Account Approval
  app.post('/api/users/assign-role', async (req, res) => {
    try {
      const { uid, status, assignedRole, indexNumber, adminEmail } = req.body;
      if (!uid || !status || !assignedRole) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const updated = await updateUserRole(uid, status, assignedRole, indexNumber);
      await recordAudit(
        'ROLE_ASSIGNMENT',
        adminEmail || 'admin',
        `Assigned ${assignedRole} (status: ${status}) to UID ${uid}`,
        req.ip
      );

      res.json({ success: true, user: updated });
    } catch (error: any) {
      console.error('Error assigning user role:', error);
      res.status(500).json({ error: error.message || 'Failed to update user role' });
    }
  });

  // 5. Mark Submissions API
  app.get('/api/marks/submissions', async (req, res) => {
    try {
      const submissions = await getDbMarkSubmissions();
      res.json({ submissions });
    } catch (error: any) {
      console.error('Error in /api/marks/submissions:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch mark submissions' });
    }
  });

  app.post('/api/marks/submit', async (req, res) => {
    try {
      const {
        submissionKey,
        teacherId,
        teacherName,
        subjectId,
        grade,
        division,
        term,
        status,
        marksJson,
        notes,
      } = req.body;

      if (!submissionKey || !teacherId || !subjectId || grade == null || !division || term == null) {
        return res.status(400).json({ error: 'Missing required mark submission payload fields' });
      }

      const saved = await saveMarkSubmission({
        submissionKey,
        teacherId,
        teacherName,
        subjectId,
        grade: Number(grade),
        division,
        term: Number(term),
        status,
        marksJson: typeof marksJson === 'string' ? marksJson : JSON.stringify(marksJson),
        notes,
      });

      await recordAudit(
        'MARK_SUBMISSION',
        teacherName || teacherId,
        `Submission ${submissionKey} for Grade ${grade}-${division} Term ${term}`,
        req.ip
      );

      res.json({ success: true, submission: saved });
    } catch (error: any) {
      console.error('Error submitting marks:', error);
      res.status(500).json({ error: error.message || 'Failed to record mark submission' });
    }
  });

  // 6. National Curriculum standards
  app.get('/api/curriculum/standards', async (req, res) => {
    try {
      const standards = await getDbCurriculumStandards();
      res.json({ standards });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch standards' });
    }
  });

  // 7. System Audit Logs API (Cloud SQL & Supabase persistence)
  app.get('/api/audit-logs', async (req, res) => {
    try {
      const logs = await getDbAuditLogs(200);
      res.json({ logs });
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
    }
  });

  app.post('/api/audit-logs', async (req, res) => {
    try {
      const { action, userEmail, details, ipAddress } = req.body;
      await recordAudit(action || 'USER_ACTION', userEmail, details, ipAddress || req.ip);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error recording audit log:', error);
      res.status(500).json({ error: error.message || 'Failed to record audit log' });
    }
  });

  // 8. Vite Integration (Mount vite.middlewares in dev mode, static in prod)
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LankaEdu LMS Unified Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
