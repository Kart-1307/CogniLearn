import bcrypt from 'bcryptjs';

export interface MemoryCohort {
  _id: string;
  code: string;
  tier: 'school' | 'college';
  name: string;
  standard?: string;
  department?: string;
  schoolStream?: string;
  academicYear: string;
  semester?: string;
  section: string;
  subject: string;
  room?: string;
  teacherId?: string;
  teacherName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryEnrollment {
  _id: string;
  cohortId: string;
  studentId: string;
  rollNo: string;
  enrolledSubjects: string[];
  status: 'active' | 'inactive' | 'transferred';
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryUser {
  _id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'teacher';
  teacherType?: 'Class Teacher' | 'Subject Teacher' | 'Coordinator' | 'Professor' | 'HOD' | 'Dean' | 'Lab Assistant';
  avatar?: string | null;
  xp: number;
  totalHours: number;
  completedSessions: number;
  tier?: 'school' | 'college';
  academicProfile?: any;
  teacherProfile?: any;
  rollNo?: string;
  enrolledSubjects?: string[];
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
  // 1. School Student Demo (Ananya Sharma)
  {
    _id: 'mem-user-student-1',
    fullName: 'Ananya Sharma',
    email: 'student@cognilearn.com',
    passwordHash: defaultPasswordHash,
    role: 'student',
    tier: 'school',
    avatar: null,
    xp: 1450,
    totalHours: 24.5,
    completedSessions: 12,
    isDemo: true,
    gradeLevel: 'Class 10',
    rollNo: '14',
    learningStyle: 'Visual',
    curriculumTrack: 'CBSE',
    studySchedule: 'Morning Focus',
    guardianEmail: 'guardian@example.com',
    institutionName: 'Delhi Public School, R.K. Puram',
    enrolledSubjects: ['Mathematics', 'Science (Physics/Chem)', 'English Core', 'Social Science'],
    academicProfile: {
      tier: 'school',
      institutionName: 'Delhi Public School, R.K. Puram',
      board: 'CBSE',
      standard: 'Class 10',
      section: 'A',
      rollNo: '14',
      subjects: ['Mathematics', 'Science (Physics/Chem)', 'English Core', 'Social Science'],
      classCode: 'KV10-A',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // 2. School Teacher Demo (Dr. Ramesh Kumar)
  {
    _id: 'mem-user-teacher-1',
    fullName: 'Dr. Ramesh Kumar',
    email: 'teacher@cognilearn.com',
    passwordHash: defaultPasswordHash,
    role: 'teacher',
    tier: 'school',
    teacherType: 'Class Teacher',
    avatar: null,
    xp: 0,
    totalHours: 0,
    completedSessions: 0,
    isDemo: true,
    institutionName: 'Delhi Public School, R.K. Puram',
    teacherIdNumber: 'DPS-STAFF-104',
    department: 'Secondary Mathematics',
    assignedClasses: ['Class 10-A', 'Class 10-B', 'Class 12-A'],
    teacherProfile: {
      tier: 'school',
      institutionName: 'Delhi Public School, R.K. Puram',
      role: 'Class Teacher',
      board: 'CBSE',
      staffIdNumber: 'DPS-STAFF-104',
      primarySubjects: ['Mathematics', 'Physics'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // 3. College Student Demo (Rohan Varma - B.Tech CSE)
  {
    _id: 'mem-user-student-2',
    fullName: 'Rohan Varma',
    email: 'college-student@cognilearn.com',
    passwordHash: defaultPasswordHash,
    role: 'student',
    tier: 'college',
    avatar: null,
    xp: 2180,
    totalHours: 42.0,
    completedSessions: 26,
    isDemo: true,
    gradeLevel: 'College 3rd Year',
    rollNo: '22CS084',
    learningStyle: 'Kinesthetic',
    curriculumTrack: 'Autonomous University',
    studySchedule: 'Evening Deep Study',
    guardianEmail: 'parents.varma@example.com',
    institutionName: 'Indian Institute of Information Technology',
    department: 'Computer Science & Engineering',
    enrolledSubjects: ['Machine Learning', 'Operating Systems', 'Database Management', 'Computer Networks'],
    academicProfile: {
      tier: 'college',
      institutionName: 'Indian Institute of Information Technology',
      department: 'Computer Science & Engineering',
      degree: 'B.Tech',
      academicYear: '3rd Year',
      semester: 'Semester 5',
      section: 'B',
      rollNo: '22CS084',
      subjects: ['Machine Learning', 'Operating Systems', 'Database Management', 'Computer Networks'],
      classCode: 'CS3B-9X',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // 4. College Professor Demo (Prof. Priya Nair)
  {
    _id: 'mem-user-teacher-2',
    fullName: 'Prof. Priya Nair',
    email: 'college-teacher@cognilearn.com',
    passwordHash: defaultPasswordHash,
    role: 'teacher',
    tier: 'college',
    teacherType: 'Professor',
    avatar: null,
    xp: 0,
    totalHours: 0,
    completedSessions: 0,
    isDemo: true,
    institutionName: 'Indian Institute of Information Technology',
    teacherIdNumber: 'IIIT-FAC-882',
    department: 'Computer Science & Engineering',
    assignedClasses: ['3rd Year CSE-B', '4th Year CSE-A'],
    teacherProfile: {
      tier: 'college',
      institutionName: 'Indian Institute of Information Technology',
      role: 'Associate Professor',
      department: 'Computer Science & Engineering',
      staffIdNumber: 'IIIT-FAC-882',
      primarySubjects: ['Machine Learning', 'Data Structures & Algorithms', 'Deep Learning'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const memoryCohorts: MemoryCohort[] = [
  {
    _id: 'mem-cohort-1',
    code: 'KV10-A',
    tier: 'school',
    name: 'Class 10-A Mathematics',
    standard: 'Class 10',
    academicYear: '2026-2027',
    section: 'A',
    subject: 'Mathematics',
    room: 'Room 204 (Science Block)',
    teacherId: 'mem-user-teacher-1',
    teacherName: 'Dr. Ramesh Kumar',
    createdAt: new Date(Date.now() - 3600000 * 24 * 30),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 30),
  },
  {
    _id: 'mem-cohort-2',
    code: 'CS3B-9X',
    tier: 'college',
    name: '3rd Year B.Tech CSE (Sec B) - Machine Learning',
    department: 'Computer Science & Engineering',
    academicYear: '2026-2027',
    semester: 'Semester 5',
    section: 'B',
    subject: 'Machine Learning',
    room: 'Lab 4 / Seminar Hall 2',
    teacherId: 'mem-user-teacher-2',
    teacherName: 'Prof. Priya Nair',
    createdAt: new Date(Date.now() - 3600000 * 24 * 20),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 20),
  },
];

const memoryEnrollments: MemoryEnrollment[] = [
  {
    _id: 'mem-enrollment-1',
    cohortId: 'mem-cohort-1',
    studentId: 'mem-user-student-1',
    rollNo: '14',
    enrolledSubjects: ['Mathematics', 'Science (Physics/Chem)', 'English Core'],
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 25),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 25),
  },
  {
    _id: 'mem-enrollment-2',
    cohortId: 'mem-cohort-2',
    studentId: 'mem-user-student-2',
    rollNo: '22CS084',
    enrolledSubjects: ['Machine Learning', 'Operating Systems', 'Database Management'],
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 18),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 18),
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
  {
    _id: 'mem-session-3',
    studentId: 'mem-user-student-2',
    durationMinutes: 50,
    xpEarned: 180,
    avgFocusScore: 91,
    sessionType: 'ML Code Review Focus',
    createdAt: new Date(Date.now() - 3600000 * 12),
    updatedAt: new Date(Date.now() - 3600000 * 12),
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
  {
    _id: 'mem-score-3',
    studentId: 'mem-user-student-2',
    subject: 'Machine Learning',
    cognitiveScore: 92,
    focusIndex: 94,
    retentionRate: 89,
    notes: 'High sustained attention during neural network derivations',
    createdAt: new Date(Date.now() - 3600000 * 36),
    updatedAt: new Date(Date.now() - 3600000 * 36),
  },
];

export const memoryStore = {
  users: {
    findByEmail: (email: string) => memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()),
    findById: (id: string) => memoryUsers.find((u) => u._id === id),
    create: (userData: Partial<MemoryUser>): MemoryUser => {
      const isDemo = userData.isDemo ?? (
        userData.email ? [
          'student@cognilearn.com',
          'teacher@cognilearn.com',
          'college-student@cognilearn.com',
          'college-teacher@cognilearn.com'
        ].includes(userData.email.toLowerCase()) : false
      );

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
        isDemo,
        tier: userData.tier || 'school',
        academicProfile: userData.academicProfile,
        teacherProfile: userData.teacherProfile,
        rollNo: userData.rollNo,
        enrolledSubjects: userData.enrolledSubjects || [],
        gradeLevel: userData.gradeLevel || 'Class 10',
        learningStyle: userData.learningStyle || 'Visual',
        curriculumTrack: userData.curriculumTrack || 'CBSE',
        studySchedule: userData.studySchedule || 'Morning Focus',
        guardianEmail: userData.guardianEmail || '',
        institutionName: userData.institutionName || '',
        teacherIdNumber: userData.teacherIdNumber || '',
        department: userData.department || '',
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

  cohorts: {
    findAll: () => [...memoryCohorts],
    findById: (id: string) => memoryCohorts.find((c) => c._id === id),
    findByCode: (code: string) => memoryCohorts.find((c) => c.code.toUpperCase() === code.trim().toUpperCase()),
    findByTeacherId: (teacherId: string) => memoryCohorts.filter((c) => c.teacherId === teacherId),
    create: (cohortData: {
      code: string;
      tier: 'school' | 'college';
      name: string;
      standard?: string;
      department?: string;
      schoolStream?: string;
      academicYear: string;
      semester?: string;
      section: string;
      subject: string;
      room?: string;
      teacherId?: string;
      teacherName?: string;
    }): MemoryCohort => {
      const newCohort: MemoryCohort = {
        _id: 'mem-cohort-' + Date.now(),
        code: cohortData.code.toUpperCase().trim(),
        tier: cohortData.tier,
        name: cohortData.name,
        standard: cohortData.standard,
        department: cohortData.department,
        schoolStream: cohortData.schoolStream,
        academicYear: cohortData.academicYear,
        semester: cohortData.semester,
        section: cohortData.section,
        subject: cohortData.subject,
        room: cohortData.room,
        teacherId: cohortData.teacherId,
        teacherName: cohortData.teacherName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryCohorts.push(newCohort);
      return newCohort;
    },
    delete: (id: string): boolean => {
      const idx = memoryCohorts.findIndex((c) => c._id === id);
      if (idx === -1) return false;
      memoryCohorts.splice(idx, 1);
      return true;
    },
  },

  enrollments: {
    findAll: () => [...memoryEnrollments],
    findById: (id: string) => memoryEnrollments.find((e) => e._id === id),
    findByCohortId: (cohortId: string) => memoryEnrollments.filter((e) => e.cohortId === cohortId),
    findByStudentId: (studentId: string) => memoryEnrollments.filter((e) => e.studentId === studentId),
    findByCohortAndStudent: (cohortId: string, studentId: string) =>
      memoryEnrollments.find((e) => e.cohortId === cohortId && e.studentId === studentId),
    findByCohortAndRollNo: (cohortId: string, rollNo: string) =>
      memoryEnrollments.find((e) => e.cohortId === cohortId && e.rollNo.toLowerCase() === rollNo.trim().toLowerCase()),
    create: (data: { cohortId: string; studentId: string; rollNo: string; enrolledSubjects?: string[] }): MemoryEnrollment => {
      const newEnrollment: MemoryEnrollment = {
        _id: 'mem-enrollment-' + Date.now(),
        cohortId: data.cohortId,
        studentId: data.studentId,
        rollNo: data.rollNo.trim(),
        enrolledSubjects: data.enrolledSubjects || [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryEnrollments.push(newEnrollment);
      return newEnrollment;
    },
    delete: (cohortId: string, studentId: string): boolean => {
      const idx = memoryEnrollments.findIndex((e) => e.cohortId === cohortId && e.studentId === studentId);
      if (idx === -1) return false;
      memoryEnrollments.splice(idx, 1);
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
        tier: 'school',
        avatar: null,
        xp: 1450,
        totalHours: 24.5,
        completedSessions: 12,
        isDemo: true,
        gradeLevel: 'Class 10',
        rollNo: '14',
        learningStyle: 'Visual',
        curriculumTrack: 'CBSE',
        studySchedule: 'Morning Focus',
        guardianEmail: 'guardian@example.com',
        institutionName: 'Delhi Public School, R.K. Puram',
        enrolledSubjects: ['Mathematics', 'Science (Physics/Chem)', 'English Core', 'Social Science'],
        academicProfile: {
          tier: 'school',
          institutionName: 'Delhi Public School, R.K. Puram',
          board: 'CBSE',
          standard: 'Class 10',
          section: 'A',
          rollNo: '14',
          subjects: ['Mathematics', 'Science (Physics/Chem)', 'English Core', 'Social Science'],
          classCode: 'KV10-A',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'mem-user-teacher-1',
        fullName: 'Dr. Ramesh Kumar',
        email: 'teacher@cognilearn.com',
        passwordHash: defaultPasswordHash,
        role: 'teacher',
        tier: 'school',
        teacherType: 'Class Teacher',
        avatar: null,
        xp: 0,
        totalHours: 0,
        completedSessions: 0,
        isDemo: true,
        institutionName: 'Delhi Public School, R.K. Puram',
        teacherIdNumber: 'DPS-STAFF-104',
        department: 'Secondary Mathematics',
        assignedClasses: ['Class 10-A', 'Class 10-B', 'Class 12-A'],
        teacherProfile: {
          tier: 'school',
          institutionName: 'Delhi Public School, R.K. Puram',
          role: 'Class Teacher',
          board: 'CBSE',
          staffIdNumber: 'DPS-STAFF-104',
          primarySubjects: ['Mathematics', 'Physics'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'mem-user-student-2',
        fullName: 'Rohan Varma',
        email: 'college-student@cognilearn.com',
        passwordHash: defaultPasswordHash,
        role: 'student',
        tier: 'college',
        avatar: null,
        xp: 2180,
        totalHours: 42.0,
        completedSessions: 26,
        isDemo: true,
        gradeLevel: 'College 3rd Year',
        rollNo: '22CS084',
        learningStyle: 'Kinesthetic',
        curriculumTrack: 'Autonomous University',
        studySchedule: 'Evening Deep Study',
        guardianEmail: 'parents.varma@example.com',
        institutionName: 'Indian Institute of Information Technology',
        department: 'Computer Science & Engineering',
        enrolledSubjects: ['Machine Learning', 'Operating Systems', 'Database Management', 'Computer Networks'],
        academicProfile: {
          tier: 'college',
          institutionName: 'Indian Institute of Information Technology',
          department: 'Computer Science & Engineering',
          degree: 'B.Tech',
          academicYear: '3rd Year',
          semester: 'Semester 5',
          section: 'B',
          rollNo: '22CS084',
          subjects: ['Machine Learning', 'Operating Systems', 'Database Management', 'Computer Networks'],
          classCode: 'CS3B-9X',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'mem-user-teacher-2',
        fullName: 'Prof. Priya Nair',
        email: 'college-teacher@cognilearn.com',
        passwordHash: defaultPasswordHash,
        role: 'teacher',
        tier: 'college',
        teacherType: 'Professor',
        avatar: null,
        xp: 0,
        totalHours: 0,
        completedSessions: 0,
        isDemo: true,
        institutionName: 'Indian Institute of Information Technology',
        teacherIdNumber: 'IIIT-FAC-882',
        department: 'Computer Science & Engineering',
        assignedClasses: ['3rd Year CSE-B', '4th Year CSE-A'],
        teacherProfile: {
          tier: 'college',
          institutionName: 'Indian Institute of Information Technology',
          role: 'Associate Professor',
          department: 'Computer Science & Engineering',
          staffIdNumber: 'IIIT-FAC-882',
          primarySubjects: ['Machine Learning', 'Data Structures & Algorithms', 'Deep Learning'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    memoryCohorts.length = 0;
    memoryCohorts.push(
      {
        _id: 'mem-cohort-1',
        code: 'KV10-A',
        tier: 'school',
        name: 'Class 10-A Mathematics',
        standard: 'Class 10',
        academicYear: '2026-2027',
        section: 'A',
        subject: 'Mathematics',
        room: 'Room 204 (Science Block)',
        teacherId: 'mem-user-teacher-1',
        teacherName: 'Dr. Ramesh Kumar',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'mem-cohort-2',
        code: 'CS3B-9X',
        tier: 'college',
        name: '3rd Year B.Tech CSE (Sec B) - Machine Learning',
        department: 'Computer Science & Engineering',
        academicYear: '2026-2027',
        semester: 'Semester 5',
        section: 'B',
        subject: 'Machine Learning',
        room: 'Lab 4 / Seminar Hall 2',
        teacherId: 'mem-user-teacher-2',
        teacherName: 'Prof. Priya Nair',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    memoryEnrollments.length = 0;
    memoryEnrollments.push(
      {
        _id: 'mem-enrollment-1',
        cohortId: 'mem-cohort-1',
        studentId: 'mem-user-student-1',
        rollNo: '14',
        enrolledSubjects: ['Mathematics', 'Science (Physics/Chem)', 'English Core'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'mem-enrollment-2',
        cohortId: 'mem-cohort-2',
        studentId: 'mem-user-student-2',
        rollNo: '22CS084',
        enrolledSubjects: ['Machine Learning', 'Operating Systems', 'Database Management'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    memorySessions.length = 0;
    memoryScores.length = 0;
  },
};
