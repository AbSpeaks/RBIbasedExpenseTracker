import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFinancialPolicy extends Document {
  reserveTarget: number;
  minimumSavingsRate: number;
  minimumEmergencyReserve: number;
  foodLimit: number;
  entertainmentLimit: number;
  startupLimit: number;
  monthlyReserveContribution: number;
  maxDailySpend: number;
  updatedAt: Date;
}

const FinancialPolicySchema = new Schema<IFinancialPolicy>(
  {
    reserveTarget: { type: Number, default: 80000 },
    minimumSavingsRate: { type: Number, default: 20 }, // percentage
    minimumEmergencyReserve: { type: Number, default: 10000 },
    foodLimit: { type: Number, default: 3000 },
    entertainmentLimit: { type: Number, default: 1000 },
    startupLimit: { type: Number, default: 2000 },
    monthlyReserveContribution: { type: Number, default: 12000 },
    maxDailySpend: { type: Number, default: 500 },
  },
  { timestamps: true }
);

export const FinancialPolicy: Model<IFinancialPolicy> =
  mongoose.models.FinancialPolicy ||
  mongoose.model<IFinancialPolicy>("FinancialPolicy", FinancialPolicySchema);
