import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { Ministry } from "@/models/Ministry";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const type = searchParams.get("type");
    const ministryId = searchParams.get("ministryId");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month"); // "YYYY-MM"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (type) query.type = type;
    if (ministryId) query.ministryId = new mongoose.Types.ObjectId(ministryId);
    if (search) query.description = { $regex: search, $options: "i" };
    if (month) {
      const [year, mon] = month.split("-");
      query.date = {
        $gte: new Date(parseInt(year), parseInt(mon) - 1, 1),
        $lte: new Date(parseInt(year), parseInt(mon), 0, 23, 59, 59),
      };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate("ministryId", "name icon color")
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return NextResponse.json({
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { amount, type, ministryId, description, notes, date, isSpecial, specialCategory } = body;

    if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    if (!type || !["EXPENSE", "INCOME", "RESERVE_TRANSFER"].includes(type))
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ error: "Description is required" }, { status: 400 });
    if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });
    if (type === "EXPENSE" && !ministryId) return NextResponse.json({ error: "Ministry is required for expenses" }, { status: 400 });

    if (ministryId) {
      const ministry = await Ministry.findById(ministryId);
      if (!ministry) return NextResponse.json({ error: "Ministry not found" }, { status: 400 });
    }

    const transaction = await Transaction.create({
      amount: parseFloat(amount),
      type,
      ministryId: ministryId ?? null,
      description: description.trim(),
      notes: notes?.trim() ?? "",
      date: new Date(date),
      isSpecial: isSpecial ?? false,
      specialCategory: specialCategory ?? "",
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
