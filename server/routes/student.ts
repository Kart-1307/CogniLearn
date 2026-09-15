import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase, mapUserFromDB, mapSessionFromDB } from '../supabase';
import { memoryStore } from '../memoryStore';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cognilearn_super_secret_jwt_key_2026';

// Middleware to extract user ID from auth header
const authenticateToken = (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized access' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    (req as any).userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET student stats & sessions
router.get('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const supabase = getSupabase();

    if (supabase) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !user) {
        res.status(404).json({ message: 'Student profile not found' });
        return;
      }

      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const mappedUser = mapUserFromDB(user);
      const mappedSessions = (sessions || []).map(mapSessionFromDB);

      res.json({ user: mappedUser, recentSessions: mappedSessions });
      return;
    }

    // Memory Fallback
    const memUser = memoryStore.users.findById(userId);
    if (!memUser) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }
    const { passwordHash: _, ...userWithoutPass } = memUser;
    const recentSessions = memoryStore.sessions.findByStudentId(userId).slice(0, 10);

    res.json({ user: userWithoutPass, recentSessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student profile' });
  }
});

// POST record focus study session & update XP / total hours
router.post('/session', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { durationMinutes, xpEarned, avgFocusScore, sessionType, telemetry } = req.body;

    if (!durationMinutes || xpEarned === undefined) {
      res.status(400).json({ message: 'durationMinutes and xpEarned are required' });
      return;
    }

    const supabase = getSupabase();

    if (supabase) {
      const sessionPayload = {
        student_id: userId,
        duration_minutes: durationMinutes,
        xp_earned: xpEarned,
        avg_focus_score: avgFocusScore || 85,
        session_type: sessionType || 'Focus Session',
        telemetry: telemetry || [],
      };

      const { data: session, error: sessionError } = await supabase
        .from('study_sessions')
        .insert(sessionPayload)
        .select()
        .single();

      if (sessionError) {
        console.error('[Supabase StudySession Insert Error]:', sessionError);
        res.status(500).json({ message: 'Failed to record study session' });
        return;
      }

      // Fetch user to increment stats
      const { data: currentUser } = await supabase
        .from('users')
        .select('xp, total_hours, completed_sessions')
        .eq('id', userId)
        .single();

      const currentXp = Number(currentUser?.xp || 0);
      const currentHours = Number(currentUser?.total_hours || 0);
      const currentSessions = Number(currentUser?.completed_sessions || 0);
      const hoursAdded = parseFloat((durationMinutes / 60).toFixed(2));

      const { data: updatedUser } = await supabase
        .from('users')
        .update({
          xp: currentXp + xpEarned,
          total_hours: parseFloat((currentHours + hoursAdded).toFixed(2)),
          completed_sessions: currentSessions + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      res.status(201).json({
        message: 'Session recorded successfully',
        session: mapSessionFromDB(session),
        user: mapUserFromDB(updatedUser),
      });
      return;
    }

    // Memory Fallback
    const session = memoryStore.sessions.create({
      studentId: userId,
      durationMinutes,
      xpEarned,
      avgFocusScore: avgFocusScore || 85,
    });

    const hoursAdded = parseFloat((durationMinutes / 60).toFixed(2));
    const memUser = memoryStore.users.findById(userId);
    let updatedUser = null;

    if (memUser) {
      updatedUser = memoryStore.users.update(userId, {
        xp: (memUser.xp || 0) + xpEarned,
        totalHours: parseFloat(((memUser.totalHours || 0) + hoursAdded).toFixed(2)),
        completedSessions: (memUser.completedSessions || 0) + 1,
      });
      if (updatedUser) {
        delete (updatedUser as any).passwordHash;
      }
    }

    res.status(201).json({
      message: 'Session recorded successfully',
      session,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Student Session Record Error]:', error);
    res.status(500).json({ message: 'Failed to save study session' });
  }
});

// POST update profile avatar base64 photo
router.post('/avatar', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { avatar } = req.body;

    if (!avatar) {
      res.status(400).json({ message: 'Avatar image string is required' });
      return;
    }

    const supabase = getSupabase();

    if (supabase) {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ avatar, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error || !updatedUser) {
        res.status(500).json({ message: 'Failed to update avatar photo in Supabase' });
        return;
      }

      res.json({ message: 'Avatar updated successfully', user: mapUserFromDB(updatedUser) });
      return;
    }

    // Memory Fallback
    const updatedUser = memoryStore.users.update(userId, { avatar });
    if (updatedUser) {
      delete (updatedUser as any).passwordHash;
    }

    res.json({ message: 'Avatar updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update avatar photo' });
  }
});

// POST record adaptive focus break & award micro-XP
router.post('/break', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { breakType, durationSeconds, triggerFocusScore, completed } = req.body;

    const supabase = getSupabase();
    const xpBonus = completed ? 25 : 5;

    if (supabase) {
      // Log as a study_session break event with telemetry
      const sessionPayload = {
        student_id: userId,
        duration_minutes: Math.max(1, Math.round((durationSeconds || 60) / 60)),
        xp_earned: xpBonus,
        avg_focus_score: triggerFocusScore || 50,
        session_type: `Focus Reset: ${breakType || 'Guided Breathing'}`,
        telemetry: [{ event: 'adaptive_break', breakType, completed, triggerFocusScore }],
      };

      await supabase.from('study_sessions').insert(sessionPayload);

      // Award XP
      const { data: currentUser } = await supabase
        .from('users')
        .select('xp')
        .eq('id', userId)
        .single();

      const currentXp = Number(currentUser?.xp || 0);
      const { data: updatedUser } = await supabase
        .from('users')
        .update({
          xp: currentXp + xpBonus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      res.status(201).json({
        message: 'Focus break recorded in Supabase',
        xpEarned: xpBonus,
        user: updatedUser ? mapUserFromDB(updatedUser) : null,
      });
      return;
    }

    // Memory store fallback
    const memUser = memoryStore.users.findById(userId);
    let updatedUser = null;
    if (memUser) {
      updatedUser = memoryStore.users.update(userId, {
        xp: (memUser.xp || 0) + xpBonus,
      });
      if (updatedUser) delete (updatedUser as any).passwordHash;
    }

    res.status(201).json({
      message: 'Focus break recorded',
      xpEarned: xpBonus,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Student Break Record Error]:', error);
    res.status(500).json({ message: 'Failed to record focus break' });
  }
});

export default router;
