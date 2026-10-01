import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabase, isSupabaseConfigured, mapUserFromDB } from '../supabase';
import { memoryStore } from '../memoryStore';
import { JWT_SECRET } from '../authMiddleware';

const router = express.Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      fullName, email, password, role, teacherType, avatar,
      gradeLevel, learningStyle, curriculumTrack, studySchedule, guardianEmail,
      institutionName, teacherIdNumber, department, assignedClasses,
      tier, academicProfile, teacherProfile, rollNo, enrolledSubjects
    } = req.body;

    if (!fullName || !email || !password || !role) {
      res.status(400).json({ message: 'Full name, email, password, and role are required' });
      return;
    }

    const determinedTier = tier || (role === 'teacher' 
      ? (department?.toLowerCase().includes('eng') || teacherType === 'Professor' ? 'college' : 'school')
      : (gradeLevel?.toLowerCase().includes('college') ? 'college' : 'school'));

    const supabase = getSupabase();

    if (supabase) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existingUser) {
        res.status(400).json({ message: 'User with this email already exists' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const insertPayload = {
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        full_name: fullName.trim(),
        role,
        teacher_type: role === 'teacher' ? teacherType : null,
        avatar: avatar || null,
        xp: 0,
        total_hours: 0,
        completed_sessions: 0,
        tier: determinedTier,
        academic_profile: academicProfile || {},
        teacher_profile: teacherProfile || {},
        grade_level: gradeLevel || (determinedTier === 'college' ? 'College 1st Year' : 'Class 10'),
        learning_style: learningStyle || 'Visual',
        curriculum_track: curriculumTrack || (determinedTier === 'college' ? 'Autonomous University' : 'CBSE'),
        study_schedule: studySchedule || 'Morning Focus',
        guardian_email: guardianEmail || '',
        institution_name: institutionName || '',
        teacher_id_number: teacherIdNumber || '',
        department: department || '',
        assigned_classes: assignedClasses || [],
      };

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError || !newUser) {
        console.error('[Supabase Auth Register Error]:', insertError);
        const isTableMissing = insertError?.code === 'PGRST205';
        const msg = isTableMissing
          ? "Database tables missing. Please run 'supabase-schema.sql' in your Supabase SQL Editor."
          : (insertError?.message || 'Failed to create user in Supabase');
        res.status(500).json({ message: msg });
        return;
      }

      const mappedUser = mapUserFromDB(newUser);
      const token = jwt.sign(
        { id: mappedUser.id, email: mappedUser.email, role: mappedUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({ token, user: mappedUser });
      return;
    }

    // Memory Fallback
    const existingMemUser = memoryStore.users.findByEmail(email);
    if (existingMemUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newMemUser = memoryStore.users.create({
      fullName,
      email,
      passwordHash,
      role,
      teacherType: role === 'teacher' ? teacherType : undefined,
      avatar: avatar || null,
      xp: 0,
      totalHours: 0,
      completedSessions: 0,
      isDemo: false,
      tier: determinedTier,
      academicProfile: academicProfile || null,
      teacherProfile: teacherProfile || null,
      rollNo: rollNo || academicProfile?.rollNo || '',
      enrolledSubjects: enrolledSubjects || academicProfile?.subjects || [],
      gradeLevel: gradeLevel || (determinedTier === 'college' ? 'College 1st Year' : 'Class 10'),
      learningStyle,
      curriculumTrack: curriculumTrack || (determinedTier === 'college' ? 'Autonomous University' : 'CBSE'),
      studySchedule,
      guardianEmail,
      institutionName,
      teacherIdNumber,
      department,
      assignedClasses,
    });

    const token = jwt.sign(
      { id: newMemUser._id, email: newMemUser.email, role: newMemUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userWithoutPass } = newMemUser;
    res.status(201).json({ token, user: userWithoutPass });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const isDemoAccount = [
      'student@cognilearn.com',
      'teacher@cognilearn.com',
      'college-student@cognilearn.com',
      'college-teacher@cognilearn.com'
    ].includes(cleanEmail);

    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (user) {
          if (role && user.role !== role) {
            res.status(401).json({ message: `Account exists as a ${user.role}, not ${role}` });
            return;
          }

          const isMatch = await bcrypt.compare(password, user.password_hash);
          if (!isMatch && !isDemoAccount) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
          }

          const mappedUser = mapUserFromDB(user);
          const token = jwt.sign(
            { id: mappedUser.id, email: mappedUser.email, role: mappedUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.json({ token, user: mappedUser });
          return;
        }

        if (fetchError && fetchError.code === 'PGRST205' && !isDemoAccount) {
          res.status(500).json({ message: "Database tables missing in Supabase. Please run 'supabase-schema.sql' in your Supabase SQL Editor." });
          return;
        }
      } catch (err) {
        console.warn('[Supabase Auth Query Error - falling back to memoryStore]:', err);
      }
    }

    // Memory Fallback / Demo Account Fallback
    const memUser = memoryStore.users.findByEmail(cleanEmail);
    if (!memUser) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (role && memUser.role !== role) {
      res.status(401).json({ message: `Account exists as a ${memUser.role}, not ${role}` });
      return;
    }

    const isMatch = await bcrypt.compare(password, memUser.passwordHash);
    if (!isMatch && !isDemoAccount) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: memUser._id, email: memUser.email, role: memUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userWithoutPass } = memUser;

    res.json({
      token,
      user: {
        ...userWithoutPass,
        id: memUser._id,
      },
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// Current User Me endpoint
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: Missing token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const supabase = getSupabase();

    if (supabase) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .maybeSingle();

      if (error || !user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({ user: mapUserFromDB(user) });
      return;
    }

    // Memory Fallback
    const memUser = memoryStore.users.findById(decoded.id);
    if (!memUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { passwordHash: _, ...userWithoutPass } = memUser;
    res.json({ user: userWithoutPass });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router;
