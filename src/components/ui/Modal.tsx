"use client";
import { ReactNode } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  onConfirm, onCancel, danger = false,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${danger ? "bg-[#EF4444]/15" : "bg-[#2563EB]/15"}`}>
            <AlertTriangle size={20} color={danger ? "#EF4444" : "#1E3A8A"} />
          </div>
          <h3 className="text-base font-semibold text-[#F8FAFC]">{title}</h3>
        </div>
        <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost text-sm">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={danger ? "btn-danger" : "btn-primary"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "480px" }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-[#F8FAFC] tracking-wide uppercase">{title}</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#F8FAFC] transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
