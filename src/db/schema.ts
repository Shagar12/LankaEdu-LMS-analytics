import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// LankaEdu LMS Users table (synchronized with Firebase Auth & Profile)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name'),
  phone: text('phone'),
  assignedRole: text('assigned_role').notNull().default('unassigned'), // 'unassigned' | 'teacher' | 'student' | 'admin'
  status: text('status').notNull().default('pending'), // 'pending' | 'active' | 'rejected'
  indexNumber: text('index_number'), // Student examination index e.g. IDX-849102
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Mark submissions submitted by teachers
export const markSubmissions = pgTable('mark_submissions', {
  id: serial('id').primaryKey(),
  submissionKey: text('submission_key').notNull().unique(), // e.g. subm_math_10A_t1
  teacherId: text('teacher_id').notNull(),
  teacherName: text('teacher_name'),
  subjectId: text('subject_id').notNull(),
  grade: integer('grade').notNull(), // 1 - 13
  division: text('division').notNull(), // 'A' | 'B' | 'C'
  term: integer('term').notNull(), // 1 | 2 | 3
  status: text('status').notNull().default('submitted'), // 'draft' | 'submitted' | 'approved'
  marksJson: text('marks_json'), // Serialized JSON student scores
  notes: text('notes'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Sri Lankan National Curriculum standards cache & reference
export const curriculumStandards = pgTable('curriculum_standards', {
  id: serial('id').primaryKey(),
  grade: integer('grade').notNull(),
  stream: text('stream').default('general'), // 'general', 'commerce', 'bio_science', 'physical_science', 'arts', 'technology'
  subjectCode: text('subject_code').notNull(),
  subjectName: text('subject_name').notNull(),
  creditPassMark: integer('credit_pass_mark').notNull().default(55),
  distinctionMark: integer('distinction_mark').notNull().default(75),
  createdAt: timestamp('created_at').defaultNow(),
});

// System & RBAC Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(),
  userEmail: text('user_email'),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});
