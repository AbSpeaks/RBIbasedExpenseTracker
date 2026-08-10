import { DashboardContext } from "./types";

export function getMonthDays(date: Date): { total: number; elapsed: number; remaining: number } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const total = new Date(year, month + 1, 0).getDate();
  const elapsed = date.getDate();
  const remaining = total - elapsed;
  return { total, elapsed, remaining };
}

export function calculateCurrentCash(ctx: DashboardContext): number {
  const income = ctx.monthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = ctx.monthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  const reserveTransfers = ctx.monthTransactions
    .filter((t) => t.type === "RESERVE_TRANSFER")
    .reduce((s, t) => s + t.amount, 0);

  const effectiveIncome = income > 0 ? income : ctx.user.monthlyIncome;
  return effectiveIncome - expenses - reserveTransfers;
}

export function calculateOperationalCash(ctx: DashboardContext): number {
  const cash = calculateCurrentCash(ctx);
  const { remaining } = getMonthDays(ctx.today);
  
  // Protect upcoming recurring obligations within remaining days
  const upcomingObligations = ctx.recurringExpenses
    .filter((r) => {
      const due = new Date(r.nextDueDate);
      const daysUntilDue = Math.ceil((due.getTime() - ctx.today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= remaining;
    })
    .reduce((s, r) => s + r.amount, 0);

  return Math.max(0, cash - upcomingObligations);
}

export function calculateMonthlyExpenses(ctx: DashboardContext): number {
  return ctx.monthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
}

export function calculateMonthlyIncome(ctx: DashboardContext): number {
  const incomeTransactions = ctx.monthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  return incomeTransactions > 0 ? incomeTransactions : ctx.user.monthlyIncome;
}

export function calculateMonthlySavings(ctx: DashboardContext): number {
  const income = calculateMonthlyIncome(ctx);
  const expenses = calculateMonthlyExpenses(ctx);
  return income - expenses;
}

export function calculateTotalBudget(ctx: DashboardContext): number {
  return ctx.ministries.reduce((s, m) => s + m.monthlyBudget, 0);
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
