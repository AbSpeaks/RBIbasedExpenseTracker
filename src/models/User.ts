import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  currency: string;
  monthlyIncome: number;
  lowIncomeAmount: number;
  currentSalary: number;
  reserveBalance: number;
  lowIncomeMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, default: "Abin" },
    currency: { type: String, default: "INR" },
    monthlyIncome: { type: Number, default: 32000 },
    lowIncomeAmount: { type: Number, default: 25000 },
    currentSalary: { type: Number, default: 32000 },
    reserveBalance: { type: Number, default: 18000 },
    lowIncomeMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
