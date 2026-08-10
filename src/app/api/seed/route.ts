import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Ministry } from "@/models/Ministry";
import { Transaction } from "@/models/Transaction";
import { Goal } from "@/models/Goal";
import { RecurringExpense } from "@/models/RecurringExpense";
import { FinancialPolicy } from "@/models/FinancialPolicy";
import { Budget } from "@/models/Budget";
import { Asset, Liability } from "@/models/NetWorth";

export async function GET() {
  try {
    await connectDB();

    // Clear existing data
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

    // Create user
    const user = await User.create({
      name: "Abin",
      currency: "INR",
      monthlyIncome: 32000,
      lowIncomeAmount: 25000,
      currentSalary: 32000,
      reserveBalance: 18000,
      lowIncomeMode: false,
    });

    // Create ministries
    const ministryData = [
      { name: "Reserve Bank", icon: "🏦", monthlyBudget: 12000, priority: "essential", color: "#9B59B6" },
      { name: "Housing & Utilities", icon: "🏠", monthlyBudget: 5700, priority: "essential", color: "#1769AA" },
      { name: "Debt / EMI", icon: "💳", monthlyBudget: 2500, priority: "essential", color: "#FF6B6B" },
      { name: "Startup Affairs", icon: "🚀", monthlyBudget: 2000, priority: "strategic", color: "#32C5FF" },
      { name: "Family Affairs", icon: "👨‍👩‍👦", monthlyBudget: 2000, priority: "important", color: "#F5C451" },
      { name: "Food", icon: "🍔", monthlyBudget: 3000, priority: "essential", color: "#3DDC97" },
      { name: "Transport", icon: "🚕", monthlyBudget: 1500, priority: "important", color: "#32C5FF" },
      { name: "Entertainment", icon: "🎉", monthlyBudget: 1000, priority: "discretionary", color: "#F5C451" },
      { name: "Bills & Recharge", icon: "📱", monthlyBudget: 300, priority: "essential", color: "#9FB3C8" },
      { name: "Shopping / Miscellaneous", icon: "🛍️", monthlyBudget: 2000, priority: "discretionary", color: "#FF6B6B" },
    ];

    const ministries = await Ministry.insertMany(ministryData);
    const ministryMap: Record<string, string> = {};
    ministries.forEach((m) => {
      ministryMap[m.name] = m._id.toString();
    });

    // Current month key
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Create budget records for current month
    await Budget.insertMany(
      ministries.map((m) => ({
        ministryId: m._id,
        month: monthKey,
        allocatedAmount: m.monthlyBudget,
      }))
    );

    // Create realistic transactions for current month
    const transactionData = [
      // Income
      { amount: 32000, type: "INCOME", description: "Monthly Salary - August", date: new Date(now.getFullYear(), now.getMonth(), 1), ministryId: null },
      
      // Reserve transfer
      { amount: 12000, type: "RESERVE_TRANSFER", description: "Reserve Bank Monthly Contribution", date: new Date(now.getFullYear(), now.getMonth(), 1), ministryId: ministryMap["Reserve Bank"] },
      
      // Housing
      { amount: 5500, type: "EXPENSE", description: "Monthly Rent", date: new Date(now.getFullYear(), now.getMonth(), 2), ministryId: ministryMap["Housing & Utilities"] },
      { amount: 175, type: "EXPENSE", description: "Electricity Bill", date: new Date(now.getFullYear(), now.getMonth(), 5), ministryId: ministryMap["Housing & Utilities"] },
      
      // EMI
      { amount: 2500, type: "EXPENSE", description: "Monthly EMI", date: new Date(now.getFullYear(), now.getMonth(), 3), ministryId: ministryMap["Debt / EMI"] },
      
      // Food
      { amount: 180, type: "EXPENSE", description: "Dinner — Zomato", date: new Date(now.getFullYear(), now.getMonth(), 4), ministryId: ministryMap["Food"] },
      { amount: 250, type: "EXPENSE", description: "Lunch — Outside", date: new Date(now.getFullYear(), now.getMonth(), 5), ministryId: ministryMap["Food"] },
      { amount: 320, type: "EXPENSE", description: "Grocery — D-Mart", date: new Date(now.getFullYear(), now.getMonth(), 6), ministryId: ministryMap["Food"] },
      { amount: 220, type: "EXPENSE", description: "Breakfast + Snacks", date: new Date(now.getFullYear(), now.getMonth(), 7), ministryId: ministryMap["Food"] },
      { amount: 145, type: "EXPENSE", description: "Tea + Evening Snacks", date: new Date(now.getFullYear(), now.getMonth(), 8), ministryId: ministryMap["Food"] },
      
      // Transport
      { amount: 120, type: "EXPENSE", description: "Auto — Office", date: new Date(now.getFullYear(), now.getMonth(), 4), ministryId: ministryMap["Transport"] },
      { amount: 150, type: "EXPENSE", description: "Cab — Evening", date: new Date(now.getFullYear(), now.getMonth(), 6), ministryId: ministryMap["Transport"] },
      { amount: 85, type: "EXPENSE", description: "Bus + Auto", date: new Date(now.getFullYear(), now.getMonth(), 7), ministryId: ministryMap["Transport"] },
      
      // Entertainment
      { amount: 400, type: "EXPENSE", description: "Movie — PVR", date: new Date(now.getFullYear(), now.getMonth(), 8), ministryId: ministryMap["Entertainment"] },
      
      // Family
      { amount: 800, type: "EXPENSE", description: "D-Mart Family Shopping", date: new Date(now.getFullYear(), now.getMonth(), 6), ministryId: ministryMap["Family Affairs"] },
      
      // Startup
      { amount: 500, type: "EXPENSE", description: "Domain + Hosting", date: new Date(now.getFullYear(), now.getMonth(), 3), ministryId: ministryMap["Startup Affairs"] },
      
      // Bills
      { amount: 299, type: "EXPENSE", description: "Mobile Recharge", date: new Date(now.getFullYear(), now.getMonth(), 1), ministryId: ministryMap["Bills & Recharge"] },
    ];

    await Transaction.insertMany(
      transactionData.map((t) => ({
        ...t,
        ministryId: t.ministryId ?? null,
        notes: "",
        date: t.date,
      }))
    );

    // Create primary goal
    await Goal.create({
      name: "Operation ₹80K",
      description: "Build reserve fund to ₹80,000 by birthday",
      targetAmount: 80000,
      currentAmount: 18000,
      targetDate: new Date("2027-01-08"),
      priority: "high",
      monthlyContribution: 12000,
      icon: "🏦",
      status: "active",
    });

    // Find housing ministry for recurring expenses
    const housingId = ministryMap["Housing & Utilities"];
    const emiId = ministryMap["Debt / EMI"];
    const billsId = ministryMap["Bills & Recharge"];

    // Next month dates for recurring expenses
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEmi = new Date(now.getFullYear(), now.getMonth() + 1, 3);
    const nextMonthRecharge = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await RecurringExpense.insertMany([
      { name: "Monthly Rent", amount: 5500, ministryId: housingId, frequency: "monthly", nextDueDate: nextMonth, notes: "Landlord payment" },
      { name: "Monthly EMI", amount: 2500, ministryId: emiId, frequency: "monthly", nextDueDate: nextMonthEmi, notes: "Loan EMI" },
      { name: "Mobile Recharge", amount: 299, ministryId: billsId, frequency: "monthly", nextDueDate: nextMonthRecharge, notes: "Airtel prepaid" },
      { name: "Electricity Bill", amount: 175, ministryId: housingId, frequency: "monthly", nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5), notes: "Average ₹150-200" },
    ]);

    // Create financial policy
    await FinancialPolicy.create({
      reserveTarget: 80000,
      minimumSavingsRate: 20,
      minimumEmergencyReserve: 10000,
      foodLimit: 3000,
      entertainmentLimit: 1000,
      startupLimit: 2000,
      monthlyReserveContribution: 12000,
      maxDailySpend: 500,
    });

    // Seed assets and liabilities
    await Asset.insertMany([
      { name: "Savings Account", value: 5000, type: "savings", notes: "SBI savings" },
      { name: "Investments / MF", value: 0, type: "investment", notes: "Add when applicable" },
    ]);

    await Liability.insertMany([
      { name: "Active Loan / EMI", amount: 15000, type: "emi", notes: "Approximate remaining balance" },
    ]);

    return NextResponse.json({
      message: "Database seeded successfully",
      user: user.name,
      ministries: ministries.length,
      transactions: transactionData.length,
      goals: 1,
      recurringExpenses: 4,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed", details: String(error) }, { status: 500 });
  }
}
