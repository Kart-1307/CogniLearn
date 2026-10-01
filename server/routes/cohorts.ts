import express, { Request, Response } from 'express';
import { getSupabase, mapCohortFromDB, mapEnrollmentFromDB, mapUserFromDB } from '../supabase';
import { memoryStore } from '../memoryStore';
import { authenticateToken, requireRole } from '../authMiddleware';
import { cohortSchema, joinCohortSchema } from '../../src/schemas/academic';

const router = express.Router();

function generateCohortCode(tier: string, standardOrDept?: string, section?: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const prefix = tier === 'school' ? 'SCH' : 'COL';
  return `${prefix}-${rand}`;
}

// GET /api/cohorts/verify/:code - Preview cohort info before student joins
router.get('/verify/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawCode = req.params.code?.trim().toUpperCase();
    if (!rawCode) {
      res.status(400).json({ message: 'Cohort code is required' });
      return;
    }

    const supabase = getSupabase();

    if (supabase) {
      const { data: cohort, error } = await supabase
        .from('cohorts')
        .select(`
          id, code, tier, name, standard, department, school_stream,
          academic_year, semester, section, subject, room,
          teacher:users!cohorts_teacher_id_fkey(full_name, email)
        `)
        .ilike('code', rawCode)
        .maybeSingle();

      if (error || !cohort) {
        res.status(404).json({ message: 'Class cohort not found with code: ' + rawCode });
        return;
      }

      const teacherName = (cohort as any).teacher?.full_name || 'Assigned Instructor';

      res.json({
        cohort: {
          id: cohort.id,
          code: cohort.code,
          tier: cohort.tier,
          name: cohort.name,
          standard: cohort.standard,
          department: cohort.department,
          schoolStream: cohort.school_stream,
          academicYear: cohort.academic_year,
          semester: cohort.semester,
          section: cohort.section,
          subject: cohort.subject,
          room: cohort.room,
          teacherName,
        },
      });
      return;
    }

    // Memory Store Fallback
    const memCohort = memoryStore.cohorts.findByCode(rawCode);
    if (!memCohort) {
      res.status(404).json({ message: 'Class cohort not found with code: ' + rawCode });
      return;
    }

    res.json({
      cohort: {
        id: memCohort._id,
        code: memCohort.code,
        tier: memCohort.tier,
        name: memCohort.name,
        standard: memCohort.standard,
        department: memCohort.department,
        schoolStream: memCohort.schoolStream,
        academicYear: memCohort.academicYear,
        semester: memCohort.semester,
        section: memCohort.section,
        subject: memCohort.subject,
        room: memCohort.room,
        teacherName: memCohort.teacherName || 'Assigned Instructor',
      },
    });
  } catch (error) {
    console.error('[Cohort Verify Error]:', error);
    res.status(500).json({ message: 'Failed to verify class code' });
  }
});

