import { DashboardContext } from "./types";
import { calculateCurrentCash, getMonthDays } from "./cashFlow";

export interface SafeToSpend {
  safeAmount: number;
  todaySpent: number;
  safeLimit: number;
  remaining: number;
  status: "SAFE" | "WARNING" | "EXCEEDED";
  excessAmount: number;
  upcomingObligations: number;
  operationalCash: number;
  protectedFunds: number;
}

export function calculateSafeDailySpend(ctx: DashboardContext): SafeToSpend {
  const currentCash = calculateCurrentCash(ctx);
  const { remaining: daysRemaining } = getMonthDays(ctx.today);
  const today = ctx.today;

  // Get upcoming obligations (next 30 days)
  const upcomingObligations = ctx.recurringExpenses
    .filter((r) => {
      const due = new Date(r.nextDueDate);
      const daysUntilDue = Math.ceil(
        (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilDue >= 0 && daysUntilDue <= 30;
    })
    .reduce((s, r) => s + r.amount, 0);

  // Protected funds = reserve contribution + upcoming obligations
  const protectedFunds =
    ctx.policy.monthlyReserveContribution + upcomingObligations;

  // Operational cash available for discretionary spending
  const operationalCash = Math.max(0, currentCash - protectedFunds);

  // Safe daily spend = operational cash / remaining days (min 1 day)
  const effectiveDays = Math.max(1, daysRemaining);
  const safeAmount = Math.max(0, Math.floor(operationalCash / effectiveDays));

  // Today's spending
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const todaySpent = ctx.monthTransactions
    .filter((t) => {
      const d = new Date(t.date);
      return t.type === "EXPENSE" && d >= todayStart && d <= todayEnd;
    })
    .reduce((s, t) => s + t.amount, 0);

  const safeLimit = safeAmount;
  const remaining = Math.max(0, safeLimit - todaySpent);
  const excessAmount = Math.max(0, todaySpent - safeLimit);

  let status: "SAFE" | "WARNING" | "EXCEEDED" = "SAFE";
  if (todaySpent > safeLimit * 1.2) status = "EXCEEDED";
  else if (todaySpent > safeLimit * 0.8) status = "WARNING";

  return {
    safeAmount,
    todaySpent,
    safeLimit,
    remaining,
    status,
    excessAmount,
    upcomingObligations,
    operationalCash,
    protectedFunds,
  };
}
