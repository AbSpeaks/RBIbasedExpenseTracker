"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Edit2, Plus, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

interface Ministry {
  _id: string; name: string; icon: string; color: string;
  monthlyBudget: number; priority: string; active: boolean;
}

interface MinistryAnalysis {
  ministry: { _id: string; name: string; icon: string; color: string };
  budget: number; spent: number; remaining: number;
  percentUsed: number; velocity: string; status: string;
  projectedMonthEnd: number; willOverrun: boolean; dailyAverage: number;
}

function StatusDot({ status }: { status: string }) {
  const c = status === "SAFE" ? "#10B981" : status === "WATCH" ? "#D4AF37" : "#EF4444";
  return <div className="w-2 h-2 rounded-full" style={{ background: c }} />;
}

function EditBudgetModal({
  ministry, onClose, onSave
}: {
  ministry: Ministry;
  onClose: () => void;
  onSave: (id: string, budget: number) => void;
}) {
  const [value, setValue] = useState(ministry.monthlyBudget.toString());
  return (
    <Modal open title={`Edit ${ministry.name} Budget`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: "#102B43" }}>
            <span className="text-2xl">{ministry.icon}</span>
            <div>
              <div className="text-sm font-semibold text-[#F8FAFC]">{ministry.name}</div>
              <div className="text-xs text-[#64748B]">Current: {fmt(ministry.monthlyBudget)} / month</div>
            </div>
          </div>
          <label className="stat-label block mb-2">NEW MONTHLY BUDGET</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
            <input
              type="number"
              min="0"
              className="input-field pl-7"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onSave(ministry._id, parseFloat(value))}
            className="btn-primary flex-1"
          >
            Save Budget
          </button>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

export default function MinistriesPage() {
  const { toast } = useToast();
  const [editMinistry, setEditMinistry] = useState<Ministry | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "spent" | "budget" | "status">("status");

  const { data: dashData, mutate: mutateDash } = useSWR("/api/dashboard", fetcher);
  const { data: ministriesData, mutate: mutateMin } = useSWR<Ministry[]>("/api/ministries", fetcher);

  const analyses: MinistryAnalysis[] = dashData?.ministryAnalyses ?? [];
  const ministries: Ministry[] = ministriesData ?? [];

  const ministriesMap: Record<string, Ministry> = {};
  ministries.forEach((m) => { ministriesMap[m._id] = m; });

  const handleSaveBudget = async (id: string, budget: number) => {
    if (isNaN(budget) || budget < 0) { toast("error", "Invalid budget amount"); return; }
    try {
      const res = await fetch(`/api/ministries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: budget }),
      });
      if (!res.ok) { toast("error", "Failed to update budget"); return; }
      toast("success", "Budget updated successfully");
      setEditMinistry(null);
      mutateMin();
      mutateDash();
    } catch {
      toast("error", "Network error");
    }
  };

  const sorted = [...analyses].sort((a, b) => {
    if (sortBy === "spent") return b.spent - a.spent;
    if (sortBy === "budget") return b.budget - a.budget;
    if (sortBy === "status") {
      const order = { OVER_BUDGET: 0, WATCH: 1, SAFE: 2 };
      return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
    }
    return a.ministry.name.localeCompare(b.ministry.name);
  });

  const totalBudget = analyses.reduce((s, m) => s + m.budget, 0);
  const totalSpent = analyses.reduce((s, m) => s + m.spent, 0);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#F8FAFC] tracking-wide uppercase">Ministries</h1>
          <div className="text-xs text-[#64748B] mt-0.5">{analyses.length} active ministries</div>
        </div>
        <div className="flex gap-2">
          <select
            className="input-field text-xs w-36"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="status">Sort: Status</option>
            <option value="spent">Sort: Spent</option>
            <option value="budget">Sort: Budget</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="stat-label mb-1">TOTAL BUDGET</div>
          <div className="text-xl font-bold text-[#F8FAFC]">{fmt(totalBudget)}</div>
        </div>
        <div className="card text-center">
          <div className="stat-label mb-1">TOTAL SPENT</div>
          <div className="text-xl font-bold text-[#EF4444]">{fmt(totalSpent)}</div>
        </div>
        <div className="card text-center">
          <div className="stat-label mb-1">REMAINING</div>
          <div className="text-xl font-bold text-[#10B981]">{fmt(Math.max(0, totalBudget - totalSpent))}</div>
        </div>
      </div>

      {/* Ministry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sorted.map((m) => {
          const ministry = ministriesMap[m.ministry._id];
          const pct = Math.min(100, m.percentUsed);
          const barColor = pct >= 100 ? "#EF4444" : pct >= 80 ? "#D4AF37" : "#10B981";

          return (
            <div key={m.ministry._id} className="card hover:border-[#2563EB]/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.ministry.icon}</span>
                  <div>
                    <div className="font-semibold text-[#F8FAFC] text-sm">{m.ministry.name}</div>
                    <div className="text-[10px] text-[#64748B] uppercase tracking-wide">{ministry?.priority ?? "—"} priority</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status={m.status} />
                  <span className={`badge-${m.status === "SAFE" ? "safe" : m.status === "WATCH" ? "watch" : "risk"} text-[9px]`}>
                    {m.status === "OVER_BUDGET" ? "OVER" : m.status}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="progress-bar h-2 mb-2">
                <div className="progress-fill h-2" style={{ width: `${pct}%`, background: barColor }} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <div>
                  <div className="text-[10px] text-[#64748B]">Budget</div>
                  <div className="text-sm font-semibold text-[#F8FAFC] font-mono">{fmt(m.budget)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B]">Spent</div>
                  <div className="text-sm font-semibold font-mono" style={{ color: barColor }}>{fmt(m.spent)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B]">Remaining</div>
                  <div className="text-sm font-semibold text-[#10B981] font-mono">{fmt(Math.max(0, m.remaining))}</div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#64748B]">{m.percentUsed.toFixed(0)}% used</span>
                  <span className={`text-[10px] font-semibold ${
                    m.velocity === "CRITICAL" ? "text-[#EF4444]" :
                    m.velocity === "HIGH" ? "text-[#D4AF37]" : "text-[#10B981]"
                  }`}>
                    {m.velocity} velocity
                  </span>
                  {m.willOverrun && (
                    <span className="text-[10px] text-[#EF4444]">⚠ projected {fmt(m.projectedMonthEnd)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {ministry && (
                    <button
                      onClick={() => setEditMinistry(ministry)}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/10 transition-all"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  <Link
                    href={`/ministries/${m.ministry._id}`}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#94A3B8] hover:bg-white/5 transition-all"
                  >
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editMinistry && (
        <EditBudgetModal
          ministry={editMinistry}
          onClose={() => setEditMinistry(null)}
          onSave={handleSaveBudget}
        />
      )}
    </div>
  );
}