// POST /api/cohorts/join - Student joins a cohort via join code + roll number
router.post('/join', authenticateToken, requireRole(['student']), async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = (req as any).userId;
    const parsed = joinCohortSchema.safeParse(req.body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues?.[0]?.message || 'Invalid join parameters';
      res.status(400).json({ message: errorMsg });
      return;
    }

    const { code, rollNo } = parsed.data;
    const cleanCode = code.trim().toUpperCase();
    const cleanRollNo = rollNo.trim();

    const supabase = getSupabase();

    if (supabase) {
      // 1. Locate cohort
      const { data: cohort, error: cohortError } = await supabase
        .from('cohorts')
        .select('*')
        .ilike('code', cleanCode)
        .maybeSingle();

      if (cohortError || !cohort) {
        res.status(404).json({ message: 'Cohort not found with code ' + cleanCode });
        return;
      }

      // 2. Check if student already enrolled in this cohort
      const { data: existingStudentEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('cohort_id', cohort.id)
        .eq('student_id', studentId)
        .maybeSingle();

      if (existingStudentEnrollment) {
        res.status(400).json({ message: 'You are already enrolled in this class cohort' });
        return;
      }

      // 3. Check if roll number already taken in this cohort (unique per cohort)
      const { data: existingRoll } = await supabase
        .from('enrollments')
        .select('id')
        .eq('cohort_id', cohort.id)
        .ilike('roll_no', cleanRollNo)
        .maybeSingle();

      if (existingRoll) {
        res.status(400).json({ message: `Roll number ${cleanRollNo} is already registered in this class` });
        return;
      }

      // 4. Create enrollment
      const enrolledSubjects = [cohort.subject].filter(Boolean);
      const { data: newEnrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          cohort_id: cohort.id,
          student_id: studentId,
          roll_no: cleanRollNo,
          enrolled_subjects: enrolledSubjects,
          status: 'active',
        })
        .select()
        .single();

      if (enrollError || !newEnrollment) {
        console.error('[Supabase Cohort Join Error]:', enrollError);
        res.status(500).json({ message: enrollError?.message || 'Failed to join cohort' });
        return;
      }

      // 5. Update student profile with cohort details
      const studentProfileUpdate: any = {
        tier: cohort.tier,
        grade_level: cohort.standard || (cohort.department ? `${cohort.department} (${cohort.semester || 'College'})` : 'Enrolled'),
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from('users')
        .update(studentProfileUpdate)
        .eq('id', studentId);

      res.status(201).json({
        message: `Successfully joined ${cohort.name}!`,
        enrollment: mapEnrollmentFromDB(newEnrollment),
        cohort: mapCohortFromDB(cohort),
      });
      return;
    }

    // Memory Store Fallback
    const memCohort = memoryStore.cohorts.findByCode(cleanCode);
    if (!memCohort) {
      res.status(404).json({ message: 'Cohort not found with code ' + cleanCode });
      return;
    }

    const existingStudentEnrollment = memoryStore.enrollments.findByCohortAndStudent(memCohort._id, studentId);
    if (existingStudentEnrollment) {
      res.status(400).json({ message: 'You are already enrolled in this class cohort' });
      return;
    }

    const existingRoll = memoryStore.enrollments.findByCohortAndRollNo(memCohort._id, cleanRollNo);
    if (existingRoll) {
      res.status(400).json({ message: `Roll number ${cleanRollNo} is already registered in this class` });
      return;
    }

    const enrolledSubjects = [memCohort.subject].filter(Boolean);
    const newEnrollment = memoryStore.enrollments.create({
      cohortId: memCohort._id,
      studentId,
      rollNo: cleanRollNo,
      enrolledSubjects,
    });

    // Update user profile in memory
    memoryStore.users.update(studentId, {
      tier: memCohort.tier,
      rollNo: cleanRollNo,
      gradeLevel: memCohort.standard || `${memCohort.department || 'College'} ${memCohort.semester || ''}`,
      enrolledSubjects,
    });

    res.status(201).json({
      message: `Successfully joined ${memCohort.name}!`,
      enrollment: newEnrollment,
      cohort: memCohort,
    });
  } catch (error) {
    console.error('[Cohort Join Error]:', error);
    res.status(500).json({ message: 'Internal server error while joining class' });
  }
});

// POST /api/cohorts - Teacher creates a new class cohort with join code
router.post('/', authenticateToken, requireRole(['teacher']), async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = (req as any).userId;
    const parsed = cohortSchema.safeParse(req.body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues?.[0]?.message || 'Invalid cohort parameters';
      res.status(400).json({ message: errorMsg });
      return;
    }

    const data = parsed.data;
    const code = generateCohortCode(data.tier, data.standard || data.department, data.section);

    const supabase = getSupabase();

    if (supabase) {
      const { data: newCohort, error } = await supabase
        .from('cohorts')
        .insert({
          code,
          tier: data.tier,
          name: data.name,
          standard: data.standard || null,
          department: data.department || null,
          school_stream: data.schoolStream || null,
          academic_year: data.academicYear,
          semester: data.semester || null,
          section: data.section,
          subject: data.subject,
          room: data.room || null,
          teacher_id: teacherId,
        })
        .select()
        .single();

      if (error || !newCohort) {
        console.error('[Supabase Create Cohort Error]:', error);
        res.status(500).json({ message: error?.message || 'Failed to create cohort' });
        return;
      }

      // Also create teacher assignment entry
      await supabase.from('teacher_assignments').insert({
        teacher_id: teacherId,
        cohort_id: newCohort.id,
        subject: data.subject,
        role: 'Subject Teacher',
      });

      res.status(201).json({
        message: 'Class cohort created successfully',
        cohort: mapCohortFromDB(newCohort),
      });
      return;
    }

    // Memory Store Fallback
    const teacherUser = memoryStore.users.findById(teacherId);
    const teacherName = teacherUser?.fullName || 'Assigned Instructor';

    const newMemCohort = memoryStore.cohorts.create({
      code,
      tier: data.tier,
      name: data.name,
      standard: data.standard,
      department: data.department,
      schoolStream: data.schoolStream,
      academicYear: data.academicYear,
      semester: data.semester,
      section: data.section,
      subject: data.subject,
      room: data.room,
      teacherId,
      teacherName,
    });

    res.status(201).json({
      message: 'Class cohort created successfully',
      cohort: newMemCohort,
    });
  } catch (error) {
    console.error('[Create Cohort Error]:', error);
    res.status(500).json({ message: 'Internal server error while creating cohort' });
  }
});

