"use client";
import useSWR from "swr";
import { format } from "date-fns";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  RefreshCw, Wallet, Shield, DollarSign, Target,
  BarChart2, Activity, ArrowUpRight, ArrowDownRight,
  Zap, Clock, CreditCard
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });

const fmt = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const pct = (n: number) => n.toFixed(1) + "%";

const COLORS = ["#1E3A8A", "#10B981", "#D4AF37", "#EF4444", "#D4AF37", "#2563EB", "#94A3B8", "#10B981", "#D4AF37", "#EF4444"];

function KPICard({
  label, value, sub, trend, trendDir, status, icon: Icon, color,
}: {
  label: string; value: string; sub?: string; trend?: string;
  trendDir?: "up" | "down" | "neutral"; status?: string; icon?: React.ElementType; color?: string;
}) {
  const trendColor = trendDir === "up" ? "#10B981" : trendDir === "down" ? "#EF4444" : "#94A3B8";
  return (
    <div className="card flex flex-col gap-2 hover:border-[#2563EB]/40 transition-all">
      <div className="flex items-center justify-between mb-1">
        <span className="stat-label">{label}</span>
        {Icon && <Icon size={14} color={color ?? "#94A3B8"} />}
      </div>
      <div className="stat-value" style={{ color: color ?? "#F8FAFC" }}>{value}</div>
      {trend && (
        <div className="flex items-center gap-1 text-xs" style={{ color: trendColor }}>
          {trendDir === "up" ? <ArrowUpRight size={12} /> : trendDir === "down" ? <ArrowDownRight size={12} /> : null}
          {trend}
        </div>
      )}
      {sub && <div className="text-[11px] text-[#64748B]">{sub}</div>}
      {status && (
        <div className={`badge-${status === "SAFE" || status === "GOOD" ? "safe" : status === "WATCH" || status === "WARNING" ? "watch" : "risk"} self-start mt-1`}>
          {status}
        </div>
      )}
    </div>
  );
}

function HealthBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pctVal = (value / max) * 100;
  const color = pctVal > 70 ? "#10B981" : pctVal > 40 ? "#D4AF37" : "#EF4444";
  return (
    <div className="flex items-center gap-3">
      <div className="text-[11px] text-[#94A3B8] w-44 truncate">{label}</div>
      <div className="flex-1 progress-bar">
        <div className="progress-fill" style={{ width: `${pctVal}%`, background: color }} />
      </div>
      <div className="text-[11px] font-mono text-[#F8FAFC] w-8 text-right">{value}</div>
    </div>
  );
}

