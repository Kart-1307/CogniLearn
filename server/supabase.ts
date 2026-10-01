import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let initialized = false;

export function getSupabase(): SupabaseClient | null {
  if (initialized) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log(`[Supabase]: Connected to Supabase at ${supabaseUrl}`);
    } catch (err) {
      console.warn('[Supabase Warning]: Failed to initialize Supabase client:', (err as Error).message);
      supabaseInstance = null;
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.error('\n❌ [FATAL DATABASE ERROR]: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production.');
      console.error('In-memory fallback is strictly disabled in production to prevent silent data loss on stateless cloud workers.\n');
      process.exit(1);
    }
    console.log('[Supabase]: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY not provided. Operating in development in-memory mode.');
    supabaseInstance = null;
  }

  initialized = true;
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

// Convert DB user row (snake_case) to application User shape (camelCase)
export function mapUserFromDB(row: any): any {
  if (!row) return null;
  const isDemo = row.email === 'student@cognilearn.com' ||
    row.email === 'teacher@cognilearn.com' ||
    row.email === 'college-student@cognilearn.com' ||
    row.email === 'college-teacher@cognilearn.com';

  return {
    _id: row.id,
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    teacherType: row.teacher_type,
    avatar: row.avatar,
    xp: Number(row.xp || 0),
    totalHours: Number(row.total_hours || 0),
    completedSessions: Number(row.completed_sessions || 0),
    isDemo,
    tier: row.tier || (row.grade_level?.toLowerCase().includes('college') ? 'college' : 'school'),
    academicProfile: row.academic_profile || null,
    teacherProfile: row.teacher_profile || null,
    gradeLevel: row.grade_level,
    learningStyle: row.learning_style,
    curriculumTrack: row.curriculum_track,
    studySchedule: row.study_schedule,
    guardianEmail: row.guardian_email,
    institutionName: row.institution_name,
    teacherIdNumber: row.teacher_id_number,
    department: row.department,
    assignedClasses: row.assigned_classes || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert DB cohort row (snake_case) to application Cohort shape
export function mapCohortFromDB(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    tier: row.tier,
    name: row.name,
    standard: row.standard,
    department: row.department,
    schoolStream: row.school_stream,
    academicYear: row.academic_year,
    semester: row.semester,
    section: row.section,
    subject: row.subject,
    room: row.room,
    teacherId: row.teacher_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert DB enrollment row (snake_case) to application Enrollment shape
export function mapEnrollmentFromDB(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    cohortId: row.cohort_id,
    studentId: row.student_id,
    rollNo: row.roll_no,
    enrolledSubjects: row.enrolled_subjects || [],
    status: row.status || 'active',
    cohort: row.cohorts ? mapCohortFromDB(row.cohorts) : undefined,
    student: row.users ? mapUserFromDB(row.users) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert DB study session row to application StudySession shape
export function mapSessionFromDB(row: any): any {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    studentId: row.student_id,
    durationMinutes: Number(row.duration_minutes),
    xpEarned: Number(row.xp_earned),
    avgFocusScore: Number(row.avg_focus_score || 85),
    sessionType: row.session_type || 'Focus Session',
    telemetry: row.telemetry || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert DB baseline score row to application BaselineScore shape
export function mapScoreFromDB(row: any): any {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    studentId: row.student_id,
    subject: row.subject,
    cognitiveScore: Number(row.cognitive_score),
    focusIndex: Number(row.focus_index),
    retentionRate: Number(row.retention_rate),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
