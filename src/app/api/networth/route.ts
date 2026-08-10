import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Asset, Liability } from "@/models/NetWorth";

export async function GET() {
  try {
    await connectDB();
    const [assets, liabilities] = await Promise.all([Asset.find().lean(), Liability.find().lean()]);
    return NextResponse.json({ assets, liabilities });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { entityType, name, value, amount, type, notes } = body;

    if (entityType === "asset") {
      const asset = await Asset.create({ name, value: parseFloat(value), type, notes });
      return NextResponse.json(asset, { status: 201 });
    } else {
      const liability = await Liability.create({ name, amount: parseFloat(amount), type, notes });
      return NextResponse.json(liability, { status: 201 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
