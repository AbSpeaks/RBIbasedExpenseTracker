"use client";
import useSWR from "swr";
import { format } from "date-fns";
import { Activity, AlertTriangle, CheckCircle, Cpu } from "lucide-react";
import type { ReactNode } from "react";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("API Error"); return r.json(); });
const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

type AlertSeverity = "RED" | "YELLOW" | "GREEN" | "BLUE";

interface Alert {
  id: string; severity: AlertSeverity; title: string; message: string; actionable?: string;
}
interface Recommendation {
  id: string; priority: number; text: string; impact: "HIGH" | "MEDIUM" | "LOW";
}

export default function IntelligencePage() {
  const { data: dash, isLoading } = useSWR("/api/dashboard", fetcher, { refreshInterval: 60000 });

  const alerts: Alert[] = dash?.alerts ?? [];
  const recommendations: Recommendation[] = dash?.recommendations ?? [];
  const health = dash?.fiscalHealth;
  const treasury = dash?.treasuryStatus;

  const severityIcon: Record<AlertSeverity, ReactNode> = {
    RED: <AlertTriangle size={14} color="#EF4444" />,
    YELLOW: <AlertTriangle size={14} color="#D4AF37" />,
    GREEN: <CheckCircle size={14} color="#10B981" />,
    BLUE: <Activity size={14} color="#1E3A8A" />,
  };

  const severityColors: Record<AlertSeverity, { border: string; bg: string; title: string }> = {
    RED: { border: "rgba(255,107,107,0.3)", bg: "rgba(255,107,107,0.05)", title: "#EF4444" },
    YELLOW: { border: "rgba(245,196,81,0.3)", bg: "rgba(245,196,81,0.05)", title: "#D4AF37" },
    GREEN: { border: "rgba(61,220,151,0.3)", bg: "rgba(61,220,151,0.05)", title: "#10B981" },
    BLUE: { border: "rgba(50,197,255,0.3)", bg: "rgba(50,197,255,0.05)", title: "#1E3A8A" },
  };

  const impactColor = { HIGH: "#EF4444", MEDIUM: "#D4AF37", LOW: "#10B981" };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Cpu size={20} color="#1E3A8A" />
        <div>
          <h1 className="text-lg font-bold text-[#F8FAFC] tracking-wide uppercase">Financial Intelligence</h1>
          <div className="text-xs text-[#64748B] mt-0.5">Rule-based analysis · Updated {format(new Date(), "HH:mm")}</div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card text-center">
          <div className="stat-label mb-1">TOTAL ALERTS</div>
          <div className="text-2xl font-mono font-bold text-[#F8FAFC]">{alerts.length}</div>
        </div>
        <div className="card text-center">
          <div className="stat-label mb-1">CRITICAL</div>
          <div className="text-2xl font-mono font-bold text-[#EF4444]">{alerts.filter(a => a.severity === "RED").length}</div>
        </div>
        <div className="card text-center">
          <div className="stat-label mb-1">WARNINGS</div>
          <div className="text-2xl font-mono font-bold text-[#D4AF37]">{alerts.filter(a => a.severity === "YELLOW").length}</div>
        </div>
        <div className="card text-center">
          <div className="stat-label mb-1">HEALTH SCORE</div>
          <div className="text-2xl font-mono font-bold" style={{
            color: health?.level === "EXCELLENT" ? "#10B981" : health?.level === "GOOD" ? "#1E3A8A" : health?.level === "WARNING" ? "#D4AF37" : "#EF4444"
          }}>
            {health?.total ?? "—"}/100
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div>
        <div className="stat-label mb-3">TREASURY ALERTS</div>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="card text-center py-8">
              <CheckCircle size={32} color="#10B981" className="mx-auto mb-3" />
              <div className="text-[#10B981] font-semibold">No active alerts</div>
              <div className="text-xs text-[#64748B] mt-1">All financial metrics are within acceptable parameters</div>
            </div>
          ) : (
            // Sort: RED first, then YELLOW, then GREEN/BLUE
            [...alerts]
              .sort((a, b) => {
                const order: Record<AlertSeverity, number> = { RED: 0, YELLOW: 1, BLUE: 2, GREEN: 3 };
                return order[a.severity] - order[b.severity];
              })
              .map((alert) => {
                const c = severityColors[alert.severity];
                return (
                  <div
                    key={alert.id}
                    className="px-4 py-4 rounded-xl border"
                    style={{ background: c.bg, borderColor: c.border }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {severityIcon[alert.severity]}
                      <span className="text-sm font-semibold" style={{ color: c.title }}>{alert.title}</span>
                    </div>
                    <p className="text-sm text-[#94A3B8] leading-relaxed mb-2">{alert.message}</p>
                    {alert.actionable && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: c.title, opacity: 0.8 }}>
                        <span>→</span>
                        <span>{alert.actionable}</span>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div className="stat-label mb-3">ACTIONABLE RECOMMENDATIONS</div>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={rec.id} className="card flex gap-4">
              <div className="flex-shrink-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: `${impactColor[rec.impact]}20`, color: impactColor[rec.impact] }}
                >
                  {i + 1}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{
                    background: `${impactColor[rec.impact]}20`, color: impactColor[rec.impact]
                  }}>
                    {rec.impact} IMPACT
                  </span>
                </div>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{rec.text}</p>
              </div>
            </div>
          ))}
          {recommendations.length === 0 && (
            <div className="card text-center py-8 text-[#64748B] text-sm">No recommendations at this time</div>
          )}
        </div>
      </div>

      {/* Component Health Breakdown */}
      {health && (
        <div className="card">
          <div className="stat-label mb-4">FISCAL HEALTH BREAKDOWN</div>
          <div className="space-y-3">
            {Object.entries(health.components).map(([key, value]) => {
              const labels: Record<string, { label: string; max: number; desc: string }> = {
                savingsRate: { label: "Savings Rate", max: 25, desc: "How much of income you save monthly" },
                budgetControl: { label: "Budget Control", max: 25, desc: "Spending pace vs month progress" },
                emergencyReserve: { label: "Emergency Reserve", max: 20, desc: "Reserve fund health vs minimum policy" },
                debtBurden: { label: "Debt Burden", max: 10, desc: "EMI as percentage of income" },
                discretionarySpending: { label: "Discretionary", max: 10, desc: "Entertainment and shopping control" },
                goalProgress: { label: "Goal Progress", max: 10, desc: "Primary financial goal trajectory" },
              };
              const info = labels[key];
              if (!info) return null;
              const pct = (Number(value) / info.max) * 100;
              const color = pct >= 70 ? "#10B981" : pct >= 40 ? "#D4AF37" : "#EF4444";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm text-[#F8FAFC] font-medium">{info.label}</span>
                      <span className="text-[10px] text-[#64748B] ml-2">{info.desc}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold" style={{ color }}>
                      {Number(value)}/{info.max}
                    </span>
                  </div>
                  <div className="progress-bar h-2">
                    <div className="progress-fill h-2" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
