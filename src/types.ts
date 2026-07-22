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
  fullName: string;
  email: string;
  teacherType?: 'Class Teacher' | 'Subject Teacher' | 'Coordinator';
  role: 'teacher' | 'student';
  avatar?: string;
  xp?: number;
  totalHours?: number;
  completedSessions?: number;
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
