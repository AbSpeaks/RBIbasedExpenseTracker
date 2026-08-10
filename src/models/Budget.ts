import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudget extends Document {
  ministryId: mongoose.Types.ObjectId;
  month: string; // "YYYY-MM"
  allocatedAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    ministryId: { type: Schema.Types.ObjectId, ref: "Ministry", required: true },
    month: { type: String, required: true }, // e.g. "2024-08"
    allocatedAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Unique budget per ministry per month
BudgetSchema.index({ ministryId: 1, month: 1 }, { unique: true });

export const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);
