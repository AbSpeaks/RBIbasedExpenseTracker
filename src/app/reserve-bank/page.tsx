"use client";
import useSWR from "swr";
import { format, differenceInDays } from "date-fns";
import { Shield, TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function ReserveBankPage() {
  const { data: dash } = useSWR("/api/dashboard", fetcher);
  const { data: goals } = useSWR("/api/goals", fetcher);

  const primaryGoal = dash?.goalProgressList?.[0];
  const reserve = dash?.reserveBalance ?? 18000;

  const targetAmount = 80000;
  const targetDate = new Date("2027-01-08");
  const now = new Date();
  const daysToTarget = differenceInDays(targetDate, now);
  const monthsToTarget = daysToTarget / 30.44;
  const remaining = Math.max(0, targetAmount - reserve);
  const requiredMonthly = monthsToTarget > 0 ? remaining / monthsToTarget : remaining;
  const progressPct = Math.min(100, (reserve / targetAmount) * 100);

  // Trajectory data
  const trajectoryData = [];
  const currentMonthly = primaryGoal?.goal?.monthlyContribution ?? 12000;
  for (let i = 0; i <= Math.ceil(monthsToTarget) + 2; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    trajectoryData.push({
      month: format(d, "MMM yy"),
      Current: Math.min(targetAmount, reserve + i * currentMonthly),
      Target: targetAmount,
      Required: Math.min(targetAmount, reserve + i * requiredMonthly),
    });
  }

  const isOnTrack = currentMonthly >= requiredMonthly;
  const statusColor = isOnTrack ? "#10B981" : "#D4AF37";

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-lg font-bold text-[#F8FAFC] tracking-wide uppercase">Reserve Bank</h1>
        <div className="text-xs text-[#64748B] mt-0.5">₹80K Mission Control</div>
      </div>

      {/* Main status */}
      <div className="card" style={{ borderColor: "rgba(155,89,182,0.3)", background: "rgba(155,89,182,0.04)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl" style={{ background: "rgba(155,89,182,0.15)" }}>
            <Shield size={24} color="#D4AF37" />
          </div>
          <div>
            <div className="stat-label">RESERVE FUND</div>
            <div className="text-3xl font-mono font-bold text-[#D4AF37]">{fmt(reserve)}</div>
          </div>
          <div className="ml-auto">
            <div className={`text-sm font-bold ${isOnTrack ? "text-[#10B981]" : "text-[#D4AF37]"}`}>
              {isOnTrack ? "🟢 AHEAD OF TARGET" : "🟡 BEHIND TARGET"}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-[#64748B] mb-2">
            <span>Progress to ₹80,000</span>
            <span>{progressPct.toFixed(1)}%</span>
          </div>
          <div className="progress-bar h-4">
            <div
              className="progress-fill h-4 rounded-full"
              style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #D4AF37, #1E3A8A)" }}
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">TARGET</div>
            <div className="text-lg font-bold text-[#F8FAFC]">{fmt(targetAmount)}</div>
          </div>
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">REMAINING</div>
            <div className="text-lg font-bold text-[#EF4444]">{fmt(remaining)}</div>
          </div>
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">TARGET DATE</div>
            <div className="text-sm font-bold text-[#F8FAFC]">8 Jan 2027</div>
            <div className="text-[10px] text-[#64748B]">{daysToTarget} days away</div>
          </div>
          <div className="card-sm">
            <div className="text-[10px] text-[#64748B] mb-1">MONTHS LEFT</div>
            <div className="text-lg font-bold text-[#F8FAFC]">{Math.ceil(monthsToTarget)}</div>
          </div>
        </div>
      </div>

      {/* Monthly requirements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} color={statusColor} />
            <span className="stat-label">REQUIRED MONTHLY</span>
          </div>
          <div className="text-2xl font-mono font-bold" style={{ color: statusColor }}>{fmt(requiredMonthly)}</div>
          <div className="text-xs text-[#64748B] mt-1">to reach ₹80K by Jan 2027</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} color="#1E3A8A" />
            <span className="stat-label">CURRENT MONTHLY</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#1E3A8A]">{fmt(currentMonthly)}</div>
          <div className="text-xs text-[#64748B] mt-1">actual contribution</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} color={isOnTrack ? "#10B981" : "#D4AF37"} />
            <span className="stat-label">REQUIRED WEEKLY</span>
          </div>
          <div className="text-2xl font-mono font-bold" style={{ color: isOnTrack ? "#10B981" : "#D4AF37" }}>
            {fmt(requiredMonthly / 4.33)}
          </div>
          <div className="text-xs text-[#64748B] mt-1">weekly savings needed</div>
        </div>
      </div>

      {/* Trajectory chart */}
      <div className="card">
        <div className="stat-label mb-4">TRAJECTORY TO ₹80K</div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trajectoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} />
            <YAxis
              tick={{ fill: "#64748B", fontSize: 10 }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: unknown) => fmt(Number(v ?? 0))}
              contentStyle={{ background: "#0D1627", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
            />
            <ReferenceLine y={targetAmount} stroke="#D4AF37" strokeDasharray="4 4" label={{ value: "Target", fill: "#D4AF37", fontSize: 10 }} />
            <Line dataKey="Current" stroke="#1E3A8A" strokeWidth={2} dot={false} name="Current Trajectory" />
            <Line dataKey="Required" stroke="#10B981" strokeWidth={2} dot={false} strokeDasharray="5 3" name="Required Trajectory" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-[#64748B]">
          <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-[#1E3A8A]" /> Current pace</div>
          <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-[#10B981]" style={{ borderTop: "2px dashed" }} /> Required pace</div>
          <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-[#D4AF37]" style={{ borderTop: "2px dashed" }} /> Target</div>
        </div>
      </div>

      {/* Analysis */}
      <div className="card">
        <div className="stat-label mb-3">TRAJECTORY ANALYSIS</div>
        {isOnTrack ? (
          <div className="px-4 py-3 rounded-lg border border-[#10B981]/30 bg-[#10B981]/05">
            <div className="text-[#10B981] font-semibold text-sm mb-1">🟢 ON TRACK FOR ₹80K MISSION</div>
            <div className="text-xs text-[#94A3B8]">
              At ₹{fmt(currentMonthly)}/month you will reach the target before January 2027.
              Monthly surplus: {fmt(currentMonthly - requiredMonthly)}.
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/05">
            <div className="text-[#D4AF37] font-semibold text-sm mb-1">🟡 BEHIND TARGET</div>
            <div className="text-xs text-[#94A3B8]">
              You need {fmt(requiredMonthly)}/month but contributing {fmt(currentMonthly)}.
              Increase monthly contribution by {fmt(requiredMonthly - currentMonthly)} to stay on track.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
