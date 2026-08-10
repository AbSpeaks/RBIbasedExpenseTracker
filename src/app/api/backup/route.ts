import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Ministry } from "@/models/Ministry";
import { Transaction } from "@/models/Transaction";
import { Goal } from "@/models/Goal";
import { RecurringExpense } from "@/models/RecurringExpense";
import { FinancialPolicy } from "@/models/FinancialPolicy";
import { Budget } from "@/models/Budget";
import { Asset, Liability } from "@/models/NetWorth";

// Export all data
export async function GET() {
  try {
    await connectDB();
    const [users, ministries, transactions, goals, recurringExpenses, policies, budgets, assets, liabilities] =
      await Promise.all([
        User.find().lean(),
        Ministry.find().lean(),
        Transaction.find().lean(),
        Goal.find().lean(),
        RecurringExpense.find().lean(),
        FinancialPolicy.find().lean(),
        Budget.find().lean(),
        Asset.find().lean(),
        Liability.find().lean(),
      ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      data: { users, ministries, transactions, goals, recurringExpenses, policies, budgets, assets, liabilities },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="abin-government-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

// Import data
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { data } = body;
    if (!data) return NextResponse.json({ error: "No data provided" }, { status: 400 });

    // Clear and reimport
    await Promise.all([
      User.deleteMany({}),
      Ministry.deleteMany({}),
      Transaction.deleteMany({}),
      Goal.deleteMany({}),
      RecurringExpense.deleteMany({}),
      FinancialPolicy.deleteMany({}),
      Budget.deleteMany({}),
      Asset.deleteMany({}),
      Liability.deleteMany({}),
    ]);

    if (data.users?.length) await User.insertMany(data.users);
    if (data.ministries?.length) await Ministry.insertMany(data.ministries);
    if (data.transactions?.length) await Transaction.insertMany(data.transactions);
    if (data.goals?.length) await Goal.insertMany(data.goals);
    if (data.recurringExpenses?.length) await RecurringExpense.insertMany(data.recurringExpenses);
    if (data.policies?.length) await FinancialPolicy.insertMany(data.policies);
    if (data.budgets?.length) await Budget.insertMany(data.budgets);
    if (data.assets?.length) await Asset.insertMany(data.assets);
    if (data.liabilities?.length) await Liability.insertMany(data.liabilities);

    return NextResponse.json({ message: "Import successful" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
