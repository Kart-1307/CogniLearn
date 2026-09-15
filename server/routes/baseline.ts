import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getSupabase, mapScoreFromDB } from '../supabase';
import { memoryStore } from '../memoryStore';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cognilearn_super_secret_jwt_key_2026';

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

// Record new baseline score
router.post('/score', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { subject, cognitiveScore, focusIndex, retentionRate, notes } = req.body;

    if (!subject || cognitiveScore === undefined || focusIndex === undefined) {
      res.status(400).json({ message: 'Subject, cognitiveScore, and focusIndex are required' });
      return;
    }

    const supabase = getSupabase();

    if (supabase) {
      const payload = {
        student_id: userId,
        subject,
        cognitive_score: cognitiveScore,
        focus_index: focusIndex,
        retention_rate: retentionRate !== undefined ? retentionRate : 80,
        notes: notes || null,
      };

      const { data: newScore, error } = await supabase
        .from('baseline_scores')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('[Supabase BaselineScore Insert Error]:', error);
        res.status(500).json({ message: 'Failed to save baseline score in Supabase' });
        return;
      }

      res.status(201).json({ message: 'Baseline score saved', score: mapScoreFromDB(newScore) });
      return;
    }

    // Memory Fallback
    const newScore = memoryStore.scores.create({
      studentId: userId,
      subject,
      cognitiveScore,
      focusIndex,
      retentionRate,
      notes,
    });

    res.status(201).json({ message: 'Baseline score saved', score: newScore });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save baseline score' });
  }
});

// GET baseline scores for student
router.get('/scores', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const supabase = getSupabase();

    if (supabase) {
      const { data: scores, error } = await supabase
        .from('baseline_scores')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase BaselineScore Fetch Error]:', error);
        res.status(500).json({ message: 'Failed to fetch baseline scores from Supabase' });
        return;
      }

      res.json({ scores: (scores || []).map(mapScoreFromDB) });
      return;
    }

    // Memory Fallback
    const scores = memoryStore.scores.findByStudentId(userId);
    res.json({ scores });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch baseline scores' });
  }
});

export default router;
