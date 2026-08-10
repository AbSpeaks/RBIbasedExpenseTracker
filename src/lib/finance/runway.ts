import { DashboardContext } from "./types";
import { calculateCurrentCash, getMonthDays } from "./cashFlow";

export interface RunwayResult {
  runwayDays: number;
  monthEndRequirement: number;
  availableCash: number;
  dailyBurnRate: number;
  averageDailySpend: number;
  status: "SAFE" | "WARNING" | "CRITICAL";
}

export function calculateRunway(ctx: DashboardContext): RunwayResult {
  const currentCash = calculateCurrentCash(ctx);
  const { elapsed, remaining } = getMonthDays(ctx.today);

  // Calculate daily burn rate from current month spending
  const monthlyExpenses = ctx.monthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  
  const averageDailySpend = elapsed > 0 ? monthlyExpenses / elapsed : 0;
  const dailyBurnRate = averageDailySpend > 0 ? averageDailySpend : ctx.user.monthlyIncome / 30;

  // Calculate month-end requirement (upcoming recurring expenses this month)
  const monthEndRequirement = ctx.recurringExpenses
    .filter((r) => {
      const due = new Date(r.nextDueDate);
      const daysUntilDue = Math.ceil(
        (due.getTime() - ctx.today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilDue >= 0 && daysUntilDue <= remaining;
    })
    .reduce((s, r) => s + r.amount, 0);

  const availableCash = Math.max(0, currentCash - monthEndRequirement);
  const runwayDays = dailyBurnRate > 0
    ? Math.floor(availableCash / dailyBurnRate)
    : 999;

  let status: "SAFE" | "WARNING" | "CRITICAL" = "SAFE";
  if (runwayDays < 5) status = "CRITICAL";
  else if (runwayDays < remaining * 0.5) status = "WARNING";

  return {
    runwayDays: Math.min(runwayDays, 999),
    monthEndRequirement,
    availableCash,
    dailyBurnRate,
    averageDailySpend,
    status,
  };
}
