"use client";
import useSWR from "swr";
import { format } from "date-fns";
import { Zap, TrendingDown, Calendar, Clock } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function DailyControlPage() {
  const { data: dash, isLoading } = useSWR("/api/dashboard", fetcher, { refreshInterval: 30000 });

  const safeToSpend = dash?.safeToSpend;
  const runway = dash?.runway;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Today's and this week's spending
  const allTransactions = dash?.recentTransactions ?? [];
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);
  const weekSpend = allTransactions
    .filter((t: { date: string; type: string }) => t.type === "EXPENSE" && new Date(t.date) >= weekStart)
    .reduce((s: number, t: { amount: number }) => s + t.amount, 0);

  // Monthly stats
  const monthlyBudget = dash?.totalBudget ?? 0;
  const monthlySpent = dash?.monthlyExpenses ?? 0;
  const budgetUtilization = dash?.budgetUtilization ?? 0;

  const pctSpent = safeToSpend?.safeLimit > 0
    ? Math.min(100, (safeToSpend.todaySpent / safeToSpend.safeLimit) * 100) : 0;

  const statusColor = safeToSpend?.status === "SAFE" ? "#10B981" : safeToSpend?.status === "WARNING" ? "#D4AF37" : "#EF4444";

  if (isLoading) {
    return <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-lg font-bold text-[#F8FAFC] tracking-wide uppercase">Daily Fiscal Control</h1>
        <div className="text-xs text-[#64748B] mt-0.5">{format(today, "EEEE, d MMMM yyyy")}</div>
      </div>

      {/* Today's main gauge */}
      <div className="card" style={{ borderColor: `${statusColor}30` }}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} color={statusColor} />
          <span className="stat-label">TODAY'S SPENDING CONTROL</span>
        </div>

        {/* Large gauge number */}
        <div className="flex items-center gap-6 mb-5">
          <div>
            <div className="text-[11px] text-[#64748B] mb-1">SAFE DAILY LIMIT</div>
            <div className="text-4xl md:text-5xl font-mono font-bold" style={{ color: statusColor, letterSpacing: "-0.03em" }}>
              {safeToSpend ? fmt(safeToSpend.safeAmount) : "—"}
            </div>
          </div>
          <div className="flex-1">
            {/* Visual gauge bar */}
            <div className="relative h-6 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pctSpent}%`,
                  background: `linear-gradient(90deg, ${statusColor}, ${pctSpent > 80 ? "#EF4444" : statusColor})`
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#F8FAFC]">
                {pctSpent.toFixed(0)}% used
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">TODAY SPENT</div>
            <div className="text-xl font-bold text-[#EF4444]">{safeToSpend ? fmt(safeToSpend.todaySpent) : "₹0"}</div>
          </div>
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">REMAINING TODAY</div>
            <div className="text-xl font-bold" style={{ color: statusColor }}>{safeToSpend ? fmt(safeToSpend.remaining) : "—"}</div>
          </div>
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">STATUS</div>
            <div className={`text-sm font-bold ${
              safeToSpend?.status === "SAFE" ? "text-[#10B981]" :
              safeToSpend?.status === "WARNING" ? "text-[#D4AF37]" : "text-[#EF4444]"
            }`}>
              {safeToSpend?.status === "SAFE" ? "🟢 SAFE" :
               safeToSpend?.status === "WARNING" ? "🟡 CAUTION" : "🔴 EXCEEDED"}
            </div>
          </div>
        </div>

        {safeToSpend?.status === "EXCEEDED" && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
            <div className="text-[#EF4444] text-sm font-semibold">
              ⚠️ {fmt(safeToSpend.excessAmount)} above safe limit today
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">No more discretionary spending today.</div>
          </div>
        )}
      </div>

      {/* Weekly + Monthly */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} color="#1E3A8A" />
            <span className="stat-label">WEEKLY OVERVIEW</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#EF4444] mb-1">{fmt(weekSpend)}</div>
          <div className="text-xs text-[#64748B]">spent this week (7 days)</div>
          <div className="divider" />
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Daily average (7d)</span>
            <span className="text-[#94A3B8] font-mono">{fmt(weekSpend / 7)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-[#64748B]">Safe daily limit</span>
            <span className="font-mono" style={{ color: statusColor }}>{safeToSpend ? fmt(safeToSpend.safeAmount) : "—"}</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} color="#D4AF37" />
            <span className="stat-label">MONTHLY PROGRESS</span>
          </div>
          <div className="progress-bar h-3 mb-2">
            <div
              className="progress-fill h-3"
              style={{
                width: `${Math.min(100, budgetUtilization)}%`,
                background: budgetUtilization > 100 ? "#EF4444" : budgetUtilization > 80 ? "#D4AF37" : "#10B981"
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#64748B] mb-3">
            <span>{budgetUtilization.toFixed(0)}% of budget used</span>
            <span>{fmt(monthlySpent)} / {fmt(monthlyBudget)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Remaining budget</span>
            <span className="text-[#10B981] font-mono">{fmt(Math.max(0, monthlyBudget - monthlySpent))}</span>
          </div>
        </div>
      </div>

      {/* Runway */}
      {runway && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} color={runway.status === "SAFE" ? "#10B981" : runway.status === "WARNING" ? "#D4AF37" : "#EF4444"} />
            <span className="stat-label">CASH RUNWAY ANALYSIS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-[#64748B] mb-1">RUNWAY</div>
              <div className="text-2xl font-mono font-bold" style={{
                color: runway.status === "SAFE" ? "#10B981" : runway.status === "WARNING" ? "#D4AF37" : "#EF4444"
              }}>
                {runway.runwayDays === 999 ? "∞" : runway.runwayDays}d
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#64748B] mb-1">DAILY BURN</div>
              <div className="text-xl font-bold text-[#EF4444]">{fmt(runway.averageDailySpend)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#64748B] mb-1">AVAILABLE</div>
              <div className="text-xl font-bold text-[#F8FAFC]">{fmt(runway.availableCash)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#64748B] mb-1">MONTH-END NEED</div>
              <div className="text-xl font-bold text-[#D4AF37]">{fmt(runway.monthEndRequirement)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Protection breakdown */}
      {safeToSpend && (
        <div className="card">
          <div className="stat-label mb-3">CASH PROTECTION BREAKDOWN</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">Current Cash</span>
              <span className="font-mono text-[#F8FAFC]">{fmt(safeToSpend.operationalCash + safeToSpend.protectedFunds)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94A3B8]">Protected (Reserve + Obligations)</span>
              <span className="font-mono text-[#D4AF37]">- {fmt(safeToSpend.protectedFunds)}</span>
            </div>
            <div className="divider" />
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-[#F8FAFC]">Operational Cash</span>
              <span className="font-mono" style={{ color: statusColor }}>{fmt(safeToSpend.operationalCash)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
