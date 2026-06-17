"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  addToast: () => undefined,
});

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: <CheckCircle size={16} color="#B4F24A" />,
  error: <XCircle size={16} color="#EF4444" />,
  info: <Info size={16} color="#F28C28" />,
  warning: <AlertTriangle size={16} color="#F59E0B" />,
};

const BORDERS = {
  success: "rgba(180,242,74,0.5)",
  error: "rgba(239,68,68,0.5)",
  info: "rgba(245,140,40,0.5)",
  warning: "rgba(245,158,11,0.5)",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: "fixed", bottom: 24, right: 24,
        display: "flex", flexDirection: "column", gap: 8,
        zIndex: 9999, pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: "rgba(18,18,18,0.95)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: `1px solid rgba(255,255,255,0.08)`,
            borderLeft: `3px solid ${BORDERS[t.type]}`,
            borderRadius: 10, padding: "12px 16px",
            minWidth: 280, maxWidth: 360,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            pointerEvents: "all",
            animation: "slideIn 0.2s ease",
            fontFamily: "Inter, sans-serif",
          }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}>{ICONS[t.type]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#F1F1F1" }}>{t.title}</div>
              {t.message && <div style={{ fontSize: 12, color: "#8A8A8A", marginTop: 2 }}>{t.message}</div>}
            </div>
            <button onClick={() => removeToast(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: 2, flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </ToastContext.Provider>
  );
}

// Keep backward compat
export const ToastContainer = () => null;
export const toast = {
  success: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warning: () => undefined,
};
