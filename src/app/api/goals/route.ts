import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Goal } from "@/models/Goal";

export async function GET() {
  try {
    await connectDB();
    const goals = await Goal.find({}).sort({ priority: 1, targetDate: 1 }).lean();
    return NextResponse.json(goals);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, description, targetAmount, currentAmount, targetDate, priority, monthlyContribution, icon } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    if (!targetAmount || targetAmount <= 0) return NextResponse.json({ error: "Target amount must be positive" }, { status: 400 });
    if (!targetDate) return NextResponse.json({ error: "Target date required" }, { status: 400 });

    const goal = await Goal.create({
      name: name.trim(),
      description: description ?? "",
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount ?? 0),
      targetDate: new Date(targetDate),
      priority: priority ?? "medium",
      monthlyContribution: parseFloat(monthlyContribution ?? 0),
      icon: icon ?? "🎯",
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
