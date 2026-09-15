import bcrypt from 'bcryptjs';

export interface MemoryUser {
  _id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'teacher';
  teacherType?: 'Class Teacher' | 'Subject Teacher' | 'Coordinator';
  avatar?: string | null;
  xp: number;
  totalHours: number;
  completedSessions: number;
  gradeLevel?: string;
  learningStyle?: string;
  curriculumTrack?: string;
  studySchedule?: string;
  guardianEmail?: string;
  institutionName?: string;
  teacherIdNumber?: string;
  department?: string;
  assignedClasses?: string[];
  isDemo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemorySession {
  _id: string;
  studentId: string;
  durationMinutes: number;
  xpEarned: number;
  avgFocusScore?: number;
  sessionType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryBaselineScore {
  _id: string;
  studentId: string;
  subject: string;
  cognitiveScore: number;
  focusIndex: number;
  retentionRate: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const defaultPasswordHash = bcrypt.hashSync('password123', 10);

const memoryUsers: MemoryUser[] = [
  {
    _id: 'mem-user-student-1',
    fullName: 'Ananya Sharma',
    email: 'student@cognilearn.com',
    passwordHash: defaultPasswordHash,
    role: 'student',
    avatar: null,
    xp: 1450,
    totalHours: 24.5,
    completedSessions: 12,
    isDemo: true,
    gradeLevel: 'Class 11',
    learningStyle: 'Visual',
    curriculumTrack: 'CBSE',
    studySchedule: 'Morning Focus',
    guardianEmail: 'guardian@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'mem-user-teacher-1',
    fullName: 'Dr. Ramesh Kumar',
    email: 'teacher@cognilearn.com',
    passwordHash: defaultPasswordHash,
    role: 'teacher',
    teacherType: 'Subject Teacher',
    avatar: null,
    xp: 0,
    totalHours: 0,
    completedSessions: 0,
    isDemo: true,
    institutionName: 'Delhi Public School',
    teacherIdNumber: 'T-10293',
    department: 'Science & Mathematics',
    assignedClasses: ['Class 11-A', 'Class 11-B', 'Class 12-A'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const memorySessions: MemorySession[] = [
  {
    _id: 'mem-session-1',
    studentId: 'mem-user-student-1',
    durationMinutes: 45,
    xpEarned: 150,
    avgFocusScore: 88,
    sessionType: 'Focus Session',
    createdAt: new Date(Date.now() - 3600000 * 24),
    updatedAt: new Date(Date.now() - 3600000 * 24),
  },
  {
    _id: 'mem-session-2',
    studentId: 'mem-user-student-1',
    durationMinutes: 60,
    xpEarned: 200,
    avgFocusScore: 92,
    sessionType: 'Deep Study',
    createdAt: new Date(Date.now() - 3600000 * 48),
    updatedAt: new Date(Date.now() - 3600000 * 48),
  },
];

const memoryScores: MemoryBaselineScore[] = [
  {
    _id: 'mem-score-1',
    studentId: 'mem-user-student-1',
    subject: 'Mathematics',
    cognitiveScore: 85,
    focusIndex: 90,
    retentionRate: 84,
    notes: 'Excellent attention during calculus practice',
    createdAt: new Date(Date.now() - 3600000 * 72),
    updatedAt: new Date(Date.now() - 3600000 * 72),
  },
  {
    _id: 'mem-score-2',
    studentId: 'mem-user-student-1',
    subject: 'Physics',
    cognitiveScore: 78,
    focusIndex: 82,
    retentionRate: 80,
    notes: 'Good retention on mechanics modules',
    createdAt: new Date(Date.now() - 3600000 * 96),
    updatedAt: new Date(Date.now() - 3600000 * 96),
  },
];

export const memoryStore = {
  users: {
    findByEmail: (email: string) => memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()),
    findById: (id: string) => memoryUsers.find((u) => u._id === id),
    create: (userData: Partial<MemoryUser>): MemoryUser => {
      const newUser: MemoryUser = {
        _id: 'mem-user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        fullName: userData.fullName || 'User',
        email: (userData.email || '').toLowerCase(),
        passwordHash: userData.passwordHash || '',
        role: userData.role || 'student',
        teacherType: userData.teacherType,
        avatar: userData.avatar || null,
        xp: userData.xp ?? 0,
        totalHours: userData.totalHours ?? 0,
        completedSessions: userData.completedSessions ?? 0,
        isDemo: userData.isDemo ?? (userData.email ? (userData.email.toLowerCase() === 'student@cognilearn.com' || userData.email.toLowerCase() === 'teacher@cognilearn.com') : false),
        gradeLevel: userData.gradeLevel || 'Class 11',
        learningStyle: userData.learningStyle || 'Visual',
        curriculumTrack: userData.curriculumTrack || 'CBSE',
        studySchedule: userData.studySchedule || 'Morning Focus',
        guardianEmail: userData.guardianEmail || '',
        institutionName: userData.institutionName || '',
        teacherIdNumber: userData.teacherIdNumber || '',
        department: userData.department || 'Science & Math',
        assignedClasses: userData.assignedClasses || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryUsers.push(newUser);
      return newUser;
    },
    update: (id: string, updateData: Partial<MemoryUser>): MemoryUser | null => {
      const idx = memoryUsers.findIndex((u) => u._id === id);
      if (idx === -1) return null;
      memoryUsers[idx] = {
        ...memoryUsers[idx],
        ...updateData,
        updatedAt: new Date(),
      };
      return memoryUsers[idx];
    },
    delete: (id: string): boolean => {
      const idx = memoryUsers.findIndex((u) => u._id === id);
      if (idx === -1) return false;
      memoryUsers.splice(idx, 1);
      return true;
    },
  },

  sessions: {
    findByStudentId: (studentId: string) =>
      memorySessions.filter((s) => s.studentId === studentId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    create: (sessionData: { studentId: string; durationMinutes: number; xpEarned: number; avgFocusScore?: number }) => {
      const newSession: MemorySession = {
        _id: 'mem-session-' + Date.now(),
        studentId: sessionData.studentId,
        durationMinutes: sessionData.durationMinutes,
        xpEarned: sessionData.xpEarned,
        avgFocusScore: sessionData.avgFocusScore || 85,
        sessionType: 'Focus Session',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memorySessions.push(newSession);
      return newSession;
    },
    deleteByStudentId: (studentId: string) => {
      for (let i = memorySessions.length - 1; i >= 0; i--) {
        if (memorySessions[i].studentId === studentId) {
          memorySessions.splice(i, 1);
        }
      }
    },
  },

  scores: {
    findByStudentId: (studentId: string) =>
      memoryScores.filter((s) => s.studentId === studentId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    create: (scoreData: { studentId: string; subject: string; cognitiveScore: number; focusIndex: number; retentionRate?: number; notes?: string }) => {
      const newScore: MemoryBaselineScore = {
        _id: 'mem-score-' + Date.now(),
        studentId: scoreData.studentId,
        subject: scoreData.subject,
        cognitiveScore: scoreData.cognitiveScore,
        focusIndex: scoreData.focusIndex,
        retentionRate: scoreData.retentionRate || 80,
        notes: scoreData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryScores.push(newScore);
      return newScore;
    },
    deleteByStudentId: (studentId: string) => {
      for (let i = memoryScores.length - 1; i >= 0; i--) {
        if (memoryScores[i].studentId === studentId) {
          memoryScores.splice(i, 1);
        }
      }
    },
  },

  resetAll: () => {
    memoryUsers.length = 0;
    memoryUsers.push(
      {
        _id: 'mem-user-student-1',
        fullName: 'Ananya Sharma',
        email: 'student@cognilearn.com',
        passwordHash: defaultPasswordHash,
        role: 'student',
        avatar: null,
        xp: 1450,
        totalHours: 24.5,
        completedSessions: 12,
        gradeLevel: 'Class 11',
        learningStyle: 'Visual',
        curriculumTrack: 'CBSE',
        studySchedule: 'Morning Focus',
        guardianEmail: 'guardian@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'mem-user-teacher-1',
        fullName: 'Dr. Ramesh Kumar',
        email: 'teacher@cognilearn.com',
        passwordHash: defaultPasswordHash,
        role: 'teacher',
        teacherType: 'Subject Teacher',
        avatar: null,
        xp: 0,
        totalHours: 0,
        completedSessions: 0,
        institutionName: 'Delhi Public School',
        teacherIdNumber: 'T-10293',
        department: 'Science & Mathematics',
        assignedClasses: ['Class 11-A', 'Class 11-B', 'Class 12-A'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    memorySessions.length = 0;
    memorySessions.push(
      {
        _id: 'mem-session-1',
        studentId: 'mem-user-student-1',
        durationMinutes: 45,
        xpEarned: 150,
        avgFocusScore: 88,
        sessionType: 'Focus Session',
        createdAt: new Date(Date.now() - 3600000 * 24),
        updatedAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        _id: 'mem-session-2',
        studentId: 'mem-user-student-1',
        durationMinutes: 60,
        xpEarned: 200,
        avgFocusScore: 92,
        sessionType: 'Deep Study',
        createdAt: new Date(Date.now() - 3600000 * 48),
        updatedAt: new Date(Date.now() - 3600000 * 48),
      }
    );

    memoryScores.length = 0;
    memoryScores.push(
      {
        _id: 'mem-score-1',
        studentId: 'mem-user-student-1',
        subject: 'Mathematics',
        cognitiveScore: 85,
        focusIndex: 90,
        retentionRate: 84,
        notes: 'Excellent attention during calculus practice',
        createdAt: new Date(Date.now() - 3600000 * 72),
        updatedAt: new Date(Date.now() - 3600000 * 72),
      },
      {
        _id: 'mem-score-2',
        studentId: 'mem-user-student-1',
        subject: 'Physics',
        cognitiveScore: 78,
        focusIndex: 82,
        retentionRate: 80,
        notes: 'Good retention on mechanics modules',
        createdAt: new Date(Date.now() - 3600000 * 96),
        updatedAt: new Date(Date.now() - 3600000 * 96),
      }
    );
  },
};