// GET /api/cohorts/my - Get user's active cohorts (Teacher's classes or Student's enrolled cohorts)
router.get('/my', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    const supabase = getSupabase();

    if (supabase) {
      if (userRole === 'teacher') {
        const { data: cohorts, error } = await supabase
          .from('cohorts')
          .select(`
            *,
            enrollments(count)
          `)
          .eq('teacher_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase Get Teacher Cohorts Error]:', error);
          res.status(500).json({ message: 'Failed to fetch cohorts' });
          return;
        }

        const formatted = (cohorts || []).map((c: any) => ({
          ...mapCohortFromDB(c),
          studentCount: c.enrollments?.[0]?.count || 0,
        }));

        res.json({ cohorts: formatted });
        return;
      } else {
        // Student's enrolled cohorts
        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select(`
            *,
            cohort:cohorts(
              *,
              teacher:users!cohorts_teacher_id_fkey(full_name, email)
            )
          `)
          .eq('student_id', userId)
          .eq('status', 'active');

        if (error) {
          console.error('[Supabase Get Student Cohorts Error]:', error);
          res.status(500).json({ message: 'Failed to fetch enrolled classes' });
          return;
        }

        const formatted = (enrollments || []).map((e: any) => ({
          id: e.id,
          rollNo: e.roll_no,
          enrolledSubjects: e.enrolled_subjects || [],
          cohort: e.cohort ? {
            ...mapCohortFromDB(e.cohort),
            teacherName: e.cohort.teacher?.full_name || 'Assigned Instructor',
          } : null,
        }));

        res.json({ enrollments: formatted });
        return;
      }
    }

    // Memory Store Fallback
    if (userRole === 'teacher') {
      const teacherCohorts = memoryStore.cohorts.findByTeacherId(userId);
      const withCounts = teacherCohorts.map((c) => ({
        id: c._id,
        code: c.code,
        tier: c.tier,
        name: c.name,
        standard: c.standard,
        department: c.department,
        schoolStream: c.schoolStream,
        academicYear: c.academicYear,
        semester: c.semester,
        section: c.section,
        subject: c.subject,
        room: c.room,
        teacherId: c.teacherId,
        teacherName: c.teacherName,
        studentCount: memoryStore.enrollments.findByCohortId(c._id).length,
      }));
      res.json({ cohorts: withCounts });
      return;
    } else {
      const studentEnrollments = memoryStore.enrollments.findByStudentId(userId);
      const formatted = studentEnrollments.map((e) => {
        const cohort = memoryStore.cohorts.findById(e.cohortId);
        return {
          id: e._id,
          rollNo: e.rollNo,
          enrolledSubjects: e.enrolledSubjects,
          cohort: cohort ? {
            id: cohort._id,
            code: cohort.code,
            tier: cohort.tier,
            name: cohort.name,
            standard: cohort.standard,
            department: cohort.department,
            schoolStream: cohort.schoolStream,
            academicYear: cohort.academicYear,
            semester: cohort.semester,
            section: cohort.section,
            subject: cohort.subject,
            room: cohort.room,
            teacherName: cohort.teacherName,
          } : null,
        };
      });
      res.json({ enrollments: formatted });
      return;
    }
  } catch (error) {
    console.error('[Get My Cohorts Error]:', error);
    res.status(500).json({ message: 'Internal server error while fetching classes' });
  }
});

// GET /api/cohorts/:id/students - Teacher view students enrolled in this cohort
router.get('/:id/students', authenticateToken, requireRole(['teacher']), async (req: Request, res: Response): Promise<void> => {
  try {
    const cohortId = req.params.id;
    const supabase = getSupabase();

    if (supabase) {
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          id, roll_no, status, created_at,
          student:users!enrollments_student_id_fkey(id, full_name, email, avatar, xp, total_hours)
        `)
        .eq('cohort_id', cohortId)
        .order('roll_no', { ascending: true });

      if (error) {
        console.error('[Supabase Get Cohort Students Error]:', error);
        res.status(500).json({ message: 'Failed to fetch enrolled students' });
        return;
      }

      const students = (enrollments || []).map((e: any) => ({
        enrollmentId: e.id,
        rollNo: e.roll_no,
        status: e.status,
        joinedAt: e.created_at,
        studentId: e.student?.id,
        fullName: e.student?.full_name || 'Student',
        email: e.student?.email,
        avatar: e.student?.avatar,
        xp: e.student?.xp || 0,
        totalHours: e.student?.total_hours || 0,
      }));

      res.json({ students });
      return;
    }

    // Memory Store Fallback
    const enrollments = memoryStore.enrollments.findByCohortId(cohortId);
    const students = enrollments.map((e) => {
      const user = memoryStore.users.findById(e.studentId);
      return {
        enrollmentId: e._id,
        rollNo: e.rollNo,
        status: e.status,
        joinedAt: e.createdAt,
        studentId: user?._id,
        fullName: user?.fullName || 'Student',
        email: user?.email,
        avatar: user?.avatar,
        xp: user?.xp || 0,
        totalHours: user?.totalHours || 0,
      };
    });

    res.json({ students });
  } catch (error) {
    console.error('[Get Cohort Students Error]:', error);
    res.status(500).json({ message: 'Failed to fetch class roster' });
  }
});

export default router;
