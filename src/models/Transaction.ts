import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType = "EXPENSE" | "INCOME" | "RESERVE_TRANSFER";

export interface ITransaction extends Document {
  amount: number;
  type: TransactionType;
  ministryId: mongoose.Types.ObjectId | null;
  description: string;
  notes: string;
  date: Date;
  isSpecial: boolean;
  specialCategory: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    amount: { type: Number, required: true, min: 0.01 },
    type: {
      type: String,
      enum: ["EXPENSE", "INCOME", "RESERVE_TRANSFER"],
      required: true,
    },
    ministryId: { type: Schema.Types.ObjectId, ref: "Ministry", default: null },
    description: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
    date: { type: Date, required: true, default: Date.now },
    isSpecial: { type: Boolean, default: false },
    specialCategory: { type: String, default: "" },
  },
  { timestamps: true }
);

// Indexes
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ ministryId: 1, date: -1 });
TransactionSchema.index({ type: 1, date: -1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
