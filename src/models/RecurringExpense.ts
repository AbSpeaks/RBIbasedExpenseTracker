import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecurringExpense extends Document {
  name: string;
  amount: number;
  ministryId: mongoose.Types.ObjectId;
  frequency: "monthly" | "weekly" | "quarterly" | "yearly";
  nextDueDate: Date;
  active: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringExpenseSchema = new Schema<IRecurringExpense>(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    ministryId: { type: Schema.Types.ObjectId, ref: "Ministry", required: true },
    frequency: {
      type: String,
      enum: ["monthly", "weekly", "quarterly", "yearly"],
      default: "monthly",
    },
    nextDueDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

RecurringExpenseSchema.index({ nextDueDate: 1 });
RecurringExpenseSchema.index({ active: 1 });

export const RecurringExpense: Model<IRecurringExpense> =
  mongoose.models.RecurringExpense ||
  mongoose.model<IRecurringExpense>("RecurringExpense", RecurringExpenseSchema);
