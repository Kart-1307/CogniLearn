-- ==============================================================================
-- CogniLearn Migration: School & College Academic Cohorts, Enrollments & Profiles
-- Migration Date: 2026-10-01
-- ==============================================================================

-- 1. Institutions Table (School or College / University)
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('school', 'college')),
  board_or_affiliation TEXT DEFAULT '',
  state_or_region TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Cohorts Table (Class sections with 6-char unique join code)
CREATE TABLE IF NOT EXISTS public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  code TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('school', 'college')),
  name TEXT NOT NULL,
  standard TEXT,                     -- School: 'Class 6' ... 'Class 12'
  department TEXT,                   -- College: 'Computer Science & Engineering', etc.
  school_stream TEXT,                -- School: 'Science (PCM)', etc.
  academic_year TEXT NOT NULL,       -- '2026-2027'
  semester TEXT,                     -- College: 'Semester 5', etc.
  section TEXT NOT NULL,             -- 'A', 'B', 'C', etc.
  subject TEXT NOT NULL,
  room TEXT,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enrollments Table (Unique roll number scoped PER COHORT)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  roll_no TEXT NOT NULL,
  enrolled_subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (cohort_id, student_id),
  UNIQUE (cohort_id, roll_no)
);

-- 4. Teacher Assignments Table
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  role TEXT DEFAULT 'Subject Teacher',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (teacher_id, cohort_id, subject)
);

-- 5. Extend Users Table with Tier & JSONB Profiles
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('school', 'college')),
  ADD COLUMN IF NOT EXISTS academic_profile JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS teacher_profile JSONB DEFAULT '{}'::jsonb;

-- 6. Safe Backfill Query for existing users
UPDATE public.users 
SET tier = CASE 
  WHEN grade_level ILIKE '%college%' OR department ILIKE '%engineering%' OR department ILIKE '%computer science%' THEN 'college'
  ELSE 'school'
END
WHERE tier IS NULL;

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cohorts_code ON public.cohorts(code);
CREATE INDEX IF NOT EXISTS idx_cohorts_teacher_id ON public.cohorts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_tier ON public.cohorts(tier);
CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON public.enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON public.teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_cohort_id ON public.teacher_assignments(cohort_id);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to institutions" ON public.institutions FOR ALL USING (true);
CREATE POLICY "Allow service role full access to cohorts" ON public.cohorts FOR ALL USING (true);
CREATE POLICY "Allow service role full access to enrollments" ON public.enrollments FOR ALL USING (true);
CREATE POLICY "Allow service role full access to teacher_assignments" ON public.teacher_assignments FOR ALL USING (true);

-- 9. Add Cohorts & Enrollments to Realtime Publication if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cohorts') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.cohorts;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'enrollments') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments;
    END IF;
  END IF;
END $$;
