import { GoalData } from "./types";

export interface GoalProgress {
  goal: GoalData;
  progressPercent: number;
  remaining: number;
  monthsRemaining: number;
  requiredMonthly: number;
  projectedDate: Date | null;
  onTrack: boolean;
  status: "AHEAD" | "ON_TRACK" | "BEHIND" | "AT_RISK";
}

export function calculateGoalProgress(goal: GoalData): GoalProgress {
  const now = new Date();
  const targetDate = new Date(goal.targetDate);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const progressPercent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  const msRemaining = targetDate.getTime() - now.getTime();
  const monthsRemaining = Math.max(0, msRemaining / (1000 * 60 * 60 * 24 * 30.44));
  const requiredMonthly = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

  // Projected completion date based on actual monthly contribution
  let projectedDate: Date | null = null;
  let status: "AHEAD" | "ON_TRACK" | "BEHIND" | "AT_RISK" = "BEHIND";

  if (goal.monthlyContribution > 0 && remaining > 0) {
    const monthsNeeded = remaining / goal.monthlyContribution;
    projectedDate = new Date(now.getTime() + monthsNeeded * 30.44 * 24 * 60 * 60 * 1000);
    
    const bufferMonths = monthsNeeded - monthsRemaining;
    if (bufferMonths <= -2) status = "AHEAD";
    else if (bufferMonths <= 0) status = "ON_TRACK";
    else if (bufferMonths <= 3) status = "BEHIND";
    else status = "AT_RISK";
  } else if (remaining === 0) {
    status = "AHEAD";
    projectedDate = now;
  } else {
    status = "AT_RISK";
  }

  return {
    goal,
    progressPercent: Math.min(100, progressPercent),
    remaining,
    monthsRemaining,
    requiredMonthly,
    projectedDate,
    onTrack: status === "ON_TRACK" || status === "AHEAD",
    status,
  };
}
