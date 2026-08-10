import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { FinancialPolicy } from "@/models/FinancialPolicy";

export async function GET() {
  try {
    await connectDB();
    let policy = await FinancialPolicy.findOne().lean();
    if (!policy) {
      policy = await FinancialPolicy.create({});
    }
    return NextResponse.json(policy);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const policy = await FinancialPolicy.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    return NextResponse.json(policy);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
