"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const icons = {
    success: <CheckCircle size={16} color="#10B981" />,
    error: <XCircle size={16} color="#EF4444" />,
    warning: <AlertTriangle size={16} color="#D4AF37" />,
    info: <Info size={16} color="#1E3A8A" />,
  };

  const colors = {
    success: "border-[#10B981]/30 bg-[#071A2B]",
    error: "border-[#EF4444]/30 bg-[#071A2B]",
    warning: "border-[#D4AF37]/30 bg-[#071A2B]",
    info: "border-[#1E3A8A]/30 bg-[#071A2B]",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl animate-slide-up min-w-[260px] ${colors[t.type]}`}
          >
            {icons[t.type]}
            <span className="text-sm text-[#F8FAFC] flex-1">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-[#64748B] hover:text-[#F8FAFC] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
