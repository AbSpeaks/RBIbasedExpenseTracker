"use client";
import { useState } from "react";
import useSWR from "swr";
import { Calculator, AlertTriangle, Info, ToggleLeft, ToggleRight } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const PRIORITIES = [
  { name: "Monthly Rent", amount: 5500, ministry: "Housing & Utilities", priority: "essential" },
  { name: "Electricity", amount: 175, ministry: "Housing & Utilities", priority: "essential" },
  { name: "EMI", amount: 2500, ministry: "Debt / EMI", priority: "essential" },
  { name: "Reserve Bank", amount: 12000, ministry: "Reserve Bank", priority: "essential" },
  { name: "Food", amount: 3000, ministry: "Food", priority: "essential" },
  { name: "Mobile Recharge", amount: 299, ministry: "Bills & Recharge", priority: "essential" },
  { name: "Transport", amount: 1500, ministry: "Transport", priority: "important" },
  { name: "Family Affairs", amount: 2000, ministry: "Family Affairs", priority: "important" },
  { name: "Startup Affairs", amount: 2000, ministry: "Startup Affairs", priority: "strategic" },
  { name: "Entertainment", amount: 1000, ministry: "Entertainment", priority: "discretionary" },
  { name: "Shopping / Misc", amount: 2000, ministry: "Shopping / Miscellaneous", priority: "discretionary" },
];

export default function BudgetPage() {
  const { data: user } = useSWR("/api/user", fetcher);
  const { data: ministries } = useSWR("/api/ministries", fetcher);
  const [lowIncomeMode, setLowIncomeMode] = useState(user?.lowIncomeMode ?? false);
  const [customIncome, setCustomIncome] = useState("");

  const normalIncome = user?.monthlyIncome ?? 32000;
  const lowIncome = user?.lowIncomeAmount ?? 25000;
  const income = customIncome ? parseFloat(customIncome) : (lowIncomeMode ? lowIncome : normalIncome);

  // Build recommended budget
  const buildBudget = (income: number) => {
    const budget: { name: string; amount: number; ministry: string; priority: string; pct: string }[] = [];
    let remaining = income;
    for (const item of PRIORITIES) {
      const amount = Math.min(item.amount, remaining);
      if (amount > 0) {
        budget.push({ ...item, amount, pct: ((amount / income) * 100).toFixed(1) });
        remaining -= amount;
      }
    }
    return { budget, remaining };
  };

  const { budget, remaining } = buildBudget(isNaN(income) || income <= 0 ? normalIncome : income);
  const totalAllocated = budget.reduce((s, b) => s + b.amount, 0);

  const priorityColors: Record<string, string> = {
    essential: "#EF4444",
    important: "#D4AF37",
    strategic: "#1E3A8A",
    discretionary: "#94A3B8",
  };

  return (
    <div className="space-y-5 animate-fade-in-up max-w-2xl">
      <div className="flex items-center gap-3">
        <Calculator size={20} color="#1E3A8A" />
        <div>
          <h1 className="text-lg font-bold text-[#F8FAFC] tracking-wide uppercase">Budget Planner</h1>
          <div className="text-xs text-[#64748B] mt-0.5">Priority-based budget allocation engine</div>
        </div>
      </div>

      {/* Income Configuration */}
      <div className="card">
        <div className="stat-label mb-3">INCOME CONFIGURATION</div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl mb-4" style={{ background: "#102B43" }}>
          <div>
            <div className="text-sm font-semibold text-[#F8FAFC]">
              {lowIncomeMode ? "⚠️ LOW-INCOME MODE" : "NORMAL MODE"}
            </div>
            <div className="text-xs text-[#64748B]">
              {lowIncomeMode ? `₹${fmt(lowIncome)}/month` : `₹${fmt(normalIncome)}/month`}
            </div>
          </div>
          <button onClick={() => setLowIncomeMode(!lowIncomeMode)}>
            {lowIncomeMode
              ? <ToggleRight size={32} color="#D4AF37" />
              : <ToggleLeft size={32} color="#64748B" />}
          </button>
        </div>

        {lowIncomeMode && (
          <div className="badge-watch mb-4">⚠️ LOW-INCOME FISCAL POLICY ACTIVE — Discretionary budgets reduced</div>
        )}

        <div>
          <label className="stat-label block mb-2">CUSTOM INCOME (override)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
            <input
              type="number"
              className="input-field pl-7"
              placeholder={`e.g. ${normalIncome}`}
              value={customIncome}
              onChange={e => setCustomIncome(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Recommended Budget */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="stat-label">RECOMMENDED BUDGET ALLOCATION</span>
          <div className="flex items-center gap-2 text-xs text-[#1E3A8A]">
            <Info size={12} />
            Priority-ordered
          </div>
        </div>

        <div className="flex justify-between mb-4 text-sm">
          <div>
            <span className="text-[#64748B]">Monthly Income: </span>
            <span className="font-bold text-[#10B981]">{fmt(isNaN(income) ? normalIncome : income)}</span>
          </div>
          <div>
            <span className="text-[#64748B]">Allocated: </span>
            <span className="font-bold text-[#F8FAFC]">{fmt(totalAllocated)}</span>
          </div>
          <div>
            <span className="text-[#64748B]">Unallocated: </span>
            <span className={`font-bold ${remaining >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>{fmt(remaining)}</span>
          </div>
        </div>

        <div className="space-y-2">
          {budget.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="w-5 text-center text-[10px] font-semibold text-[#64748B]">{i + 1}</div>
              <div className="flex-1">
                <div className="text-sm text-[#F8FAFC]">{item.name}</div>
                <div className="text-[10px] text-[#64748B]">{item.ministry}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] px-2 py-0.5 rounded" style={{
                  background: `${priorityColors[item.priority]}15`,
                  color: priorityColors[item.priority],
                }}>
                  {item.priority}
                </span>
                <div className="text-right">
                  <div className="font-mono font-semibold text-[#F8FAFC]">{fmt(item.amount)}</div>
                  <div className="text-[10px] text-[#64748B]">{item.pct}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {remaining > 0 && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-[#10B981]/08 border border-[#10B981]/20">
            <div className="text-[#10B981] text-sm font-semibold">💰 Surplus: {fmt(remaining)}</div>
            <div className="text-xs text-[#94A3B8] mt-1">Consider moving surplus to Reserve Bank or Emergency Fund.</div>
          </div>
        )}

        {remaining < 0 && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-[#EF4444]/08 border border-[#EF4444]/20">
            <div className="text-[#EF4444] text-sm font-semibold">⚠️ Budget Deficit: {fmt(Math.abs(remaining))}</div>
            <div className="text-xs text-[#94A3B8] mt-1">Income is insufficient for all allocations. Reduce discretionary spending.</div>
          </div>
        )}
      </div>

      {/* Priority legend */}
      <div className="card">
        <div className="stat-label mb-3">BUDGET PRIORITY GUIDE</div>
        <div className="space-y-2 text-xs">
          {Object.entries(priorityColors).map(([p, c]) => (
            <div key={p} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: c }} />
              <span className="font-semibold uppercase" style={{ color: c }}>{p}</span>
              <span className="text-[#64748B]">
                {p === "essential" ? "— Non-negotiable. Always fund first." :
                 p === "important" ? "— Required for daily function. Reduce last." :
                 p === "strategic" ? "— Long-term value. Protect but not at essential expense." :
                 "— Cut first when income is constrained."}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
