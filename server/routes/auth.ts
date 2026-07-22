import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cognilearn_super_secret_jwt_key_2026';

const isDBConnected = () => mongoose.connection.readyState === 1;

// Register endpoint
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDBConnected()) {
      res.status(503).json({ message: 'MongoDB Atlas is not connected yet. Please check Network Access (IP Whitelist 0.0.0.0/0) in Atlas Dashboard.' });
      return;
    }

    const { 
      fullName, email, password, role, teacherType, avatar,
      gradeLevel, learningStyle, curriculumTrack, studySchedule, guardianEmail,
      institutionName, teacherIdNumber, department, assignedClasses
    } = req.body;

    if (!fullName || !email || !password || !role) {
      res.status(400).json({ message: 'Full name, email, password, and role are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role,
      teacherType: role === 'teacher' ? teacherType : undefined,
      avatar: avatar || null,
      xp: role === 'student' ? 1450 : 0,
      totalHours: role === 'student' ? 24.5 : 0,
      completedSessions: role === 'student' ? 2 : 0,
      // Extended fields
      gradeLevel: gradeLevel || 'Class 11',
      learningStyle: learningStyle || 'Visual',
      curriculumTrack: curriculumTrack || 'CBSE',
      studySchedule: studySchedule || 'Morning Focus',
      guardianEmail: guardianEmail || '',
      institutionName: institutionName || '',
      teacherIdNumber: teacherIdNumber || '',
      department: department || 'Science & Math',
      assignedClasses: assignedClasses || [],
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isDBConnected()) {
      res.status(503).json({ message: 'MongoDB Atlas is not connected yet. Please check Network Access (IP Whitelist 0.0.0.0/0) in Atlas Dashboard.' });
      return;
    }

    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (role && user.role !== role) {
      res.status(401).json({ message: `Account exists as a ${user.role}, not ${role}` });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        teacherType: user.teacherType,
        avatar: user.avatar,
        xp: user.xp,
        totalHours: user.totalHours,
        completedSessions: user.completedSessions,
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

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router;
