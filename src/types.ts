export type Route = 
  | 'landing'
  | 'teacher-login'
  | 'teacher-signup'
  | 'student-login'
  | 'student-signup'
  | 'teacher-dashboard'
  | 'student-dashboard';

export interface User {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  teacherType?: 'Class Teacher' | 'Subject Teacher' | 'Coordinator';
  role: 'teacher' | 'student';
  avatar?: string;
  xp?: number;
  totalHours?: number;
  completedSessions?: number;
  isDemo?: boolean;
  // Extended Student Fields
  gradeLevel?: string;
  learningStyle?: 'Visual' | 'Auditory' | 'Kinesthetic' | 'Reading/Writing';
  curriculumTrack?: string;
  studySchedule?: string;
  guardianEmail?: string;
  // Extended Teacher Fields
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
