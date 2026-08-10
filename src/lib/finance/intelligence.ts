import { DashboardContext } from "./types";
import { calculateCurrentCash, calculateMonthlyIncome, calculateMonthlySavings, getMonthDays } from "./cashFlow";
import { analyzeMinistries } from "./budgetAnalysis";
import { calculateGoalProgress } from "./goalProjection";
import { calculateFiscalHealth } from "./fiscalHealth";
import { calculateRunway } from "./runway";

export type AlertSeverity = "RED" | "YELLOW" | "GREEN" | "BLUE";

export interface FinancialAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  ministry?: string;
  actionable?: string;
}

export interface Recommendation {
  id: string;
  priority: number;
  text: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
}

export function generateFinancialAlerts(ctx: DashboardContext): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const { elapsed, total } = getMonthDays(ctx.today);
  const monthProgress = (elapsed / total) * 100;
  const ministryAnalyses = analyzeMinistries(ctx);
  const income = calculateMonthlyIncome(ctx);
  const savings = calculateMonthlySavings(ctx);
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const runway = calculateRunway(ctx);

  // Critical cash runway alert
  if (runway.runwayDays < 7) {
    alerts.push({
      id: "runway-critical",
      severity: "RED",
      title: "TREASURY ALERT",
      message: `Cash runway is critically low at ${runway.runwayDays} days. Immediate spending reduction required.`,
      actionable: "Suspend all discretionary spending immediately.",
    });
  } else if (runway.runwayDays < 14) {
    alerts.push({
      id: "runway-warning",
      severity: "YELLOW",
      title: "CASH RUNWAY WARNING",
      message: `Only ${runway.runwayDays} days of cash runway remaining at current burn rate.`,
      actionable: "Reduce discretionary spending by 40%.",
    });
  }

  // Savings rate alerts
  if (savingsRate < 10) {
    alerts.push({
      id: "savings-critical",
      severity: "RED",
      title: "SAVINGS RATE CRITICAL",
      message: `Current savings rate is ${savingsRate.toFixed(1)}% — far below the ${ctx.policy.minimumSavingsRate}% target.`,
      actionable: "Review and cut Food, Entertainment, and Shopping ministry budgets.",
    });
  } else if (savingsRate < ctx.policy.minimumSavingsRate) {
    alerts.push({
      id: "savings-low",
      severity: "YELLOW",
      title: "SAVINGS RATE BELOW TARGET",
      message: `Savings rate is ${savingsRate.toFixed(1)}%, below the ${ctx.policy.minimumSavingsRate}% minimum policy.`,
      actionable: "Reduce discretionary spending to bring savings back on track.",
    });
  } else {
    alerts.push({
      id: "savings-good",
      severity: "GREEN",
      title: "SAVINGS ON TRACK",
      message: `Savings rate is ${savingsRate.toFixed(1)}% — meeting the ${ctx.policy.minimumSavingsRate}% target.`,
    });
  }

  // Ministry overspend alerts
  ministryAnalyses.forEach((m) => {
    if (m.status === "OVER_BUDGET") {
      alerts.push({
        id: `ministry-over-${m.ministry._id}`,
        severity: "RED",
        title: `${m.ministry.icon} ${m.ministry.name.toUpperCase()} OVER BUDGET`,
        message: `${m.ministry.name} has exceeded its monthly budget of ₹${m.budget.toLocaleString("en-IN")}. Spent: ₹${m.spent.toLocaleString("en-IN")}.`,
        ministry: m.ministry.name,
        actionable: `Stop all ${m.ministry.name} spending for the rest of the month.`,
      });
    } else if (m.status === "WATCH" && m.willOverrun) {
      alerts.push({
        id: `ministry-watch-${m.ministry._id}`,
        severity: "YELLOW",
        title: `${m.ministry.icon} ${m.ministry.name.toUpperCase()} ALERT`,
        message: `${m.ministry.name} spending has reached ${m.percentUsed.toFixed(0)}% while only ${monthProgress.toFixed(0)}% of the month has elapsed. Projected month-end: ₹${m.projectedMonthEnd.toLocaleString("en-IN")}.`,
        ministry: m.ministry.name,
        actionable: `Reduce ${m.ministry.name} spending by ₹${Math.ceil(m.projectedMonthEnd - m.budget).toLocaleString("en-IN")} to stay within budget.`,
      });
    }
  });

  // Reserve Bank alerts
  const goals = ctx.goals.filter((g) => g.status === "active");
  goals.forEach((goal) => {
    const progress = calculateGoalProgress(goal);
    if (progress.status === "AT_RISK") {
      alerts.push({
        id: `goal-risk-${goal._id}`,
        severity: "RED",
        title: `🏦 RESERVE BANK: ${goal.name.toUpperCase()} AT RISK`,
        message: `Current trajectory will NOT reach ₹${goal.targetAmount.toLocaleString("en-IN")} by ${new Date(goal.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Required monthly: ₹${Math.ceil(progress.requiredMonthly).toLocaleString("en-IN")}.`,
        actionable: `Increase monthly contribution to ₹${Math.ceil(progress.requiredMonthly).toLocaleString("en-IN")} to stay on target.`,
      });
    } else if (progress.status === "BEHIND") {
      alerts.push({
        id: `goal-behind-${goal._id}`,
        severity: "YELLOW",
        title: `🏦 RESERVE BANK: ${goal.name.toUpperCase()} BEHIND`,
        message: `Behind target for ${goal.name}. Required monthly: ₹${Math.ceil(progress.requiredMonthly).toLocaleString("en-IN")}, currently contributing: ₹${goal.monthlyContribution.toLocaleString("en-IN")}.`,
        actionable: `Increase monthly contribution by ₹${Math.ceil(progress.requiredMonthly - goal.monthlyContribution).toLocaleString("en-IN")}.`,
      });
    } else if (progress.onTrack) {
      alerts.push({
        id: `goal-track-${goal._id}`,
        severity: "GREEN",
        title: `🏦 RESERVE BANK: ${goal.name.toUpperCase()} ON TRACK`,
        message: `Reserve fund goal is progressing well. Current: ₹${goal.currentAmount.toLocaleString("en-IN")} / ₹${goal.targetAmount.toLocaleString("en-IN")}.`,
      });
    }
  });

  // Startup spending alert
  const startupMinistry = ministryAnalyses.find((m) =>
    m.ministry.name.toLowerCase().includes("startup")
  );
  if (startupMinistry && startupMinistry.spent > ctx.policy.startupLimit) {
    alerts.push({
      id: "startup-limit",
      severity: "YELLOW",
      title: "🚀 STARTUP AFFAIRS ALERT",
      message: `Startup spending (₹${startupMinistry.spent.toLocaleString("en-IN")}) exceeds the policy limit of ₹${ctx.policy.startupLimit.toLocaleString("en-IN")}. This may impact Reserve Bank savings.`,
      actionable: "Review startup expenses and defer non-critical items.",
    });
  }

  // Reserve policy alert
  const reserveTarget = ctx.policy.minimumEmergencyReserve;
  if (ctx.user.reserveBalance < reserveTarget) {
    alerts.push({
      id: "reserve-low",
      severity: "YELLOW",
      title: "⚠️ EMERGENCY RESERVE LOW",
      message: `Reserve balance (₹${ctx.user.reserveBalance.toLocaleString("en-IN")}) is below the minimum policy of ₹${reserveTarget.toLocaleString("en-IN")}.`,
      actionable: "Prioritize reserve contributions before any discretionary spending.",
    });
  }

  return alerts;
}

