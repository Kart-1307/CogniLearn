import mongoose, { Schema, Document } from 'mongoose';

export interface IStudySession extends Document {
  studentId: mongoose.Types.ObjectId;
  durationMinutes: number;
  xpEarned: number;
  avgFocusScore?: number;
  sessionType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema: Schema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    durationMinutes: { type: Number, required: true },
    xpEarned: { type: Number, required: true },
    avgFocusScore: { type: Number, default: 85 },
    sessionType: { type: String, default: 'Focus Session' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IStudySession>('StudySession', StudySessionSchema);
