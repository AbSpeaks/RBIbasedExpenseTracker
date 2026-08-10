import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { RecurringExpense } from "@/models/RecurringExpense";

export async function GET() {
  try {
    await connectDB();
    const items = await RecurringExpense.find({})
      .populate("ministryId", "name icon color")
      .sort({ nextDueDate: 1 })
      .lean();
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, amount, ministryId, frequency, nextDueDate, notes } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    if (!ministryId) return NextResponse.json({ error: "Ministry required" }, { status: 400 });
    if (!nextDueDate) return NextResponse.json({ error: "Due date required" }, { status: 400 });

    const item = await RecurringExpense.create({
      name: name.trim(),
      amount: parseFloat(amount),
      ministryId,
      frequency: frequency ?? "monthly",
      nextDueDate: new Date(nextDueDate),
      notes: notes ?? "",
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
