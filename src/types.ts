export type Route = 
  | 'landing'
  | 'teacher-login'
  | 'teacher-signup'
  | 'student-login'
  | 'student-signup'
  | 'teacher-dashboard'
  | 'student-dashboard';

export type InstitutionTier = 'school' | 'college';

export interface SchoolStudentProfile {
  tier: 'school';
  institutionName: string;
  board: string;
  standard: string;
  schoolStream?: string;
  section: string;
  rollNo: string;
  subjects: string[];
  classCode?: string;
}

export interface CollegeStudentProfile {
  tier: 'college';
  institutionName: string;
  department: string;
  degree: string;
  academicYear: string;
  semester: string;
  section: string;
  rollNo: string;
  subjects: string[];
  classCode?: string;
}

export type StudentAcademicProfile = SchoolStudentProfile | CollegeStudentProfile;

export interface SchoolTeacherProfile {
  tier: 'school';
  institutionName: string;
  role: string;
  board?: string;
  staffIdNumber?: string;
  primarySubjects: string[];
}

export interface CollegeTeacherProfile {
  tier: 'college';
  institutionName: string;
  role: string;
  department: string;
  staffIdNumber?: string;
  primarySubjects: string[];
}

export type TeacherProfessionalProfile = SchoolTeacherProfile | CollegeTeacherProfile;

export interface Cohort {
  id: string;
  code: string;
  name: string;
  tier: InstitutionTier;
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
  studentCount?: number;
  createdAt?: string;
}

export interface Enrollment {
  id: string;
  cohortId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  rollNo: string;
  enrolledSubjects: string[];
  status: 'active' | 'inactive' | 'transferred';
  cohort?: Cohort;
  createdAt?: string;
}

export interface User {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  teacherType?: 'Class Teacher' | 'Subject Teacher' | 'Coordinator' | 'Professor' | 'HOD' | 'Dean' | 'Lab Assistant';
  role: 'teacher' | 'student';
  avatar?: string;
  xp?: number;
  totalHours?: number;
  completedSessions?: number;
  isDemo?: boolean;

  // Structured Academic Profiles
  tier?: InstitutionTier;
  academicProfile?: StudentAcademicProfile;
  teacherProfile?: TeacherProfessionalProfile;
  cohorts?: Cohort[];
  enrollments?: Enrollment[];

  // Extended Student Fields (Backward Compatible)
  gradeLevel?: string;
  learningStyle?: 'Visual' | 'Auditory' | 'Kinesthetic' | 'Reading/Writing';
  curriculumTrack?: string;
  studySchedule?: string;
  guardianEmail?: string;
  rollNo?: string;
  enrolledSubjects?: string[];

  // Extended Teacher Fields (Backward Compatible)
  institutionName?: string;
  teacherIdNumber?: string;
  department?: string;
  assignedClasses?: string[];
}

export interface GazeBreakdown {
  centerPercent: number;
  offScreenLeftPercent: number;
  offScreenRightPercent: number;
  lookingDownPercent: number;
  lookingUpPercent: number;
  eyesClosedPercent: number;
}

export interface CognitiveFatigueAnalysis {
  blinkRatePerMin: number;
  averageEyeOpenness: number; // 0.0 to 1.0
  fatigueRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  fatigueDescription: string;
  postureScore: number; // 0 to 100
}

export interface CognitiveMetrics {
  focusStabilityIndex: number; // 0 to 100
  peakAttentionTime: string;
  lowestAttentionTime: string;
  focusDropEventsCount: number;
  estimatedComprehensionRate: number; // percentage
  engagementLevel: 'Optimal Active' | 'Sustained Steady' | 'Variable Attention' | 'At-Risk';
}

export interface FocusTimelineSample {
  timeSec: number;
  timeLabel: string;
  focusScore: number;
  gazeState: string;
}

export interface DiagnosticMetric {
  avgFocusScore: number;
  peakFocusScore: number;
  minFocusScore: number;
  optimalFocusPercent: number;
  moderateFocusPercent: number;
  distractedPercent: number;
  gazeShiftsCount: number;
  meshQuality: string;
  // Enhanced detailed analytics
  gazeBreakdown?: GazeBreakdown;
  fatigueAnalysis?: CognitiveFatigueAnalysis;
  cognitiveMetrics?: CognitiveMetrics;
  timelineSamples?: FocusTimelineSample[];
}

export interface StudentDiagnosticReport {
  id: string;
  studentId: string | number;
  studentName: string;
  sessionTitle: string;
  date: string;
  timestamp: number;
  configuredDurationMinutes: number;
  actualDurationSeconds: number;
  status: 'Completed' | 'Manually Stopped';
  metrics: DiagnosticMetric;
  observations: string[];
  recommendations: string[];
  aiActionPlan?: string[];
  subjectName?: string;
}

export interface ClassDiagnosticReport {
  id: string;
  classId: string;
  className: string;
  sessionTitle: string;
  date: string;
  timestamp: number;
  configuredDurationMinutes: number;
  actualDurationSeconds: number;
  status: 'Completed' | 'Manually Stopped';
  studentsCount: number;
  avgClassFocus: number;
  peakClassFocus: number;
  distractedStudentsCount: number;
  optimalStudentsCount: number;
  classObservations: string[];
  classRecommendations: string[];
  studentReports: StudentDiagnosticReport[];
  subjectName?: string;
  overallGazeBreakdown?: GazeBreakdown;
  overallFatigueRisk?: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface FocusBreakRecord {
  id: string;
  studentId: string;
  timestamp: number;
  date: string;
  breakType: 'box-breathing' | '20-20-20-eyes' | 'neck-stretch';
  durationSeconds: number;
  triggerFocusScore: number;
  completed: boolean;
}

export interface SubjectFocusStat {
  subject: string;
  avgFocus: number;
  sessionsCount: number;
  totalMinutes: number;
  retentionEstimate: number;
}

export interface HourlyFocusStat {
  hour: number; // 0 to 23
  hourLabel: string;
  avgFocus: number;
  sessionCount: number;
  isPeak: boolean;
}