function SafeToSpendWidget({ data }: { data: { safeAmount: number; todaySpent: number; safeLimit: number; remaining: number; status: string; excessAmount: number; operationalCash: number; protectedFunds: number } }) {
  const pctSpent = data.safeLimit > 0 ? Math.min(100, (data.todaySpent / data.safeLimit) * 100) : 0;
  const statusColor = data.status === "SAFE" ? "#10B981" : data.status === "WARNING" ? "#D4AF37" : "#EF4444";

  return (
    <div className="card" style={{ borderColor: `${statusColor}30` }}>
      <div className="flex items-center justify-between mb-4">
        <span className="stat-label">SAFE TO SPEND TODAY</span>
        <Zap size={16} color={statusColor} />
      </div>

      {/* Main number */}
      <div className="text-3xl md:text-4xl font-mono font-bold mb-1" style={{ color: statusColor, letterSpacing: "-0.03em" }}>
        {fmt(data.safeAmount)}
      </div>
      <div className="text-[11px] text-[#64748B] mb-4">per day · operational allowance</div>

      {/* Progress bar */}
      <div className="progress-bar h-2 mb-4">
        <div
          className="progress-fill h-2"
          style={{
            width: `${pctSpent}%`,
            background: pctSpent >= 100 ? "#EF4444" : pctSpent >= 80 ? "#D4AF37" : "#10B981"
          }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="text-[11px] text-[#64748B] mb-1">Today Spent</div>
          <div className="text-base font-bold text-[#EF4444]">{fmt(data.todaySpent)}</div>
        </div>
        <div>
          <div className="text-[11px] text-[#64748B] mb-1">Safe Limit</div>
          <div className="text-base font-bold text-[#F8FAFC]">{fmt(data.safeLimit)}</div>
        </div>
        <div>
          <div className="text-[11px] text-[#64748B] mb-1">Remaining</div>
          <div className="text-base font-bold" style={{ color: statusColor }}>{fmt(data.remaining)}</div>
        </div>
      </div>

      {data.status === "EXCEEDED" && (
        <div className="mt-3 px-3 py-2 rounded-lg text-xs text-[#EF4444]" style={{ background: "rgba(255,107,107,0.1)" }}>
          ⚠️ {fmt(data.excessAmount)} above safe limit today
        </div>
      )}
    </div>
  );
}

function FiscalHealthCard({ health }: { health: { total: number; level: string; components: Record<string, number> } }) {
  const levelColor = health.level === "EXCELLENT" ? "#10B981" : health.level === "GOOD" ? "#1E3A8A" : health.level === "WARNING" ? "#D4AF37" : "#EF4444";
  const componentLabels: Record<string, string> = {
    savingsRate: "Savings Rate",
    budgetControl: "Budget Control",
    emergencyReserve: "Emergency Reserve",
    debtBurden: "Debt Burden",
    discretionarySpending: "Discretionary",
    goalProgress: "Goal Progress",
  };
  const maxes: Record<string, number> = {
    savingsRate: 25, budgetControl: 25, emergencyReserve: 20,
    debtBurden: 10, discretionarySpending: 10, goalProgress: 10,
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <span className="stat-label">FISCAL HEALTH SCORE</span>
        <Activity size={14} color={levelColor} />
      </div>

      <div className="flex items-end gap-3 mb-4">
        <div className="text-4xl md:text-5xl font-mono font-bold" style={{ color: levelColor, letterSpacing: "-0.03em" }}>
          {health.total}
        </div>
        <div className="mb-2">
          <div className="text-[11px] text-[#64748B]">/ 100</div>
          <div className="badge-safe self-start" style={{
            background: `${levelColor}20`, color: levelColor, borderColor: `${levelColor}40`
          }}>
            {health.level}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(health.components).map(([key, value]) => (
          <HealthBar key={key} label={componentLabels[key]} value={value as number} max={maxes[key]} />
        ))}
      </div>
    </div>
  );
}

function TreasuryStatus({ status }: { status: { status: string; label: string; color: string; reasons: string[] } }) {
  const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    green: { bg: "rgba(61,220,151,0.05)", border: "rgba(61,220,151,0.3)", text: "#10B981", badge: "badge-safe" },
    yellow: { bg: "rgba(245,196,81,0.05)", border: "rgba(245,196,81,0.3)", text: "#D4AF37", badge: "badge-watch" },
    red: { bg: "rgba(255,107,107,0.05)", border: "rgba(255,107,107,0.3)", text: "#EF4444", badge: "badge-risk" },
  };
  const c = colors[status.color];
  const emoji = status.color === "green" ? "🟢" : status.color === "yellow" ? "🟡" : "🔴";

  return (
    <div className="card" style={{ background: c.bg, borderColor: c.border }}>
      <div className="stat-label mb-3">TREASURY STATUS</div>
      <div className="text-2xl font-mono font-bold mb-3" style={{ color: c.text }}>
        {emoji} {status.label}
      </div>
      {status.reasons.length > 0 && (
        <div className="space-y-1">
          {status.reasons.map((r, i) => (
            <div key={i} className="text-xs text-[#94A3B8] flex items-start gap-2">
              <span className="text-[#D4AF37] mt-0.5">›</span>
              {r}
            </div>
          ))}
        </div>
      )}
      {status.reasons.length === 0 && (
        <div className="text-xs text-[#94A3B8]">All treasury metrics within acceptable parameters.</div>
      )}
    </div>
  );
}

