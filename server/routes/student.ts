import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import StudySession from '../models/StudySession';

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
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }
    const recentSessions = await StudySession.find({ studentId: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      user,
      recentSessions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student profile' });
  }
});

// POST record focus study session & update XP / total hours
router.post('/session', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { durationMinutes, xpEarned, avgFocusScore } = req.body;

    if (!durationMinutes || xpEarned === undefined) {
      res.status(400).json({ message: 'durationMinutes and xpEarned are required' });
      return;
    }

    const session = new StudySession({
      studentId: userId,
      durationMinutes,
      xpEarned,
      avgFocusScore: avgFocusScore || 85,
    });
    await session.save();

    const hoursAdded = parseFloat((durationMinutes / 60).toFixed(2));

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          xp: xpEarned,
          totalHours: hoursAdded,
          completedSessions: 1,
        },
      },
      { new: true }
    ).select('-passwordHash');

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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true }
    ).select('-passwordHash');

    res.json({
      message: 'Avatar updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update avatar photo' });
  }
});

export default router;
