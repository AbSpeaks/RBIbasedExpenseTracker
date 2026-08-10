import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { Ministry } from "@/models/Ministry";
import { User } from "@/models/User";
import { Budget } from "@/models/Budget";
import { Goal } from "@/models/Goal";
import { RecurringExpense } from "@/models/RecurringExpense";
import { FinancialPolicy } from "@/models/FinancialPolicy";
import { Asset, Liability } from "@/models/NetWorth";
import { DashboardContext } from "@/lib/finance/types";
import { calculateCurrentCash, calculateMonthlyExpenses, calculateMonthlyIncome, calculateMonthlySavings, calculateTotalBudget, getMonthKey } from "@/lib/finance/cashFlow";
import { analyzeMinistries, calculateBudgetUtilization } from "@/lib/finance/budgetAnalysis";
import { calculateFiscalHealth, getTreasuryStatus } from "@/lib/finance/fiscalHealth";
import { calculateGoalProgress } from "@/lib/finance/goalProjection";
import { calculateSafeDailySpend } from "@/lib/finance/safeToSpend";
import { calculateRunway } from "@/lib/finance/runway";
import { calculateNetWorth } from "@/lib/finance/netWorth";
import { generateFinancialAlerts, generateRecommendations } from "@/lib/finance/intelligence";