export function generateRecommendations(ctx: DashboardContext): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const ministryAnalyses = analyzeMinistries(ctx);
  const income = calculateMonthlyIncome(ctx);
  const savings = calculateMonthlySavings(ctx);
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const health = calculateFiscalHealth(ctx);
  const { elapsed, total } = getMonthDays(ctx.today);
  const monthProgress = (elapsed / total) * 100;

  // Top overspending ministry
  const worstMinistry = ministryAnalyses
    .filter((m) => m.willOverrun && m.budget > 0)
    .sort((a, b) => b.percentUsed - a.percentUsed)[0];

  if (worstMinistry) {
    const reduction = Math.ceil(worstMinistry.projectedMonthEnd - worstMinistry.budget);
    recommendations.push({
      id: "reduce-top-ministry",
      priority: 1,
      text: `Reduce ${worstMinistry.ministry.name} spending by ₹${reduction.toLocaleString("en-IN")} this month to avoid going over budget (currently projected at ₹${worstMinistry.projectedMonthEnd.toFixed(0)}).`,
      impact: "HIGH",
    });
  }

  // Savings rate recommendation
  if (savingsRate < ctx.policy.minimumSavingsRate) {
    const gap = ctx.policy.minimumSavingsRate - savingsRate;
    const requiredCut = Math.ceil((gap / 100) * income);
    recommendations.push({
      id: "improve-savings",
      priority: 2,
      text: `Your savings rate is ${savingsRate.toFixed(1)}%. Cut ₹${requiredCut.toLocaleString("en-IN")} from discretionary spending to reach the ${ctx.policy.minimumSavingsRate}% target.`,
      impact: "HIGH",
    });
  }

  // Goal-based recommendation
  const primaryGoal = ctx.goals.find((g) => g.status === "active");
  if (primaryGoal) {
    const progress = calculateGoalProgress(primaryGoal);
    if (!progress.onTrack) {
      const gap = Math.ceil(progress.requiredMonthly - primaryGoal.monthlyContribution);
      if (gap > 0) {
        recommendations.push({
          id: "goal-contribution",
          priority: 1,
          text: `You need ₹${Math.ceil(progress.requiredMonthly).toLocaleString("en-IN")}/month for ${primaryGoal.name} but are contributing ₹${primaryGoal.monthlyContribution.toLocaleString("en-IN")}. Increase by ₹${gap.toLocaleString("en-IN")}.`,
          impact: "HIGH",
        });
      }
    }
  }

  // Mid-month check
  if (monthProgress > 50 && health.components.budgetControl < 15) {
    recommendations.push({
      id: "midmonth-control",
      priority: 3,
      text: `You're past mid-month. Tighten spending in Food and Transport — your two highest-velocity categories — for the remaining ${total - elapsed} days.`,
      impact: "MEDIUM",
    });
  }

  // Generic positive if doing well
  if (recommendations.length === 0) {
    recommendations.push({
      id: "keep-going",
      priority: 1,
      text: `Financial discipline is strong this month. Consider redirecting any surplus above ₹${(income * 0.3).toFixed(0)} to the Reserve Bank goal.`,
      impact: "MEDIUM",
    });
  }

  return recommendations.slice(0, 3);
}
