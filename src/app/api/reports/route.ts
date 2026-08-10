import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { Ministry } from "@/models/Ministry";
import { getMonthKey } from "@/lib/finance/cashFlow";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const monthsBack = parseInt(searchParams.get("months") ?? "6");

    const ministries = await Ministry.find({ active: true }).lean();
    const reports = [];

    for (let i = 0; i < monthsBack; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthKey = getMonthKey(d);

      const transactions = await Transaction.find({
        date: { $gte: monthStart, $lte: monthEnd },
      }).lean();

      const income = transactions
        .filter((t) => t.type === "INCOME")
        .reduce((s, t) => s + t.amount, 0);
      const expenses = transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((s, t) => s + t.amount, 0);
      const reserveTransfers = transactions
        .filter((t) => t.type === "RESERVE_TRANSFER")
        .reduce((s, t) => s + t.amount, 0);
      const savings = income - expenses - reserveTransfers;

      // Ministry breakdown
      const ministryBreakdown = ministries.map((m) => {
        const spent = transactions
          .filter((t) => t.type === "EXPENSE" && t.ministryId?.toString() === m._id.toString())
          .reduce((s, t) => s + t.amount, 0);
        return { ministryId: m._id.toString(), name: m.name, icon: m.icon, budget: m.monthlyBudget, spent };
      });

      const largestMinistry = ministryBreakdown.sort((a, b) => b.spent - a.spent)[0];
      const largestExpense = transactions
        .filter((t) => t.type === "EXPENSE")
        .sort((a, b) => b.amount - a.amount)[0];

      reports.push({
        month: monthKey,
        label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        income,
        expenses,
        savings,
        reserveContribution: reserveTransfers,
        savingsRate: income > 0 ? ((savings / income) * 100).toFixed(1) : "0",
        surplus: savings > 0,
        ministryBreakdown,
        largestMinistry: largestMinistry ? { name: largestMinistry.name, spent: largestMinistry.spent } : null,
        largestExpense: largestExpense ? { description: largestExpense.description, amount: largestExpense.amount } : null,
        transactionCount: transactions.length,
      });
    }

    return NextResponse.json(reports.reverse());
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
