import { db } from './index.ts';
import { users, markSubmissions, curriculumStandards, auditLogs } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

// Two-layer sanitized query helper for User Upsert
export async function upsertUser(data: {
  uid: string;
  email: string;
  fullName?: string;
  phone?: string;
  assignedRole?: string;
  status?: string;
  indexNumber?: string;
}) {
  try {
    const result = await db.insert(users)
      .values({
        uid: data.uid,
        email: data.email,
        fullName: data.fullName || '',
        phone: data.phone || '',
        assignedRole: data.assignedRole || 'unassigned',
        status: data.status || 'pending',
        indexNumber: data.indexNumber || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: data.email,
          fullName: data.fullName || '',
          phone: data.phone || '',
          assignedRole: data.assignedRole || 'unassigned',
          status: data.status || 'pending',
          indexNumber: data.indexNumber || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert user to relational store:', error);
    throw new Error('Database operation failed. Unable to persist user record.', { cause: error });
  }
}

// Retrieve all users
export async function getDbUsers() {
  try {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error('Failed to fetch users from relational store:', error);
    throw new Error('Database query failed. Unable to fetch users.', { cause: error });
  }
}

// Update user status and assigned role
export async function updateUserRole(uid: string, status: string, assignedRole: string, indexNumber?: string) {
  try {
    const result = await db.update(users)
      .set({
        status,
        assignedRole,
        indexNumber: indexNumber || null,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to update user role:', error);
    throw new Error('Database update failed. Unable to update user role.', { cause: error });
  }
}

// Save / upsert mark submission
export async function saveMarkSubmission(data: {
  submissionKey: string;
  teacherId: string;
  teacherName?: string;
  subjectId: string;
  grade: number;
  division: string;
  term: number;
  status?: string;
  marksJson?: string;
  notes?: string;
}) {
  try {
    const result = await db.insert(markSubmissions)
      .values({
        submissionKey: data.submissionKey,
        teacherId: data.teacherId,
        teacherName: data.teacherName || '',
        subjectId: data.subjectId,
        grade: data.grade,
        division: data.division,
        term: data.term,
        status: data.status || 'submitted',
        marksJson: data.marksJson || '{}',
        notes: data.notes || '',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: markSubmissions.submissionKey,
        set: {
          teacherName: data.teacherName || '',
          status: data.status || 'submitted',
          marksJson: data.marksJson || '{}',
          notes: data.notes || '',
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to save mark submission:', error);
    throw new Error('Database operation failed. Unable to save mark submission.', { cause: error });
  }
}

// Get mark submissions
export async function getDbMarkSubmissions() {
  try {
    return await db.select().from(markSubmissions).orderBy(desc(markSubmissions.submittedAt));
  } catch (error) {
    console.error('Failed to fetch mark submissions:', error);
    throw new Error('Database query failed. Unable to retrieve mark submissions.', { cause: error });
  }
}

// Get curriculum standards
export async function getDbCurriculumStandards() {
  try {
    return await db.select().from(curriculumStandards);
  } catch (error) {
    console.error('Failed to fetch curriculum standards:', error);
    throw new Error('Database query failed. Unable to load curriculum standards.', { cause: error });
  }
}

// Record audit log
export async function recordAudit(action: string, userEmail?: string, details?: string, ipAddress?: string) {
  try {
    await db.insert(auditLogs).values({
      action,
      userEmail: userEmail || 'system',
      details: details || '',
      ipAddress: ipAddress || '127.0.0.1',
    });
  } catch (error) {
    console.warn('Audit log write non-fatal notice:', error);
  }
}

// Retrieve audit logs from Cloud SQL
export async function getDbAuditLogs(limitCount = 100) {
  try {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limitCount);
  } catch (error) {
    console.warn('Failed to fetch audit logs from relational store:', error);
    return [];
  }
}

