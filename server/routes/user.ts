import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase, mapUserFromDB } from '../supabase';
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
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// PUT /api/user/profile - Update profile details
router.put('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const updateData = { ...req.body };

    // Prevent updating sensitive fields via profile route
    delete updateData.passwordHash;
    delete updateData.password_hash;
    delete updateData.role;
    delete updateData._id;
    delete updateData.id;

    const supabase = getSupabase();

    if (supabase) {
      const dbPayload: any = {
        updated_at: new Date().toISOString(),
      };

      if (updateData.fullName !== undefined) dbPayload.full_name = updateData.fullName;
      if (updateData.email !== undefined) dbPayload.email = updateData.email.toLowerCase().trim();
      if (updateData.avatar !== undefined) dbPayload.avatar = updateData.avatar;
      if (updateData.teacherType !== undefined) dbPayload.teacher_type = updateData.teacherType;
      if (updateData.gradeLevel !== undefined) dbPayload.grade_level = updateData.gradeLevel;
      if (updateData.learningStyle !== undefined) dbPayload.learning_style = updateData.learningStyle;
      if (updateData.curriculumTrack !== undefined) dbPayload.curriculum_track = updateData.curriculumTrack;
      if (updateData.studySchedule !== undefined) dbPayload.study_schedule = updateData.studySchedule;
      if (updateData.guardianEmail !== undefined) dbPayload.guardian_email = updateData.guardianEmail;
      if (updateData.institutionName !== undefined) dbPayload.institution_name = updateData.institutionName;
      if (updateData.teacherIdNumber !== undefined) dbPayload.teacher_id_number = updateData.teacherIdNumber;
      if (updateData.department !== undefined) dbPayload.department = updateData.department;
      if (updateData.assignedClasses !== undefined) dbPayload.assigned_classes = updateData.assignedClasses;

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(dbPayload)
        .eq('id', userId)
        .select()
        .single();

      if (error || !updatedUser) {
        console.error('[Supabase User Profile Update Error]:', error);
        res.status(404).json({ message: 'User not found or update failed' });
        return;
      }

      res.json({ message: 'Profile updated successfully', user: mapUserFromDB(updatedUser) });
      return;
    }

    // Memory Fallback
    const updatedUser = memoryStore.users.update(userId, updateData);
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const { passwordHash: _, ...userWithoutPass } = updatedUser;
    res.json({ message: 'Profile updated successfully', user: userWithoutPass });
  } catch (error) {
    console.error('[User Profile Update Error]:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// DELETE /api/user/account - Self-service permanent account deletion
router.delete('/account', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const supabase = getSupabase();

    if (supabase) {
      // CASCADE delete on study_sessions & baseline_scores automatically handles relational cleanup
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('[Supabase User Account Delete Error]:', error);
        res.status(500).json({ message: 'Failed to delete account from Supabase' });
        return;
      }

      res.json({ 
        message: 'Your account and all associated focus data have been permanently deleted.' 
      });
      return;
    }

    // Memory Fallback
    const memUser = memoryStore.users.findById(userId);
    if (!memUser) {
      res.status(404).json({ message: 'User account not found' });
      return;
    }

    memoryStore.users.delete(userId);
    memoryStore.sessions.deleteByStudentId(userId);
    memoryStore.scores.deleteByStudentId(userId);

    res.json({ 
      message: 'Your account and all associated focus data have been permanently deleted.' 
    });
  } catch (error) {
    console.error('[User Account Delete Error]:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// POST /api/user/reset-database - Global database reset
router.post('/reset-database', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();

    if (supabase) {
      // Purge sessions & scores
      await supabase.from('study_sessions').delete().neq('duration_minutes', -999);
      await supabase.from('baseline_scores').delete().neq('subject', '__none__');
      
      // Delete non-demo users
      await supabase.from('users').delete().not('id', 'in', '("00000000-0000-0000-0000-000000000001","00000000-0000-0000-0000-000000000002")');

      // Reset demo user metrics
      await supabase.from('users').update({
        xp: 1450,
        total_hours: 24.50,
        completed_sessions: 12,
        updated_at: new Date().toISOString(),
      }).eq('id', '00000000-0000-0000-0000-000000000001');
    }

    memoryStore.resetAll();

    res.json({
      success: true,
      message: 'Database has been reset to factory defaults.',
    });
  } catch (error) {
    console.error('[Database Reset Error]:', error);
    res.status(500).json({ message: 'Failed to reset database' });
  }
});

export default router;
