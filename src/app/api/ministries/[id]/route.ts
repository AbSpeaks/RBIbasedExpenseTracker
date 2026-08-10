import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Ministry } from "@/models/Ministry";
import { Budget } from "@/models/Budget";
import mongoose from "mongoose";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const ministry = await Ministry.findById(id).lean();
    if (!ministry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(ministry);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await request.json();
    const { name, icon, monthlyBudget, priority, color, active } = body;

    const updated = await Ministry.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(icon && { icon }),
        ...(monthlyBudget !== undefined && { monthlyBudget: parseFloat(monthlyBudget) }),
        ...(priority && { priority }),
        ...(color && { color }),
        ...(active !== undefined && { active }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) return NextResponse.json({ error: "Ministry not found" }, { status: 404 });

    // If budget changed, update the current month's budget record
    if (monthlyBudget !== undefined) {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      await Budget.findOneAndUpdate(
        { ministryId: id, month },
        { allocatedAmount: parseFloat(monthlyBudget) },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/ministries/[id] error:", error);
    return NextResponse.json({ error: "Failed to update ministry" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Ministry.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Ministry deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
