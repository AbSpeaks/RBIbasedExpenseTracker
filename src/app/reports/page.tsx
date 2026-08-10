"use client";
import useSWR from "swr";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

interface ReportMonth {
  month: string; label: string; income: number; expenses: number; savings: number;
  reserveContribution: number; savingsRate: string; surplus: boolean;
  largestMinistry?: { name: string; spent: number };
  largestExpense?: { description: string; amount: number };
  transactionCount: number;
}

export default function ReportsPage() {
  const { data: reports, isLoading } = useSWR<ReportMonth[]>("/api/reports?months=6", fetcher);

  if (isLoading) {
    return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}</div>;
  }

  const allReports = reports ?? [];
  const currentMonth = allReports[allReports.length - 1];

  const chartData = allReports.map((r) => ({
    month: r.label.split(" ")[0].slice(0, 3) + " " + r.label.split(" ")[1].slice(2),
    Income: r.income,
    Expenses: r.expenses,
    Savings: Math.max(0, r.savings),
    Reserve: r.reserveContribution,
  }));

  const savingsRateData = allReports.map((r) => ({
    month: r.label.split(" ")[0].slice(0, 3) + " " + r.label.split(" ")[1].slice(2),
    "Savings Rate": parseFloat(r.savingsRate),
  }));

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-lg font-bold text-[#F8FAFC] tracking-wide uppercase">Monthly Reports</h1>
        <div className="text-xs text-[#64748B] mt-0.5">6-month historical view</div>
      </div>

      {/* Current month summary */}
      {currentMonth && (
        <div className={`card ${currentMonth.savings === 0 ? "border-[#94A3B8]/30" : currentMonth.surplus ? "border-[#10B981]/30" : "border-[#EF4444]/30"}`}
          style={{ background: currentMonth.savings === 0 ? "rgba(148,163,184,0.04)" : currentMonth.surplus ? "rgba(61,220,151,0.04)" : "rgba(255,107,107,0.04)" }}>
          <div className="flex items-center gap-3 mb-4">
            {currentMonth.savings === 0 ? <TrendingUp size={20} color="#94A3B8" className="opacity-50" /> : currentMonth.surplus ? <TrendingUp size={20} color="#10B981" /> : <TrendingDown size={20} color="#EF4444" />}
            <div>
              <div className="stat-label">CURRENT MONTH: {currentMonth.label.toUpperCase()}</div>
              <div className={`text-2xl font-mono font-bold ${currentMonth.savings === 0 ? "text-[#94A3B8]" : currentMonth.surplus ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                {currentMonth.savings === 0 ? "⚪ NEUTRAL" : currentMonth.surplus ? "🟢 SURPLUS" : "🔴 DEFICIT"} {fmt(Math.abs(currentMonth.savings))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "INCOME", value: currentMonth.income, color: "#10B981" },
              { label: "EXPENSES", value: currentMonth.expenses, color: "#EF4444" },
              { label: "SAVINGS", value: currentMonth.savings, color: currentMonth.savings === 0 ? "#94A3B8" : currentMonth.surplus ? "#10B981" : "#EF4444" },
              { label: "RESERVE TRANSFER", value: currentMonth.reserveContribution, color: "#D4AF37" },
              { label: "SAVINGS RATE", value: parseFloat(currentMonth.savingsRate), color: "#1E3A8A", isPercent: true },
            ].map((item) => (
              <div key={item.label} className="card-sm">
                <div className="text-[10px] text-[#64748B] mb-1">{item.label}</div>
                <div className="text-base font-bold" style={{ color: item.color }}>
                  {item.isPercent ? `${item.value.toFixed(1)}%` : fmt(item.value)}
                </div>
              </div>
            ))}
          </div>
          {currentMonth.largestMinistry && (
            <div className="mt-3 text-xs text-[#64748B]">
              Largest ministry: <span className="text-[#F8FAFC]">{currentMonth.largestMinistry.name}</span> ({fmt(currentMonth.largestMinistry.spent)}) ·
              {currentMonth.largestExpense && <> Largest expense: <span className="text-[#F8FAFC]">{currentMonth.largestExpense.description}</span> ({fmt(currentMonth.largestExpense.amount)})</>}
            </div>
          )}
        </div>
      )}

      {/* Income vs Expenses chart */}
      <div className="card">
        <div className="stat-label mb-4">INCOME vs EXPENSES (6 Months)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} />
            <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: unknown) => fmt(Number(v ?? 0))}
              contentStyle={{ background: "#0D1627", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#94A3B8" }} />
            <Bar dataKey="Income" fill="#10B981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Expenses" fill="#EF4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Savings" fill="#1E3A8A" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings rate trend */}
      <div className="card">
        <div className="stat-label mb-4">SAVINGS RATE TREND</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={savingsRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} />
            <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(v: unknown) => `${Number(v ?? 0).toFixed(1)}%`}
              contentStyle={{ background: "#0D1627", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
            />
            <Line dataKey="Savings Rate" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="stat-label">MONTHLY SUMMARY TABLE</div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="text-right">Income</th>
                <th className="text-right">Expenses</th>
                <th className="text-right">Savings</th>
                <th className="text-right">Reserve</th>
                <th className="text-right">Rate</th>
                <th className="text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {allReports.map((r) => (
                <tr key={r.month}>
                  <td className="font-medium text-[#F8FAFC]">{r.label}</td>
                  <td className="text-right font-mono text-[#10B981]">{fmt(r.income)}</td>
                  <td className="text-right font-mono text-[#EF4444]">{fmt(r.expenses)}</td>
                  <td className={`text-right font-mono font-semibold ${r.savings === 0 ? "text-[#94A3B8]" : r.surplus ? "text-[#10B981]" : "text-[#EF4444]"}`}>{fmt(r.savings)}</td>
                  <td className="text-right font-mono text-[#D4AF37]">{fmt(r.reserveContribution)}</td>
                  <td className="text-right font-mono">{r.savingsRate}%</td>
                  <td className="text-center">
                    <span className={r.savings === 0 ? "badge-neutral" : `badge-${r.surplus ? "safe" : "risk"}`}>
                      {r.savings === 0 ? "NEUTRAL" : r.surplus ? "SURPLUS" : "DEFICIT"}
                    </span>
                  </td>
                </tr>
              ))}
              {allReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#64748B]">No historical data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
