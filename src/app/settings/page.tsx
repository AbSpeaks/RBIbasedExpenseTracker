"use client";
import { useState } from "react";
import useSWR from "swr";
import { useToast } from "@/components/ui/Toast";
import { Shield, Users, ToggleLeft, ToggleRight, Save, AlertTriangle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: user, mutate: mutateUser } = useSWR("/api/user", fetcher);
  const { data: policy, mutate: mutatePolicy } = useSWR("/api/policies", fetcher);
  const { data: networth, mutate: mutateNW } = useSWR("/api/networth", fetcher);
  const [seedConfirm, setSeedConfirm] = useState(false);

  const [userForm, setUserForm] = useState<Record<string, string | boolean>>({});
  const [policyForm, setPolicyForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const uv = { ...user, ...userForm };
  const pv = { ...policy, ...policyForm };

  const setU = (k: string, v: string | boolean) => setUserForm((p) => ({ ...p, [k]: v }));
  const setP = (k: string, v: string) => setPolicyForm((p) => ({ ...p, [k]: v }));

  const saveUser = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, ...userForm }),
      });
      if (res.ok) { toast("success", "Profile saved"); setUserForm({}); mutateUser(); }
      else toast("error", "Failed to save");
    } finally { setSaving(false); }
  };

  const savePolicy = async () => {
    setSaving(true);
    try {
      const updates: Record<string, number | boolean> = {};
      Object.entries(policyForm).forEach(([k, v]) => { updates[k] = parseFloat(v); });
      const res = await fetch("/api/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...policy, ...updates }),
      });
      if (res.ok) { toast("success", "Policy saved"); setPolicyForm({}); mutatePolicy(); }
      else toast("error", "Failed to save");
    } finally { setSaving(false); }
  };

  const handleSeed = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const d = await res.json();
      if (res.ok) { toast("success", `Database seeded: ${d.transactions} transactions, ${d.ministries} ministries`); setSeedConfirm(false); }
      else toast("error", d.error ?? "Seed failed");
    } catch { toast("error", "Seed failed"); }
  };

  const handleExport = () => { window.location.href = "/api/backup"; };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (res.ok) toast("success", "Data imported successfully");
      else toast("error", "Import failed");
    } catch { toast("error", "Invalid backup file"); }
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-[#F8FAFC] tracking-wide uppercase">Settings</h1>
        <div className="text-xs text-[#64748B] mt-0.5">Configure your financial operating system</div>
      </div>

      {/* User Profile */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} color="#1E3A8A" />
          <span className="stat-label">USER PROFILE</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="stat-label block mb-2">NAME</label>
            <input type="text" className="input-field" value={uv.name as string ?? ""} onChange={e => setU("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="stat-label block mb-2">MONTHLY INCOME</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
                <input type="number" className="input-field pl-7" value={uv.monthlyIncome as number ?? 32000} onChange={e => setU("monthlyIncome", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="stat-label block mb-2">LOW INCOME AMOUNT</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
                <input type="number" className="input-field pl-7" value={uv.lowIncomeAmount as number ?? 25000} onChange={e => setU("lowIncomeAmount", e.target.value)} />
              </div>
            </div>
          </div>
          <div>
            <label className="stat-label block mb-2">RESERVE BALANCE</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
              <input type="number" className="input-field pl-7" value={uv.reserveBalance as number ?? 18000} onChange={e => setU("reserveBalance", e.target.value)} />
            </div>
          </div>

          {/* Low income mode toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#102B43" }}>
            <div>
              <div className="text-sm font-semibold text-[#F8FAFC]">Low-Income Mode</div>
              <div className="text-xs text-[#64748B] mt-0.5">Switch to ₹{fmt(uv.lowIncomeAmount as number ?? 25000)} income scenario</div>
            </div>
            <button onClick={() => setU("lowIncomeMode", !uv.lowIncomeMode)} className="text-[#1E3A8A]">
              {uv.lowIncomeMode ? <ToggleRight size={32} color="#1E3A8A" /> : <ToggleLeft size={32} color="#64748B" />}
            </button>
          </div>
          {uv.lowIncomeMode && (
            <div className="badge-watch text-xs">⚠️ LOW-INCOME FISCAL POLICY ACTIVE — budgets recalculated to ₹{fmt(uv.lowIncomeAmount as number)}</div>
          )}

          <button onClick={saveUser} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={14} /> Save Profile
          </button>
        </div>
      </div>

      {/* Financial Policy */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} color="#D4AF37" />
          <span className="stat-label">TREASURY POLICIES</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "reserveTarget", label: "Reserve Target" },
            { key: "minimumSavingsRate", label: "Min Savings Rate (%)" },
            { key: "minimumEmergencyReserve", label: "Emergency Reserve" },
            { key: "monthlyReserveContribution", label: "Monthly Reserve Contribution" },
            { key: "foodLimit", label: "Food Budget Limit" },
            { key: "entertainmentLimit", label: "Entertainment Limit" },
            { key: "startupLimit", label: "Startup Limit" },
            { key: "maxDailySpend", label: "Max Daily Spend" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="stat-label block mb-2">{label.toUpperCase()}</label>
              <div className="relative">
                {!label.includes("%") && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>}
                <input
                  type="number"
                  className={`input-field ${!label.includes("%") ? "pl-7" : ""}`}
                  value={policyForm[key] ?? (policy?.[key] ?? "")}
                  onChange={e => setP(key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
        <button onClick={savePolicy} disabled={saving} className="btn-primary flex items-center gap-2 mt-4">
          <Save size={14} /> Save Policies
        </button>
      </div>

      {/* Data Management */}
      <div className="card">
        <div className="stat-label mb-4">DATA MANAGEMENT</div>
        <div className="space-y-3">
          <button onClick={handleExport} className="btn-ghost w-full text-left flex items-center gap-3">
            <span>📥</span> Export All Data (JSON Backup)
          </button>
          <label className="btn-ghost w-full text-left flex items-center gap-3 cursor-pointer">
            <span>📤</span> Import Data from Backup
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <div className="divider" />
          {!seedConfirm ? (
            <button onClick={() => setSeedConfirm(true)} className="btn-ghost w-full text-left flex items-center gap-3 text-[#D4AF37]">
              <AlertTriangle size={14} /> Reseed Database with Sample Data
            </button>
          ) : (
            <div className="px-4 py-3 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/05">
              <div className="text-xs text-[#EF4444] mb-3 font-semibold">⚠️ This will DELETE all existing data and reseed with sample data!</div>
              <div className="flex gap-3">
                <button onClick={handleSeed} className="btn-danger text-sm">Confirm Reseed</button>
                <button onClick={() => setSeedConfirm(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
