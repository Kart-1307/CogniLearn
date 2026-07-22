import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import StudySession from '../models/StudySession';
import BaselineScore from '../models/BaselineScore';

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
    const updateData = req.body;

    // Prevent updating sensitive fields via profile route
    delete updateData.passwordHash;
    delete updateData.role;
    delete updateData._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('[User Profile Update Error]:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// DELETE /api/user/account - Self-service permanent account deletion (Individual Mode)
router.delete('/account', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User account not found' });
      return;
    }

    // Permanently delete user document and all associated data from MongoDB Atlas
    await User.findByIdAndDelete(userId);
    await StudySession.deleteMany({ studentId: userId });
    await BaselineScore.deleteMany({ studentId: userId });

    console.log(`[MongoDB Atlas] Account deleted permanently for user: ${user.email} (${user._id})`);

    res.json({ 
      message: 'Your account and all associated focus data have been permanently deleted from MongoDB Atlas.' 
    });
  } catch (error) {
    console.error('[User Account Delete Error]:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;
