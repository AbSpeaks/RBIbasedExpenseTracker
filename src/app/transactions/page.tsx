"use client";
import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Plus, Search, Filter, Edit2, Trash2, X, Check, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { TableRowSkeleton } from "@/components/ui/Skeleton";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

type TransactionType = "EXPENSE" | "INCOME" | "RESERVE_TRANSFER";

interface Ministry {
  _id: string; name: string; icon: string; color: string;
}

interface Transaction {
  _id: string;
  amount: number;
  type: TransactionType;
  ministryId?: { _id: string; name: string; icon: string } | null;
  description: string;
  notes: string;
  date: string;
}

interface FormData {
  amount: string;
  type: TransactionType;
  ministryId: string;
  description: string;
  notes: string;
  date: string;
}

const EMPTY_FORM: FormData = {
  amount: "",
  type: "EXPENSE",
  ministryId: "",
  description: "",
  notes: "",
  date: new Date().toISOString().split("T")[0],
};

function TransactionForm({
  onSubmit, initial, ministries, loading, onCancel,
}: {
  onSubmit: (d: FormData) => void;
  initial?: FormData;
  ministries: Ministry[];
  loading?: boolean;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormData>(initial ?? EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof FormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = "Amount must be positive";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.date) e.date = "Date is required";
    if (form.type === "EXPENSE" && !form.ministryId) e.ministryId = "Ministry is required for expenses";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  };

  const typeColors: Record<TransactionType, string> = {
    EXPENSE: "#EF4444", INCOME: "#10B981", RESERVE_TRANSFER: "#D4AF37"
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="stat-label block mb-2">TRANSACTION TYPE</label>
        <div className="grid grid-cols-3 gap-2">
          {(["EXPENSE", "INCOME", "RESERVE_TRANSFER"] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("type", t)}
              className="py-2 px-3 rounded-lg text-xs font-semibold border transition-all"
              style={{
                background: form.type === t ? `${typeColors[t]}20` : "transparent",
                borderColor: form.type === t ? typeColors[t] : "rgba(255,255,255,0.1)",
                color: form.type === t ? typeColors[t] : "#94A3B8",
              }}
            >
              {t === "RESERVE_TRANSFER" ? "RESERVE" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="stat-label block mb-2">AMOUNT (₹)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] font-semibold">₹</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className="input-field pl-7"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />
        </div>
        {errors.amount && <div className="text-xs text-[#EF4444] mt-1">{errors.amount}</div>}
      </div>

      {/* Description */}
      <div>
        <label className="stat-label block mb-2">DESCRIPTION</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Dinner at restaurant"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
        {errors.description && <div className="text-xs text-[#EF4444] mt-1">{errors.description}</div>}
      </div>

      {/* Ministry (only for expense/reserve) */}
      {(form.type === "EXPENSE" || form.type === "RESERVE_TRANSFER") && (
        <div>
          <label className="stat-label block mb-2">MINISTRY</label>
          <select
            className="input-field"
            value={form.ministryId}
            onChange={(e) => set("ministryId", e.target.value)}
          >
            <option value="">— Select Ministry —</option>
            {ministries.map((m) => (
              <option key={m._id} value={m._id}>{m.icon} {m.name}</option>
            ))}
          </select>
          {errors.ministryId && <div className="text-xs text-[#EF4444] mt-1">{errors.ministryId}</div>}
        </div>
      )}

      {/* Date */}
      <div>
        <label className="stat-label block mb-2">DATE</label>
        <input
          type="date"
          className="input-field"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
        />
        {errors.date && <div className="text-xs text-[#EF4444] mt-1">{errors.date}</div>}
      </div>

      {/* Notes */}
      <div>
        <label className="stat-label block mb-2">NOTES (optional)</label>
        <input
          type="text"
          className="input-field"
          placeholder="Additional notes..."
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
          {initial ? "Update Transaction" : "Add Transaction"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>}
      </div>
    </form>
  );
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState(format(new Date(), "yyyy-MM"));
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const params = new URLSearchParams({
    page: page.toString(),
    limit: "30",
    ...(search && { search }),
    ...(typeFilter && { type: typeFilter }),
    ...(ministryFilter && { ministryId: ministryFilter }),
    ...(monthFilter && { month: monthFilter }),
  });

  const { data, isLoading, mutate } = useSWR(`/api/transactions?${params}`, fetcher);
  const { data: ministriesData } = useSWR<Ministry[]>("/api/ministries", fetcher);
  const ministries = ministriesData ?? [];

  const handleAdd = async (form: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          type: form.type,
          ministryId: form.ministryId || null,
          description: form.description,
          notes: form.notes,
          date: form.date,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        toast("error", e.error ?? "Failed to add transaction");
        return;
      }
      toast("success", "Transaction added successfully");
      setShowAddModal(false);
      mutate();
    } catch {
      toast("error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (form: FormData) => {
    if (!editTx) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${editTx._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          type: form.type,
          ministryId: form.ministryId || null,
          description: form.description,
          notes: form.notes,
          date: form.date,
        }),
      });
      if (!res.ok) { toast("error", "Failed to update"); return; }
      toast("success", "Transaction updated");
      setEditTx(null);
      mutate();
    } catch {
      toast("error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTx) return;
    try {
      await fetch(`/api/transactions/${deleteTx._id}`, { method: "DELETE" });
      toast("success", "Transaction deleted");
      setDeleteTx(null);
      mutate();
    } catch {
      toast("error", "Failed to delete");
    }
  };

  const transactions: Transaction[] = data?.transactions ?? [];
  const total: number = data?.total ?? 0;
  const pages: number = data?.pages ?? 1;

  const typeColor = (type: string) =>
    type === "INCOME" ? "#10B981" : type === "RESERVE_TRANSFER" ? "#D4AF37" : "#EF4444";

  // Month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  });

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#F8FAFC] tracking-wide uppercase">Transactions</h1>
          <div className="text-xs text-[#64748B] mt-0.5">{total} records</div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              className="input-field pl-8 text-sm"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input-field text-sm"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="RESERVE_TRANSFER">Reserve</option>
          </select>
          <select
            className="input-field text-sm"
            value={ministryFilter}
            onChange={(e) => { setMinistryFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Ministries</option>
            {ministries.map((m) => (
              <option key={m._id} value={m._id}>{m.icon} {m.name}</option>
            ))}
          </select>
          <select
            className="input-field text-sm"
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Months</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Ministry</th>
                <th>Type</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(8).fill(0).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-[#64748B]">
                    <div className="flex flex-col items-center gap-3">
                      <Filter size={32} />
                      <div>No transactions found</div>
                      <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs mt-2">
                        + Add Transaction
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id}>
                    <td className="text-[11px] whitespace-nowrap">{format(new Date(t.date), "dd MMM yyyy")}</td>
                    <td>
                      <div className="text-[#F8FAFC] text-sm">{t.description}</div>
                      {t.notes && <div className="text-[10px] text-[#64748B]">{t.notes}</div>}
                    </td>
                    <td>
                      {t.ministryId ? (
                        <span className="text-xs">{t.ministryId.icon} {t.ministryId.name}</span>
                      ) : (
                        <span className="text-[#64748B] text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          background: `${typeColor(t.type)}15`,
                          color: typeColor(t.type),
                          border: `1px solid ${typeColor(t.type)}30`,
                        }}
                      >
                        {t.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="text-right font-mono font-semibold" style={{ color: typeColor(t.type) }}>
                      {t.type === "INCOME" ? "+" : "-"}{fmt(t.amount)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditTx(t)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/10 transition-all"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTx(t)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs text-[#64748B]">Page {page} of {pages}</div>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-xs px-3 py-1.5">Prev</button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-ghost text-xs px-3 py-1.5">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="ADD TRANSACTION">
        <TransactionForm
          onSubmit={handleAdd}
          ministries={ministries}
          loading={submitting}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editTx && (
        <Modal open={true} onClose={() => setEditTx(null)} title="EDIT TRANSACTION">
          <TransactionForm
            onSubmit={handleEdit}
            initial={{
              amount: editTx.amount.toString(),
              type: editTx.type,
              ministryId: editTx.ministryId?._id ?? "",
              description: editTx.description,
              notes: editTx.notes,
              date: editTx.date.split("T")[0],
            }}
            ministries={ministries}
            loading={submitting}
            onCancel={() => setEditTx(null)}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTx}
        title="Delete Transaction"
        message={`Delete "${deleteTx?.description}" (${deleteTx ? fmt(deleteTx.amount) : ""})? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTx(null)}
        danger
      />
    </div>
  );
}
