import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    let user = await User.findOne().lean();
    if (!user) {
      user = await User.create({ name: "Abin" });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const user = await User.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
