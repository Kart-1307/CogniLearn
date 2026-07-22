import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import BaselineScore from '../models/BaselineScore';

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

    const newScore = new BaselineScore({
      studentId: userId,
      subject,
      cognitiveScore,
      focusIndex,
      retentionRate: retentionRate || 80,
      notes,
    });

    await newScore.save();
    res.status(201).json({ message: 'Baseline score saved', score: newScore });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save baseline score' });
  }
});

// GET baseline scores for student
router.get('/scores', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const scores = await BaselineScore.find({ studentId: userId }).sort({ createdAt: -1 });
    res.json({ scores });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch baseline scores' });
  }
});

export default router;
