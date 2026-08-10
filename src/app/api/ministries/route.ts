import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Ministry } from "@/models/Ministry";

export async function GET() {
  try {
    await connectDB();
    const ministries = await Ministry.find({}).sort({ priority: 1, name: 1 }).lean();
    return NextResponse.json(ministries);
  } catch (error) {
    console.error("GET /api/ministries error:", error);
    return NextResponse.json({ error: "Failed to fetch ministries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, icon, monthlyBudget, priority, color } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!monthlyBudget || monthlyBudget < 0)
      return NextResponse.json({ error: "Budget must be non-negative" }, { status: 400 });

    const ministry = await Ministry.create({
      name: name.trim(),
      icon: icon ?? "🏛️",
      monthlyBudget: parseFloat(monthlyBudget),
      priority: priority ?? "discretionary",
      color: color ?? "#1769AA",
    });

    return NextResponse.json(ministry, { status: 201 });
  } catch (error) {
    console.error("POST /api/ministries error:", error);
    return NextResponse.json({ error: "Failed to create ministry" }, { status: 500 });
  }
}
