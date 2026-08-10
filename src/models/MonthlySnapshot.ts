import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMonthlySnapshot extends Document {
  month: string; // "YYYY-MM"
  income: number;
  expenses: number;
  savings: number;
  reserveContribution: number;
  fiscalHealthScore: number;
  netWorth: number;
  savingsRate: number;
  budgetUtilization: number;
  createdAt: Date;
}

const MonthlySnapshotSchema = new Schema<IMonthlySnapshot>(
  {
    month: { type: String, required: true, unique: true },
    income: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    reserveContribution: { type: Number, default: 0 },
    fiscalHealthScore: { type: Number, default: 0 },
    netWorth: { type: Number, default: 0 },
    savingsRate: { type: Number, default: 0 },
    budgetUtilization: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MonthlySnapshotSchema.index({ month: -1 });

export const MonthlySnapshot: Model<IMonthlySnapshot> =
  mongoose.models.MonthlySnapshot ||
  mongoose.model<IMonthlySnapshot>("MonthlySnapshot", MonthlySnapshotSchema);
