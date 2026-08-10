import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMinistry extends Document {
  name: string;
  icon: string;
  monthlyBudget: number;
  priority: "essential" | "important" | "discretionary" | "strategic";
  active: boolean;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const MinistrySchema = new Schema<IMinistry>(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    monthlyBudget: { type: Number, required: true, min: 0 },
    priority: {
      type: String,
      enum: ["essential", "important", "discretionary", "strategic"],
      default: "discretionary",
    },
    active: { type: Boolean, default: true },
    color: { type: String, default: "#1769AA" },
  },
  { timestamps: true }
);

export const Ministry: Model<IMinistry> =
  mongoose.models.Ministry || mongoose.model<IMinistry>("Ministry", MinistrySchema);
