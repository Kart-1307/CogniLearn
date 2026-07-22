import mongoose, { Schema, Document } from 'mongoose';

export interface IBaselineScore extends Document {
  studentId: mongoose.Types.ObjectId;
  subject: string;
  cognitiveScore: number;
  focusIndex: number;
  retentionRate: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BaselineScoreSchema: Schema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    cognitiveScore: { type: Number, required: true, min: 0, max: 100 },
    focusIndex: { type: Number, required: true, min: 0, max: 100 },
    retentionRate: { type: Number, required: true, min: 0, max: 100 },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBaselineScore>('BaselineScore', BaselineScoreSchema);