function RunwayCard({ runway }: { runway: { runwayDays: number; monthEndRequirement: number; availableCash: number; status: string; averageDailySpend: number } }) {
  const color = runway.status === "SAFE" ? "#10B981" : runway.status === "WARNING" ? "#D4AF37" : "#EF4444";
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">CASH RUNWAY</span>
        <Clock size={14} color={color} />
      </div>
      <div className="text-3xl font-mono font-bold mb-1" style={{ color }}>
        {runway.runwayDays === 999 ? "∞" : runway.runwayDays} days
      </div>
      <div className="text-[11px] text-[#64748B] mb-4">at current burn rate</div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[#64748B]">Daily avg. burn</span>
          <span className="text-[#94A3B8] font-mono">{fmt(runway.averageDailySpend)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#64748B]">Month-end obligation</span>
          <span className="text-[#EF4444] font-mono">{fmt(runway.monthEndRequirement)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#64748B]">Available cash</span>
          <span className="font-mono" style={{ color }}>{fmt(runway.availableCash)}</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard", fetcher, { refreshInterval: 30000 });

  const today = new Date();
  const dateStr = format(today, "EEEE, d MMMM yyyy");
  const monthStr = format(today, "MMMM yyyy");

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <AlertTriangle size={40} color="#EF4444" />
        <div className="text-[#EF4444] font-semibold">Failed to load dashboard</div>
        <p className="text-[#94A3B8] text-sm text-center max-w-sm">
          Could not connect to the database. Please check your MongoDB connection string in .env.local and ensure the database is accessible.
        </p>
        <button onClick={() => mutate()} className="btn-primary flex items-center gap-2">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 skeleton rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const {
    currentCash, reserveBalance, monthlyIncome, monthlyExpenses, monthlySavings,
    totalBudget, budgetUtilization, savingsRate, fiscalHealth, treasuryStatus,
    safeToSpend, runway, ministryAnalyses, goalProgressList, alerts,
    recommendations, recentTransactions, upcomingObligations, user, netWorth
  } = data;

  const hasTransactions = recentTransactions?.length > 0;

  // Spending by ministry for donut chart
  const pieData = ministryAnalyses
    ?.filter((m: { spent: number }) => m.spent > 0)
    .map((m: { ministry: { name: string; icon: string }; spent: number }) => ({
      name: m.ministry.name,
      value: m.spent,
      icon: m.ministry.icon,
    }));

  // Budget vs actual bar chart data
  const barData = ministryAnalyses
    ?.filter((m: { ministry: { name: string }; budget: number }) => m.budget > 0)
    .map((m: { ministry: { name: string; icon: string }; budget: number; spent: number }) => ({
      name: m.ministry.icon + " " + m.ministry.name.split(" ")[0],
      Budget: m.budget,
      Actual: m.spent,
    }));

  const primaryGoal = goalProgressList?.[0];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🏛️</span>
            <h1 className="font-serif text-2xl font-bold text-[#F8FAFC] tracking-wide">RESERVE BANK OF ABIN</h1>
            <span className="badge-rbi">Fiscal Control Center</span>
          </div>
          <div className="text-xs text-[#64748B]">{dateStr} · {monthStr}</div>
        </div>
        <div className="flex items-center gap-3">
          {user?.lowIncomeMode && (
            <div className="badge-watch">⚠️ LOW-INCOME MODE</div>
          )}
          <button onClick={() => mutate()} className="btn-ghost flex items-center gap-1 text-xs">
            <RefreshCw size={12} /> Refresh
          </button>
          <Link href="/transactions" className="btn-primary flex items-center gap-2 text-sm">
            + Add Transaction
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="CURRENT CASH" value={fmt(currentCash)}
          trend={currentCash >= 0 ? "Available" : "Deficit"}
          trendDir={currentCash >= 0 ? "up" : "down"}
          status={currentCash > 5000 ? "SAFE" : currentCash > 0 ? "WATCH" : "RISK"}
          icon={Wallet} color="#1E3A8A"
        />
        <KPICard
          label="RESERVE FUND" value={fmt(reserveBalance)}
          sub={`${pct((reserveBalance / 80000) * 100)} of ₹80K goal`}
          status={reserveBalance >= 12000 ? "SAFE" : "WATCH"}
          icon={Shield} color="#D4AF37"
        />
        <KPICard
          label="MONTHLY INCOME" value={fmt(monthlyIncome)}
          sub={user?.lowIncomeMode ? "Low-income mode" : "Normal mode"}
          icon={DollarSign} color="#10B981"
        />
        <KPICard
          label="TOTAL BUDGET" value={fmt(totalBudget)}
          trend={`${pct(budgetUtilization)} utilized`}
          trendDir={budgetUtilization > 90 ? "down" : "neutral"}
          icon={BarChart2}
        />
        <KPICard
          label="TOTAL SPENT" value={fmt(monthlyExpenses)}
          trend={`${pct(savingsRate)} savings rate`}
          trendDir={savingsRate >= 20 ? "up" : "down"}
          status={monthlyExpenses <= totalBudget ? "SAFE" : "RISK"}
          icon={CreditCard} color="#EF4444"
        />
        <KPICard
          label="NET WORTH" value={fmt(netWorth?.netWorth ?? 0)}
          sub={`Assets ${fmt(netWorth?.totalAssets ?? 0)}`}
          icon={TrendingUp} color="#10B981"
        />
      </div>

      {/* Fiscal Health + Safe to Spend + Treasury Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FiscalHealthCard health={fiscalHealth} />
        <SafeToSpendWidget data={safeToSpend} />
        <div className="flex flex-col gap-4">
          <TreasuryStatus status={treasuryStatus} />
          <RunwayCard runway={runway} />
        </div>
      </div>

      {/* Reserve Bank Goal */}
      {primaryGoal && (
        <div className="card" style={{ borderColor: "rgba(155,89,182,0.3)", background: "rgba(155,89,182,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="stat-label mb-1">🏦 RESERVE BANK MISSION</div>
              <div className="text-base font-semibold text-[#F8FAFC]">{primaryGoal.goal?.name}</div>
            </div>
            <div className={`badge-${primaryGoal.onTrack ? "safe" : primaryGoal.status === "AT_RISK" ? "risk" : "watch"}`}>
              {primaryGoal.status?.replace("_", " ")}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs text-[#64748B] mb-1">Current</div>
              <div className="text-xl font-bold text-[#D4AF37]">{fmt(primaryGoal.goal?.currentAmount ?? 0)}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">Target</div>
              <div className="text-xl font-bold text-[#F8FAFC]">{fmt(primaryGoal.goal?.targetAmount ?? 0)}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">Remaining</div>
              <div className="text-xl font-bold text-[#EF4444]">{fmt(primaryGoal.remaining ?? 0)}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">Required/Month</div>
              <div className="text-xl font-bold text-[#D4AF37]">{fmt(primaryGoal.requiredMonthly ?? 0)}</div>
            </div>
          </div>

          <div className="progress-bar h-3">
            <div
              className="progress-fill h-3 rounded-full"
              style={{
                width: `${primaryGoal.progressPercent ?? 0}%`,
                background: "linear-gradient(90deg, #D4AF37, #1E3A8A)"
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#64748B] mt-1">
            <span>{pct(primaryGoal.progressPercent ?? 0)} complete</span>
            <span>Target: 8 Jan 2027</span>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spending Breakdown */}
        <div className="card">
          <div className="stat-label mb-4">SPENDING BREAKDOWN</div>
          {pieData?.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx={75} cy={75}
                    innerRadius={45} outerRadius={75}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_: unknown, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => fmt(Number(v ?? 0))}
                    contentStyle={{ background: "#0D1627", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1">
                {pieData.slice(0, 6).map((d: { icon: string; name: string; value: number }, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-[#94A3B8]">{d.icon} {d.name.split(" ")[0]}</span>
                    </div>
                    <span className="font-mono text-[#F8FAFC]">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-[#64748B] gap-3">
              <BarChart2 size={32} />
              <div className="text-sm">No expenses this month</div>
              <Link href="/transactions" className="btn-primary text-xs">+ Add First Transaction</Link>
            </div>
          )}
        </div>

        {/* Budget vs Actual */}
        <div className="card">
          <div className="stat-label mb-4">BUDGET vs ACTUAL</div>
          {barData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barCategoryGap="30%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: unknown) => fmt(Number(v ?? 0))}
                  contentStyle={{ background: "#0D1627", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#94A3B8" }} />
                <Bar dataKey="Budget" fill="#2563EB" radius={[3, 3, 0, 0]} opacity={0.7} />
                <Bar dataKey="Actual" fill="#1E3A8A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-[#64748B] text-sm">No budget data</div>
          )}
        </div>
      </div>

      {/* Ministry Status Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="stat-label">MINISTRY STATUS</span>
          <Link href="/ministries" className="text-xs text-[#1E3A8A] hover:underline">View All →</Link>
        </div>
        {ministryAnalyses?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ministry</th>
                  <th>Budget</th>
                  <th>Actual</th>
                  <th>Remaining</th>
                  <th>Used</th>
                  <th>Velocity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ministryAnalyses.map((m: {
                  ministry: { _id: string; icon: string; name: string };
                  budget: number; spent: number; remaining: number;
                  percentUsed: number; velocity: string; status: string;
                }) => (
                  <tr key={m.ministry._id} className="cursor-pointer" onClick={() => window.location.href = `/ministries/${m.ministry._id}`}>
                    <td>
                      <div className="flex items-center gap-2 font-medium text-[#F8FAFC]">
                        <span>{m.ministry.icon}</span>
                        <span className="text-sm">{m.ministry.name}</span>
                      </div>
                    </td>
                    <td className="font-mono">{fmt(m.budget)}</td>
                    <td className="font-mono text-[#F8FAFC]">{fmt(m.spent)}</td>
                    <td className={`font-mono ${m.remaining === 0 ? "text-[#EF4444]" : "text-[#10B981]"}`}>{fmt(m.remaining)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar w-16">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, m.percentUsed)}%`,
                              background: m.percentUsed >= 100 ? "#EF4444" : m.percentUsed >= 80 ? "#D4AF37" : "#10B981"
                            }}
                          />
                        </div>
                        <span className="text-xs">{m.percentUsed.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`text-xs font-semibold ${
                        m.velocity === "CRITICAL" ? "text-[#EF4444]" :
                        m.velocity === "HIGH" ? "text-[#D4AF37]" :
                        m.velocity === "NORMAL" ? "text-[#94A3B8]" : "text-[#10B981]"
                      }`}>{m.velocity}</span>
                    </td>
                    <td>
                      <span className={`badge-${m.status === "SAFE" ? "safe" : m.status === "WATCH" ? "watch" : "risk"}`}>
                        {m.status === "OVER_BUDGET" ? "OVER BUDGET" : m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-[#64748B] text-sm">No ministries configured</div>
        )}
      </div>

      {/* Alerts + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts */}
        <div className="card">
          <div className="stat-label mb-4">TREASURY ALERTS</div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alerts?.length > 0 ? alerts.slice(0, 6).map((alert: {
              id: string; severity: string; title: string; message: string; actionable?: string;
            }) => (
              <div
                key={alert.id}
                className={`px-3 py-3 rounded-lg border ${
                  alert.severity === "RED" ? "border-[#EF4444]/30 bg-[#EF4444]/05" :
                  alert.severity === "YELLOW" ? "border-[#D4AF37]/30 bg-[#D4AF37]/05" :
                  alert.severity === "GREEN" ? "border-[#10B981]/30 bg-[#10B981]/05" :
                  "border-[#1E3A8A]/30 bg-[#1E3A8A]/05"
                }`}
              >
                <div className="text-xs font-semibold mb-1" style={{
                  color: alert.severity === "RED" ? "#EF4444" :
                  alert.severity === "YELLOW" ? "#D4AF37" :
                  alert.severity === "GREEN" ? "#10B981" : "#1E3A8A"
                }}>
                  {alert.title}
                </div>
                <div className="text-xs text-[#94A3B8] leading-relaxed">{alert.message}</div>
                {alert.actionable && (
                  <div className="text-xs text-[#64748B] mt-1 italic">→ {alert.actionable}</div>
                )}
              </div>
            )) : (
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg border border-[#10B981]/20 bg-[#10B981]/05">
                <CheckCircle size={16} color="#10B981" />
                <span className="text-xs text-[#94A3B8]">No active alerts. Treasury operating normally.</span>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations + Upcoming */}
        <div className="flex flex-col gap-4">
          <div className="card flex-1">
            <div className="stat-label mb-3">FINANCIAL RECOMMENDATIONS</div>
            <div className="space-y-3">
              {recommendations?.map((r: { id: string; impact: string; text: string }, i: number) => (
                <div key={r.id} className="flex gap-3">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    r.impact === "HIGH" ? "bg-[#EF4444]/20 text-[#EF4444]" :
                    r.impact === "MEDIUM" ? "bg-[#D4AF37]/20 text-[#D4AF37]" :
                    "bg-[#10B981]/20 text-[#10B981]"
                  }`}>{i + 1}</div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Obligations */}
          {upcomingObligations?.length > 0 && (
            <div className="card">
              <div className="stat-label mb-3">UPCOMING OBLIGATIONS</div>
              <div className="space-y-2">
                {upcomingObligations.slice(0, 4).map((ob: {
                  _id: string; name: string; amount: number; daysUntilDue: number
                }) => (
                  <div key={ob._id} className="flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8]">{ob.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#F8FAFC]">{fmt(ob.amount)}</span>
                      <span className={ob.daysUntilDue <= 3 ? "text-[#EF4444]" : ob.daysUntilDue <= 7 ? "text-[#D4AF37]" : "text-[#64748B]"}>
                        {ob.daysUntilDue === 0 ? "Today" : `${ob.daysUntilDue}d`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="stat-label">RECENT TRANSACTIONS</span>
          <Link href="/transactions" className="text-xs text-[#1E3A8A] hover:underline">View All →</Link>
        </div>
        {hasTransactions ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Ministry</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t: {
                  _id: string; date: string; description: string;
                  ministryName: string; ministryIcon: string; type: string; amount: number
                }) => (
                  <tr key={t._id}>
                    <td className="text-[11px]">{format(new Date(t.date), "dd MMM")}</td>
                    <td className="text-[#F8FAFC]">{t.description}</td>
                    <td>
                      <span className="text-xs">{t.ministryIcon} {t.ministryName}</span>
                    </td>
                    <td>
                      <span className={`badge-${t.type === "INCOME" ? "safe" : t.type === "RESERVE_TRANSFER" ? "info" : "risk"}`} style={{ fontSize: "9px" }}>
                        {t.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className={`text-right font-mono font-semibold ${
                      t.type === "INCOME" ? "amount-income" :
                      t.type === "RESERVE_TRANSFER" ? "amount-reserve" : "amount-expense"
                    }`}>
                      {t.type === "INCOME" ? "+" : "-"}{fmt(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <ArrowUpRight size={36} color="#64748B" />
            <div className="text-[#64748B] text-sm">No transactions recorded yet</div>
            <Link href="/transactions" className="btn-primary">+ Add First Transaction</Link>
          </div>
        )}
      </div>
    </div>
  );
}
