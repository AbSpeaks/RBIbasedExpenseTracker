import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGoal extends Document {
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: "high" | "medium" | "low";
  monthlyContribution: number;
  status: "active" | "completed" | "paused";
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date, required: true },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    monthlyContribution: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "completed", "paused"], default: "active" },
    icon: { type: String, default: "🎯" },
  },
  { timestamps: true }
);

GoalSchema.index({ targetDate: 1 });
GoalSchema.index({ status: 1 });

export const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);
