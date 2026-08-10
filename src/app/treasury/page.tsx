"use client";
import { useState } from "react";
import useSWR from "swr";
import { format, addDays } from "date-fns";
import { Landmark, TrendingUp, Shield } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const pct = (n: number) => n.toFixed(1) + "%";

const COLORS = ["#1E3A8A", "#10B981", "#D4AF37", "#EF4444", "#D4AF37", "#2563EB", "#94A3B8", "#10B981"];

export default function TreasuryPage() {
  const { data: dash, isLoading } = useSWR("/api/dashboard", fetcher);
  const { data: reports } = useSWR("/api/reports?months=6", fetcher);

  if (isLoading) {
    return <div className="space-y-4">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>;
  }

  const {
    currentCash, reserveBalance, monthlyIncome, monthlyExpenses,
    monthlySavings, savingsRate, budgetUtilization, fiscalHealth,
    treasuryStatus, netWorth, upcomingObligations, ministryAnalyses, user
  } = dash ?? {};

  const allReports = reports ?? [];
  const areaData = allReports.map((r: { label: string; income: number; expenses: number; savings: number }) => ({
    month: r.label.split(" ")[0].slice(0, 3),
    Income: r.income,
    Expenses: r.expenses,
    Savings: Math.max(0, r.savings),
  }));

  const spendingPie = ministryAnalyses
    ?.filter((m: { spent: number }) => m.spent > 0)
    .map((m: { ministry: { name: string; icon: string }; spent: number }) => ({
      name: m.ministry.icon + " " + m.ministry.name.split(" ")[0],
      value: m.spent,
    }));

  const healthColor = fiscalHealth?.level === "EXCELLENT" ? "#10B981" :
    fiscalHealth?.level === "GOOD" ? "#1E3A8A" :
    fiscalHealth?.level === "WARNING" ? "#D4AF37" : "#EF4444";

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Landmark size={20} color="#1E3A8A" />
        <div>
          <h1 className="text-lg font-bold text-[#F8FAFC] tracking-wide uppercase">Treasury Overview</h1>
          <div className="text-xs text-[#64748B] mt-0.5">Complete financial position</div>
        </div>
      </div>

      {/* Treasury Status Banner */}
      {treasuryStatus && (
        <div
          className="card"
          style={{
            borderColor: treasuryStatus.color === "green" ? "rgba(61,220,151,0.3)" :
              treasuryStatus.color === "yellow" ? "rgba(245,196,81,0.3)" : "rgba(255,107,107,0.3)",
            background: treasuryStatus.color === "green" ? "rgba(61,220,151,0.04)" :
              treasuryStatus.color === "yellow" ? "rgba(245,196,81,0.04)" : "rgba(255,107,107,0.04)",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">
              {treasuryStatus.color === "green" ? "🟢" : treasuryStatus.color === "yellow" ? "🟡" : "🔴"}
            </div>
            <div>
              <div className="text-xl font-black" style={{
                color: treasuryStatus.color === "green" ? "#10B981" :
                  treasuryStatus.color === "yellow" ? "#D4AF37" : "#EF4444"
              }}>
                {treasuryStatus.label}
              </div>
              {treasuryStatus.reasons.length > 0 && (
                <div className="text-xs text-[#94A3B8] mt-1">{treasuryStatus.reasons[0]}</div>
              )}
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] text-[#64748B]">FISCAL HEALTH</div>
              <div className="text-2xl font-mono font-bold" style={{ color: healthColor }}>{fiscalHealth?.total}/100</div>
            </div>
          </div>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "OPERATIONAL CASH", value: fmt(currentCash ?? 0), color: "#1E3A8A" },
          { label: "RESERVE FUND", value: fmt(reserveBalance ?? 0), color: "#D4AF37" },
          { label: "NET WORTH", value: fmt(netWorth?.netWorth ?? 0), color: "#10B981" },
          { label: "MONTHLY INCOME", value: fmt(monthlyIncome ?? 0), color: "#10B981" },
          { label: "MONTHLY EXPENSES", value: fmt(monthlyExpenses ?? 0), color: "#EF4444" },
          { label: "SAVINGS RATE", value: pct(savingsRate ?? 0), color: savingsRate >= 20 ? "#10B981" : "#D4AF37" },
        ].map((item) => (
          <div key={item.label} className="card">
            <div className="stat-label mb-1">{item.label}</div>
            <div className="text-2xl font-mono font-bold" style={{ color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Cash flow chart */}
      {areaData.length > 0 && (
        <div className="card">
          <div className="stat-label mb-4">6-MONTH CASH FLOW</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: unknown) => fmt(Number(v ?? 0))}
                contentStyle={{ background: "#0D1627", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#94A3B8" }} />
              <Area type="monotone" dataKey="Income" stroke="#10B981" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Expenses" stroke="#EF4444" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Spending + Net Worth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {spendingPie?.length > 0 && (
          <div className="card">
            <div className="stat-label mb-4">SPENDING ALLOCATION</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={spendingPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" strokeWidth={0}>
                  {spendingPie.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ background: "#0D1627", borderRadius: "8px", fontSize: "12px", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Legend wrapperStyle={{ fontSize: "10px", color: "#94A3B8" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Net Worth Breakdown */}
        {netWorth && (
          <div className="card">
            <div className="stat-label mb-4">NET WORTH BREAKDOWN</div>
            <div className="space-y-2 mb-3">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-2">Assets</div>
              {netWorth.assets?.map((a: { name: string; value: number }, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">{a.name}</span>
                  <span className="font-mono text-[#10B981]">{fmt(a.value)}</span>
                </div>
              ))}
              <div className="divider" />
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-2">Liabilities</div>
              {netWorth.liabilities?.map((l: { name: string; amount: number }, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">{l.name}</span>
                  <span className="font-mono text-[#EF4444]">- {fmt(l.amount)}</span>
                </div>
              ))}
              <div className="divider" />
              <div className="flex justify-between font-semibold">
                <span className="text-[#F8FAFC]">NET WORTH</span>
                <span className="font-mono text-[#10B981] text-lg">{fmt(netWorth.netWorth)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming obligations */}
      {upcomingObligations?.length > 0 && (
        <div className="card">
          <div className="stat-label mb-4">UPCOMING OBLIGATIONS (30 days)</div>
          <div className="space-y-2">
            {upcomingObligations.map((ob: { _id: string; name: string; amount: number; daysUntilDue: number }) => (
              <div key={ob._id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <span className="text-sm text-[#94A3B8]">{ob.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[#F8FAFC]">{fmt(ob.amount)}</span>
                  <span className={`text-xs font-semibold ${ob.daysUntilDue <= 3 ? "text-[#EF4444]" : ob.daysUntilDue <= 7 ? "text-[#D4AF37]" : "text-[#64748B]"}`}>
                    {ob.daysUntilDue === 0 ? "Today" : `In ${ob.daysUntilDue} days`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
