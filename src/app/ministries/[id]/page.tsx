"use client";
import { use } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function MinistryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: dash } = useSWR("/api/dashboard", fetcher);
  const { data: txData } = useSWR(`/api/transactions?ministryId=${id}&limit=50`, fetcher);

  const analysis = dash?.ministryAnalyses?.find((m: { ministry: { _id: string } }) => m.ministry._id === id);
  const transactions = txData?.transactions ?? [];

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <div className="text-[#64748B]">Ministry not found</div>
        <Link href="/ministries" className="btn-ghost text-sm flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Ministries
        </Link>
      </div>
    );
  }

  const pct = Math.min(100, analysis.percentUsed);
  const barColor = pct >= 100 ? "#EF4444" : pct >= 80 ? "#D4AF37" : "#10B981";

  // Daily spending chart
  const dailyMap: Record<string, number> = {};
  transactions
    .filter((t: { type: string }) => t.type === "EXPENSE")
    .forEach((t: { date: string; amount: number }) => {
      const d = format(new Date(t.date), "dd MMM");
      dailyMap[d] = (dailyMap[d] ?? 0) + t.amount;
    });
  const dailyData = Object.entries(dailyMap)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Back */}
      <Link href="/ministries" className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#94A3B8] transition-colors">
        <ArrowLeft size={14} /> Back to Ministries
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-3xl md:text-4xl">{analysis.ministry.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-[#F8FAFC]">{analysis.ministry.name.toUpperCase()} MINISTRY</h1>
            <div className={`badge-${analysis.status === "SAFE" ? "safe" : analysis.status === "WATCH" ? "watch" : "risk"} inline-block mt-1`}>
              {analysis.status === "OVER_BUDGET" ? "OVER BUDGET" : analysis.status}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-bar h-3 mb-3">
          <div className="progress-fill h-3" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <div className="flex justify-between text-xs text-[#64748B] mb-4">
          <span>{pct.toFixed(0)}% of budget used</span>
          <span>{fmt(analysis.spent)} / {fmt(analysis.budget)}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">MONTHLY BUDGET</div>
            <div className="text-lg font-bold text-[#F8FAFC]">{fmt(analysis.budget)}</div>
          </div>
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">AMOUNT SPENT</div>
            <div className="text-lg font-bold" style={{ color: barColor }}>{fmt(analysis.spent)}</div>
          </div>
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">REMAINING</div>
            <div className="text-lg font-bold text-[#10B981]">{fmt(Math.max(0, analysis.remaining))}</div>
          </div>
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">DAILY AVERAGE</div>
            <div className="text-lg font-bold text-[#94A3B8]">{fmt(analysis.dailyAverage)}</div>
          </div>
        </div>

        {analysis.willOverrun && (
          <div className="mt-4 px-4 py-3 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/08">
            <div className="text-[#EF4444] text-sm font-semibold mb-1">⚠️ PROJECTED OVERSPEND</div>
            <div className="text-xs text-[#94A3B8]">
              At current pace, {analysis.ministry.name} will spend {fmt(analysis.projectedMonthEnd)} this month
              — {fmt(analysis.projectedMonthEnd - analysis.budget)} over budget.
            </div>
          </div>
        )}
      </div>

      {/* Daily spend chart */}
      {dailyData.length > 0 && (
        <div className="card">
          <div className="stat-label mb-4">DAILY SPENDING</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(v: unknown) => fmt(Number(v ?? 0))}
                contentStyle={{ background: "#0D1627", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                {dailyData.map((_, i) => (
                  <Cell key={i} fill={barColor} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions */}
      <div className="card">
        <div className="stat-label mb-4">TRANSACTIONS ({transactions.length})</div>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-[#64748B] text-sm">No transactions for this ministry</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: { _id: string; date: string; description: string; amount: number; type: string }) => (
                <tr key={t._id}>
                  <td className="text-[11px]">{format(new Date(t.date), "dd MMM yyyy")}</td>
                  <td className="text-[#F8FAFC]">{t.description}</td>
                  <td className="text-right font-mono font-semibold text-[#EF4444]">
                    -{fmt(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
