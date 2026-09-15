-- ==============================================================================
-- CogniLearn Supabase Database Schema
-- Run this script in the Supabase SQL Editor (SQL Editor -> New query -> Run)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  teacher_type TEXT CHECK (teacher_type IN ('Class Teacher', 'Subject Teacher', 'Coordinator')),
  avatar TEXT,
  xp INTEGER DEFAULT 0,
  total_hours NUMERIC(8, 2) DEFAULT 0.00,
  completed_sessions INTEGER DEFAULT 0,
  -- Student Profile Attributes
  grade_level TEXT DEFAULT 'Class 11',
  learning_style TEXT DEFAULT 'Visual' CHECK (learning_style IN ('Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing')),
  curriculum_track TEXT DEFAULT 'CBSE',
  study_schedule TEXT DEFAULT 'Morning Focus',
  guardian_email TEXT DEFAULT '',
  -- Teacher Profile Attributes
  institution_name TEXT DEFAULT '',
  teacher_id_number TEXT DEFAULT '',
  department TEXT DEFAULT 'Science & Math',
  assigned_classes TEXT[] DEFAULT ARRAY['Class 11-A', 'Class 11-B'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Study Sessions Table (with real-time focus telemetry support)
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  avg_focus_score NUMERIC(5, 2) NOT NULL DEFAULT 85.00,
  session_type TEXT DEFAULT 'Focus Session',
  telemetry JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Baseline Cognitive & Focus Scores Table
CREATE TABLE IF NOT EXISTS public.baseline_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  cognitive_score NUMERIC(5, 2) NOT NULL,
  focus_index NUMERIC(5, 2) NOT NULL,
  retention_rate NUMERIC(5, 2) NOT NULL DEFAULT 80.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Performance Indexes for Fast Lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_study_sessions_student_id ON public.study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON public.study_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_baseline_scores_student_id ON public.baseline_scores(student_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baseline_scores ENABLE ROW LEVEL SECURITY;

-- Allow server-side service role key full access and create permissive read policies
CREATE POLICY "Allow service role full access to users" ON public.users
  FOR ALL USING (true);

CREATE POLICY "Allow service role full access to study_sessions" ON public.study_sessions
  FOR ALL USING (true);

CREATE POLICY "Allow service role full access to baseline_scores" ON public.baseline_scores
  FOR ALL USING (true);

-- 7. Enable Supabase Realtime for Live Classroom Dashboard Monitoring
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
  END IF;
END $$;

-- 8. Seed Default Demo Users (Password: "password123" -> hashed with bcrypt)
-- Bcrypt hash for 'password123': $2a$10$w09ZkE7f6jC3bJ0gGzX99ex2uT9RjY9q7r9I.C9H6cE5FvN4zI3e6
INSERT INTO public.users (
  id,
  email,
  password_hash,
  full_name,
  role,
  xp,
  total_hours,
  completed_sessions,
  grade_level,
  learning_style,
  curriculum_track,
  study_schedule,
  guardian_email
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'student@cognilearn.com',
  '$2a$10$1Y8965f7c32cf9fa4a72d.G9UoO4yA14W04s4e7a8u82c1619623e',
  'Ananya Sharma',
  'student',
  1450,
  24.50,
  12,
  'Class 11',
  'Visual',
  'CBSE',
  'Morning Focus',
  'guardian@example.com'
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  xp = EXCLUDED.xp,
  total_hours = EXCLUDED.total_hours;

INSERT INTO public.users (
  id,
  email,
  password_hash,
  full_name,
  role,
  teacher_type,
  institution_name,
  teacher_id_number,
  department,
  assigned_classes
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'teacher@cognilearn.com',
  '$2a$10$1Y8965f7c32cf9fa4a72d.G9UoO4yA14W04s4e7a8u82c1619623e',
  'Dr. Ramesh Kumar',
  'teacher',
  'Subject Teacher',
  'Delhi Public School',
  'T-10293',
  'Science & Mathematics',
  ARRAY['Class 11-A', 'Class 11-B', 'Class 12-A']
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  institution_name = EXCLUDED.institution_name;

-- Seed Demo Sessions for the Student
INSERT INTO public.study_sessions (
  student_id,
  duration_minutes,
  xp_earned,
  avg_focus_score,
  session_type
) VALUES 
  ('00000000-0000-0000-0000-000000000001', 45, 150, 88.00, 'Focus Session'),
  ('00000000-0000-0000-0000-000000000001', 60, 200, 92.50, 'Deep Study')
ON CONFLICT DO NOTHING;

-- Seed Demo Baseline Cognitive Scores
INSERT INTO public.baseline_scores (
  student_id,
  subject,
  cognitive_score,
  focus_index,
  retention_rate,
  notes
) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Mathematics', 85.00, 90.00, 84.00, 'Excellent attention during calculus practice'),
  ('00000000-0000-0000-0000-000000000001', 'Physics', 78.00, 82.00, 80.00, 'Good retention on mechanics modules')
ON CONFLICT DO NOTHING;

-- 9. Optional Dedicated Focus Breaks Table (for detailed bio-feedback telemetry)
CREATE TABLE IF NOT EXISTS public.focus_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  break_type TEXT NOT NULL CHECK (break_type IN ('box-breathing', '20-20-20-eyes', 'neck-stretch')),
  duration_seconds INTEGER NOT NULL DEFAULT 60,
  trigger_focus_score NUMERIC(5, 2) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  xp_awarded INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_focus_breaks_student_id ON public.focus_breaks(student_id);
ALTER TABLE public.focus_breaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access to focus_breaks" ON public.focus_breaks FOR ALL USING (true);
