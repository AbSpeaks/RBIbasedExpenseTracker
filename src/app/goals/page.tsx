"use client";
import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, Target } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { calculateGoalProgress } from "@/lib/finance/goalProjection";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

interface Goal {
  _id: string; name: string; description: string; targetAmount: number;
  currentAmount: number; targetDate: string; priority: string;
  monthlyContribution: number; status: string; icon: string;
}

const ICONS = ["🎯", "🏦", "🏠", "✈️", "💻", "🚗", "💰", "🎓", "🌟"];

function GoalForm({
  onSubmit, initial, onCancel, loading
}: {
  onSubmit: (d: Omit<Goal, "_id">) => void;
  initial?: Partial<Goal>;
  onCancel?: () => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    targetAmount: initial?.targetAmount?.toString() ?? "",
    currentAmount: initial?.currentAmount?.toString() ?? "0",
    targetDate: initial?.targetDate?.split("T")[0] ?? "2027-01-08",
    priority: initial?.priority ?? "high",
    monthlyContribution: initial?.monthlyContribution?.toString() ?? "",
    status: initial?.status ?? "active",
    icon: initial?.icon ?? "🎯",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.targetAmount || parseFloat(form.targetAmount) <= 0) e.targetAmount = "Target must be positive";
    if (!form.targetDate) e.targetDate = "Target date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: form.name,
      description: form.description,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount),
      targetDate: form.targetDate,
      priority: form.priority,
      monthlyContribution: parseFloat(form.monthlyContribution || "0"),
      status: form.status as Goal["status"],
      icon: form.icon,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 mb-2">
        {ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => set("icon", icon)}
            className={`text-lg p-1.5 rounded-lg transition-all ${form.icon === icon ? "bg-[#2563EB]/30 ring-1 ring-[#2563EB]" : "hover:bg-white/5"}`}
          >
            {icon}
          </button>
        ))}
      </div>
      <div>
        <label className="stat-label block mb-2">GOAL NAME</label>
        <input type="text" className="input-field" placeholder="e.g. Operation ₹80K" value={form.name} onChange={e => set("name", e.target.value)} />
        {errors.name && <div className="text-xs text-[#EF4444] mt-1">{errors.name}</div>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="stat-label block mb-2">TARGET AMOUNT</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
            <input type="number" min="1" className="input-field pl-7" value={form.targetAmount} onChange={e => set("targetAmount", e.target.value)} />
          </div>
          {errors.targetAmount && <div className="text-xs text-[#EF4444] mt-1">{errors.targetAmount}</div>}
        </div>
        <div>
          <label className="stat-label block mb-2">CURRENT AMOUNT</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
            <input type="number" min="0" className="input-field pl-7" value={form.currentAmount} onChange={e => set("currentAmount", e.target.value)} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="stat-label block mb-2">TARGET DATE</label>
          <input type="date" className="input-field" value={form.targetDate} onChange={e => set("targetDate", e.target.value)} />
          {errors.targetDate && <div className="text-xs text-[#EF4444] mt-1">{errors.targetDate}</div>}
        </div>
        <div>
          <label className="stat-label block mb-2">MONTHLY CONTRIBUTION</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
            <input type="number" min="0" className="input-field pl-7" value={form.monthlyContribution} onChange={e => set("monthlyContribution", e.target.value)} />
          </div>
        </div>
      </div>
      <div>
        <label className="stat-label block mb-2">PRIORITY</label>
        <div className="flex gap-2">
          {["high", "medium", "low"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => set("priority", p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.priority === p ? "bg-[#2563EB]/30 border-[#2563EB] text-[#1E3A8A]" : "border-white/10 text-[#64748B]"}`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="stat-label block mb-2">DESCRIPTION (optional)</label>
        <input type="text" className="input-field" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Brief description..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {initial?.name ? "Update Goal" : "Create Goal"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>}
      </div>
    </form>
  );
}

export default function GoalsPage() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { data: goals, mutate } = useSWR<Goal[]>("/api/goals", fetcher);

  const handleAdd = async (data: Omit<Goal, "_id">) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { toast("error", "Failed to create goal"); return; }
      toast("success", "Goal created");
      setShowAdd(false);
      mutate();
    } finally { setSubmitting(false); }
  };

  const handleEdit = async (data: Omit<Goal, "_id">) => {
    if (!editGoal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/goals/${editGoal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { toast("error", "Failed to update"); return; }
      toast("success", "Goal updated");
      setEditGoal(null);
      mutate();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteGoal) return;
    await fetch(`/api/goals/${deleteGoal._id}`, { method: "DELETE" });
    toast("success", "Goal deleted");
    setDeleteGoal(null);
    mutate();
  };

  const handleContribute = async (goal: Goal, amount: number) => {
    const res = await fetch(`/api/goals/${goal._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAmount: goal.currentAmount + amount }),
    });
    if (res.ok) { toast("success", "Contribution recorded"); mutate(); }
  };

  const allGoals = goals ?? [];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#F8FAFC] tracking-wide uppercase">Financial Goals</h1>
          <div className="text-xs text-[#64748B] mt-0.5">{allGoals.length} goals configured</div>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> New Goal
        </button>
      </div>

      {allGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Target size={48} color="#64748B" />
          <div className="text-[#64748B]">No financial goals configured</div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">Create First Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allGoals.map((goal) => {
            const progress = calculateGoalProgress({
              _id: goal._id,
              name: goal.name,
              targetAmount: goal.targetAmount,
              currentAmount: goal.currentAmount,
              targetDate: goal.targetDate,
              monthlyContribution: goal.monthlyContribution,
              status: goal.status,
            });
            const pct = progress.progressPercent;
            const statusColor = progress.status === "AHEAD" || progress.status === "ON_TRACK" ? "#10B981" : progress.status === "BEHIND" ? "#D4AF37" : "#EF4444";

            return (
              <div key={goal._id} className="card hover:border-[#2563EB]/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <div className="font-semibold text-[#F8FAFC]">{goal.name}</div>
                      {goal.description && <div className="text-xs text-[#64748B]">{goal.description}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: `${statusColor}20`, color: statusColor }}>
                      {progress.status.replace("_", " ")}
                    </div>
                    <button onClick={() => setEditGoal(goal)} className="p-1 text-[#64748B] hover:text-[#1E3A8A]"><Edit2 size={12} /></button>
                    <button onClick={() => setDeleteGoal(goal)} className="p-1 text-[#64748B] hover:text-[#EF4444]"><Trash2 size={12} /></button>
                  </div>
                </div>

                {/* Progress */}
                <div className="progress-bar h-2 mb-3">
                  <div className="progress-fill h-2" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${statusColor}, #1E3A8A)` }} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-[10px] text-[#64748B]">Current</div>
                    <div className="font-bold text-[#D4AF37]">{fmt(goal.currentAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#64748B]">Target</div>
                    <div className="font-bold text-[#F8FAFC]">{fmt(goal.targetAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#64748B]">Required/Month</div>
                    <div className="font-bold" style={{ color: statusColor }}>{fmt(progress.requiredMonthly)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#64748B]">Target Date</div>
                    <div className="font-bold text-[#F8FAFC] text-sm">{format(new Date(goal.targetDate), "dd MMM yyyy")}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-[#64748B]">
                  <span>{pct.toFixed(1)}% complete · {fmt(progress.remaining)} remaining</span>
                  <button
                    onClick={() => {
                      const v = prompt("Add contribution amount (₹):");
                      if (v && parseFloat(v) > 0) handleContribute(goal, parseFloat(v));
                    }}
                    className="text-[#1E3A8A] hover:underline text-xs"
                  >
                    + Add Contribution
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="CREATE GOAL">
        <GoalForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} loading={submitting} />
      </Modal>
      {editGoal && (
        <Modal open title="EDIT GOAL" onClose={() => setEditGoal(null)}>
          <GoalForm onSubmit={handleEdit} initial={editGoal} onCancel={() => setEditGoal(null)} loading={submitting} />
        </Modal>
      )}
      <ConfirmDialog
        open={!!deleteGoal} title="Delete Goal"
        message={`Delete goal "${deleteGoal?.name}"?`}
        confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteGoal(null)} danger
      />
    </div>
  );
}
