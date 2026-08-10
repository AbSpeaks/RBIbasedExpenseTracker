import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAsset extends Document {
  name: string;
  value: number;
  type: "cash" | "reserve" | "savings" | "investment" | "other";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ["cash", "reserve", "savings", "investment", "other"],
      default: "other",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Asset: Model<IAsset> =
  mongoose.models.Asset || mongoose.model<IAsset>("Asset", AssetSchema);

export interface ILiability extends Document {
  name: string;
  amount: number;
  type: "emi" | "loan" | "credit" | "other";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const LiabilitySchema = new Schema<ILiability>(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ["emi", "loan", "credit", "other"],
      default: "other",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Liability: Model<ILiability> =
  mongoose.models.Liability || mongoose.model<ILiability>("Liability", LiabilitySchema);