export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    const currentMonth = getMonthKey(today);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // Fetch all needed data in parallel
    const [user, ministries, monthTransactions, allTransactions, recurringExpenses, goals, policy, assets, liabilities, budgets] =
      await Promise.all([
        User.findOne().lean(),
        Ministry.find({ active: true }).lean(),
        Transaction.find({ date: { $gte: monthStart, $lte: monthEnd } }).lean(),
        Transaction.find().sort({ date: -1 }).limit(100).lean(),
        RecurringExpense.find({ active: true }).lean(),
        Goal.find({ status: "active" }).lean(),
        FinancialPolicy.findOne().lean(),
        Asset.find().lean(),
        Liability.find().lean(),
        Budget.find({ month: currentMonth }).lean(),
      ]);

    const defaultPolicy = {
      reserveTarget: 80000,
      minimumSavingsRate: 20,
      minimumEmergencyReserve: 10000,
      foodLimit: 3000,
      entertainmentLimit: 1000,
      startupLimit: 2000,
      monthlyReserveContribution: 12000,
    };

    const policyData = policy ?? defaultPolicy;
    const userData = user ?? { monthlyIncome: 32000, reserveBalance: 18000, lowIncomeMode: false, lowIncomeAmount: 25000 };

    // Map transactions by ministry
    const spendingByMinistry: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      if (t.type === "EXPENSE" && t.ministryId) {
        const key = t.ministryId.toString();
        spendingByMinistry[key] = (spendingByMinistry[key] ?? 0) + t.amount;
      }
    });

    // Build budget map
    const budgetMap: Record<string, number> = {};
    budgets.forEach((b) => {
      budgetMap[b.ministryId.toString()] = b.allocatedAmount;
    });

    // Enrich ministries with spending data
    const enrichedMinistries = ministries.map((m) => {
      const id = m._id.toString();
      const monthlyBudget = budgetMap[id] ?? m.monthlyBudget;
      const spent = spendingByMinistry[id] ?? 0;
      return {
        _id: id,
        name: m.name,
        icon: m.icon,
        monthlyBudget,
        priority: m.priority,
        color: m.color,
        spent,
        remaining: Math.max(0, monthlyBudget - spent),
        percentUsed: monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0,
      };
    });

    const ctx: DashboardContext = {
      user: {
        monthlyIncome: userData.lowIncomeMode ? userData.lowIncomeAmount : userData.monthlyIncome,
        reserveBalance: userData.reserveBalance,
        lowIncomeMode: userData.lowIncomeMode,
        lowIncomeAmount: userData.lowIncomeAmount,
      },
      ministries: enrichedMinistries,
      monthTransactions: monthTransactions.map((t) => ({
        _id: t._id.toString(),
        amount: t.amount,
        type: t.type,
        ministryId: t.ministryId?.toString() ?? null,
        description: t.description,
        notes: t.notes,
        date: t.date.toISOString(),
      })),
      allTransactions: allTransactions.map((t) => ({
        _id: t._id.toString(),
        amount: t.amount,
        type: t.type,
        ministryId: t.ministryId?.toString() ?? null,
        description: t.description,
        notes: t.notes,
        date: t.date.toISOString(),
      })),
      recurringExpenses: recurringExpenses.map((r) => ({
        _id: r._id.toString(),
        name: r.name,
        amount: r.amount,
        ministryId: r.ministryId.toString(),
        frequency: r.frequency,
        nextDueDate: r.nextDueDate.toISOString(),
      })),
      goals: goals.map((g) => ({
        _id: g._id.toString(),
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate.toISOString(),
        monthlyContribution: g.monthlyContribution,
        status: g.status,
      })),
      policy: {
        reserveTarget: policyData.reserveTarget,
        minimumSavingsRate: policyData.minimumSavingsRate,
        minimumEmergencyReserve: policyData.minimumEmergencyReserve,
        foodLimit: policyData.foodLimit,
        entertainmentLimit: policyData.entertainmentLimit,
        startupLimit: policyData.startupLimit,
        monthlyReserveContribution: policyData.monthlyReserveContribution,
      },
      currentMonth,
      today,
    };

    const currentCash = calculateCurrentCash(ctx);
    const monthlyIncome = calculateMonthlyIncome(ctx);
    const monthlyExpenses = calculateMonthlyExpenses(ctx);
    const monthlySavings = calculateMonthlySavings(ctx);
    const totalBudget = calculateTotalBudget(ctx);
    const budgetUtilization = calculateBudgetUtilization(ctx);
    const fiscalHealth = calculateFiscalHealth(ctx);
    const treasuryStatus = getTreasuryStatus(fiscalHealth);
    const safeToSpend = calculateSafeDailySpend(ctx);
    const runway = calculateRunway(ctx);
    const ministryAnalyses = analyzeMinistries(ctx);
    const goalProgressList = goals.map((g) =>
      calculateGoalProgress({
        _id: g._id.toString(),
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate.toISOString(),
        monthlyContribution: g.monthlyContribution,
        status: g.status,
      })
    );
    const alerts = generateFinancialAlerts(ctx);
    const recommendations = generateRecommendations(ctx);
    const netWorth = calculateNetWorth(
      assets.map((a) => ({ name: a.name, value: a.value, type: a.type })),
      liabilities.map((l) => ({ name: l.name, amount: l.amount, type: l.type })),
      currentCash,
      userData.reserveBalance
    );

    // Recent transactions
    const recentTransactions = allTransactions.slice(0, 10).map((t) => ({
      _id: t._id.toString(),
      amount: t.amount,
      type: t.type,
      ministryId: t.ministryId?.toString() ?? null,
      ministryName: enrichedMinistries.find((m) => m._id === t.ministryId?.toString())?.name ?? "—",
      ministryIcon: enrichedMinistries.find((m) => m._id === t.ministryId?.toString())?.icon ?? "",
      description: t.description,
      notes: t.notes,
      date: t.date.toISOString(),
    }));

    // Upcoming obligations (next 30 days)
    const upcomingObligations = recurringExpenses
      .filter((r) => {
        const due = new Date(r.nextDueDate);
        const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue >= 0 && daysUntilDue <= 30;
      })
      .map((r) => ({
        _id: r._id.toString(),
        name: r.name,
        amount: r.amount,
        nextDueDate: r.nextDueDate.toISOString(),
        daysUntilDue: Math.ceil((new Date(r.nextDueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return NextResponse.json({
      currentCash,
      reserveBalance: userData.reserveBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      totalBudget,
      budgetUtilization,
      savingsRate: monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0,
      fiscalHealth,
      treasuryStatus,
      safeToSpend,
      runway,
      ministryAnalyses,
      goalProgressList,
      alerts,
      recommendations,
      netWorth,
      recentTransactions,
      upcomingObligations,
      user: {
        name: ("name" in userData ? userData.name : undefined) ?? "Abin",
        monthlyIncome: userData.monthlyIncome,
        lowIncomeMode: userData.lowIncomeMode,
        lowIncomeAmount: userData.lowIncomeAmount,
        reserveBalance: userData.reserveBalance,
      },
      currentMonth,
      today: today.toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
