// Shared types for the financial engine
export interface MinistryData {
  _id: string;
  name: string;
  icon: string;
  monthlyBudget: number;
  priority: string;
  color: string;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface TransactionData {
  _id: string;
  amount: number;
  type: string;
  ministryId: string | null;
  description: string;
  notes: string;
  date: string;
}

export interface RecurringData {
  _id: string;
  name: string;
  amount: number;
  ministryId: string;
  frequency: string;
  nextDueDate: string;
}

export interface GoalData {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  status: string;
}

export interface PolicyData {
  reserveTarget: number;
  minimumSavingsRate: number;
  minimumEmergencyReserve: number;
  foodLimit: number;
  entertainmentLimit: number;
  startupLimit: number;
  monthlyReserveContribution: number;
}

export interface DashboardContext {
  user: {
    monthlyIncome: number;
    reserveBalance: number;
    lowIncomeMode: boolean;
    lowIncomeAmount: number;
  };
  ministries: MinistryData[];
  monthTransactions: TransactionData[];
  allTransactions: TransactionData[];
  recurringExpenses: RecurringData[];
  goals: GoalData[];
  policy: PolicyData;
  currentMonth: string;
  today: Date;
}
