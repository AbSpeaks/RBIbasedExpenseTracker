import { DashboardContext } from "./types";
import { calculateMonthlySavings, calculateMonthlyIncome, getMonthDays } from "./cashFlow";
import { calculateBudgetUtilization } from "./budgetAnalysis";
import { calculateGoalProgress } from "./goalProjection";

export type HealthLevel = "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL";

export interface FiscalHealthScore {
  total: number;
  level: HealthLevel;
  components: {
    savingsRate: number;
    budgetControl: number;
    emergencyReserve: number;
    debtBurden: number;
    discretionarySpending: number;
    goalProgress: number;
  };
}

export function calculateFiscalHealth(ctx: DashboardContext): FiscalHealthScore {
  const income = calculateMonthlyIncome(ctx);
  const savings = calculateMonthlySavings(ctx);
  const { elapsed, total: daysTotal } = getMonthDays(ctx.today);
  const monthProgress = elapsed / daysTotal;

  // 1. Savings Rate (max 25 points)
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const minSavingsRate = ctx.policy.minimumSavingsRate;
  let savingsScore = Math.min(25, (savingsRate / (minSavingsRate * 2)) * 25);
  if (savingsRate >= minSavingsRate) savingsScore = Math.max(savingsScore, 15);
  savingsScore = Math.max(0, savingsScore);

  // 2. Budget Control (max 25 points) - how well is spending tracked vs budget
  const budgetUtil = calculateBudgetUtilization(ctx);
  const expectedUtil = monthProgress * 100;
  const overspendRatio = expectedUtil > 0 ? budgetUtil / expectedUtil : 1;
  let budgetScore = 25;
  if (overspendRatio > 1.5) budgetScore = 0;
  else if (overspendRatio > 1.2) budgetScore = 5;
  else if (overspendRatio > 1.1) budgetScore = 12;
  else if (overspendRatio > 1.0) budgetScore = 18;

  // 3. Emergency Reserve (max 20 points)
  const reserve = ctx.user.reserveBalance;
  const minReserve = ctx.policy.minimumEmergencyReserve;
  const reserveScore = Math.min(20, (reserve / (minReserve * 2)) * 20);

  // 4. Debt Burden (max 10 points)
  const emiMinistry = ctx.ministries.find((m) => m.name.toLowerCase().includes("debt") || m.name.toLowerCase().includes("emi"));
  const emiAmount = emiMinistry?.monthlyBudget ?? 2500;
  const debtRatio = income > 0 ? (emiAmount / income) * 100 : 0;
  let debtScore = 10;
  if (debtRatio > 40) debtScore = 0;
  else if (debtRatio > 30) debtScore = 3;
  else if (debtRatio > 20) debtScore = 6;
  else if (debtRatio > 10) debtScore = 8;

  // 5. Discretionary Spending (max 10 points)
  const discretionaryMinistries = ctx.ministries.filter((m) =>
    ["entertainment", "shopping", "miscellaneous"].some((k) => m.name.toLowerCase().includes(k))
  );
  const discretionarySpent = discretionaryMinistries.reduce((s, m) => s + m.spent, 0);
  const discretionaryBudget = discretionaryMinistries.reduce((s, m) => s + m.monthlyBudget, 0);
  const discretionaryUtil = discretionaryBudget > 0 ? (discretionarySpent / discretionaryBudget) * 100 : 0;
  let discretionaryScore = 10;
  if (discretionaryUtil > 100) discretionaryScore = 0;
  else if (discretionaryUtil > 80) discretionaryScore = 3;
  else if (discretionaryUtil > 60) discretionaryScore = 7;

  // 6. Goal Progress (max 10 points)
  const primaryGoal = ctx.goals.find((g) => g.status === "active");
  let goalScore = 5;
  if (primaryGoal) {
    const progress = calculateGoalProgress(primaryGoal);
    const { onTrack } = progress;
    goalScore = onTrack ? 10 : 3;
  }

  const total = Math.round(
    savingsScore + budgetScore + reserveScore + debtScore + discretionaryScore + goalScore
  );
  const bounded = Math.min(100, Math.max(0, total));

  let level: HealthLevel = "CRITICAL";
  if (bounded >= 80) level = "EXCELLENT";
  else if (bounded >= 60) level = "GOOD";
  else if (bounded >= 40) level = "WARNING";

  return {
    total: bounded,
    level,
    components: {
      savingsRate: Math.round(savingsScore),
      budgetControl: Math.round(budgetScore),
      emergencyReserve: Math.round(reserveScore),
      debtBurden: Math.round(debtScore),
      discretionarySpending: Math.round(discretionaryScore),
      goalProgress: Math.round(goalScore),
    },
  };
}

export function getTreasuryStatus(health: FiscalHealthScore): {
  status: "FISCALLY_STABLE" | "FISCAL_PRESSURE" | "TREASURY_RISK";
  label: string;
  color: string;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (health.components.budgetControl < 10) reasons.push("Spending velocity exceeds monthly budget pace");
  if (health.components.savingsRate < 10) reasons.push("Savings rate is critically low");
  if (health.components.emergencyReserve < 8) reasons.push("Emergency reserve is insufficient");
  if (health.components.goalProgress < 5) reasons.push("Primary financial goal is at risk");

  if (health.total >= 70) {
    return { status: "FISCALLY_STABLE", label: "FISCALLY STABLE", color: "green", reasons };
  } else if (health.total >= 45) {
    return { status: "FISCAL_PRESSURE", label: "FISCAL PRESSURE", color: "yellow", reasons };
  } else {
    return { status: "TREASURY_RISK", label: "TREASURY RISK", color: "red", reasons };
  }
}
