import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'teacher';
  teacherType?: 'Class Teacher' | 'Subject Teacher' | 'Coordinator';
  avatar?: string;
  xp: number;
  totalHours: number;
  completedSessions: number;
  // Extended Student Profile Fields
  gradeLevel?: string;
  learningStyle?: 'Visual' | 'Auditory' | 'Kinesthetic' | 'Reading/Writing';
  curriculumTrack?: string;
  studySchedule?: string;
  guardianEmail?: string;
  // Extended Teacher Profile Fields
  institutionName?: string;
  teacherIdNumber?: string;
  department?: string;
  assignedClasses?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], required: true },
    teacherType: { type: String, enum: ['Class Teacher', 'Subject Teacher', 'Coordinator'] },
    avatar: { type: String, default: null },
    xp: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
    // Extended Student Profile Fields
    gradeLevel: { type: String, default: 'Class 11' },
    learningStyle: { type: String, enum: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'], default: 'Visual' },
    curriculumTrack: { type: String, default: 'CBSE' },
    studySchedule: { type: String, default: 'Morning Focus' },
    guardianEmail: { type: String, default: '' },
    // Extended Teacher Profile Fields
    institutionName: { type: String, default: '' },
    teacherIdNumber: { type: String, default: '' },
    department: { type: String, default: 'Science & Math' },
    assignedClasses: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
