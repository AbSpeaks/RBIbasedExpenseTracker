import { DashboardContext, MinistryData } from "./types";
import { getMonthDays } from "./cashFlow";

export type SpendingVelocity = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export type MinistryStatus = "SAFE" | "WATCH" | "OVER_BUDGET";

export interface MinistryAnalysis {
  ministry: MinistryData;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  expectedPercent: number;
  velocity: SpendingVelocity;
  status: MinistryStatus;
  projectedMonthEnd: number;
  willOverrun: boolean;
  dailyAverage: number;
}

export function calculateSpendingVelocity(
  percentUsed: number,
  monthProgress: number
): SpendingVelocity {
  if (percentUsed >= 100) return "CRITICAL";
  const ratio = monthProgress > 0 ? percentUsed / monthProgress : 0;
  if (ratio >= 1.3) return "CRITICAL";
  if (ratio >= 1.1) return "HIGH";
  if (ratio >= 0.9) return "NORMAL";
  return "LOW";
}

export function getMinistryStatus(
  percentUsed: number,
  velocity: SpendingVelocity
): MinistryStatus {
  if (percentUsed >= 100) return "OVER_BUDGET";
  if (percentUsed >= 80 || velocity === "CRITICAL" || velocity === "HIGH") return "WATCH";
  return "SAFE";
}

export function analyzeMinistries(ctx: DashboardContext): MinistryAnalysis[] {
  const { total, elapsed } = getMonthDays(ctx.today);
  const monthProgress = (elapsed / total) * 100;

  return ctx.ministries.map((ministry) => {
    const budget = ministry.monthlyBudget;
    const spent = ministry.spent;
    const remaining = Math.max(0, budget - spent);
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
    const expectedPercent = monthProgress;
    const velocity = calculateSpendingVelocity(percentUsed, expectedPercent);
    const status = getMinistryStatus(percentUsed, velocity);
    const dailyAverage = elapsed > 0 ? spent / elapsed : 0;
    const projectedMonthEnd = dailyAverage * total;
    const willOverrun = projectedMonthEnd > budget;

    return {
      ministry,
      budget,
      spent,
      remaining,
      percentUsed,
      expectedPercent,
      velocity,
      status,
      projectedMonthEnd,
      willOverrun,
      dailyAverage,
    };
  });
}

export function calculateBudgetUtilization(ctx: DashboardContext): number {
  const totalBudget = ctx.ministries.reduce((s, m) => s + m.monthlyBudget, 0);
  const totalSpent = ctx.ministries.reduce((s, m) => s + m.spent, 0);
  return totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
}
