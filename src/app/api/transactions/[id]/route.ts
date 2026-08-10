import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import mongoose from "mongoose";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await request.json();
    const { amount, type, ministryId, description, notes, date } = body;

    if (amount !== undefined && amount <= 0)
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });

    const updated = await Transaction.findByIdAndUpdate(
      id,
      {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(type && { type }),
        ...(ministryId !== undefined && { ministryId: ministryId || null }),
        ...(description && { description: description.trim() }),
        ...(notes !== undefined && { notes: notes.trim() }),
        ...(date && { date: new Date(date) }),
      },
      { new: true, runValidators: true }
    ).populate("ministryId", "name icon color");

    if (!updated) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const deleted = await Transaction.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    return NextResponse.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
