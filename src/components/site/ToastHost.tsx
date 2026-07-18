"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastMsg {
  id: number;
  msg: string;
  type: "default" | "success" | "error";
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        msg: string;
        type?: ToastMsg["type"];
      };
      const id = Date.now() + Math.random();
      setToasts((prev) => [
        ...prev,
        { id, msg: detail.msg, type: detail.type ?? "default" },
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };
    window.addEventListener("nurturee-toast", handler);
    return () => window.removeEventListener("nurturee-toast", handler);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-[60] flex flex-col items-center gap-2 px-4 md:top-16">
      {toasts.map((t) => {
        const Icon =
          t.type === "success"
            ? CheckCircle2
            : t.type === "error"
            ? AlertCircle
            : Info;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border bg-white px-4 py-3 shadow-lg animate-fade-in-up",
              t.type === "success" && "border-emerald-200",
              t.type === "error" && "border-rose-200",
              t.type === "default" && "border-border"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-5 shrink-0",
                t.type === "success" && "text-emerald-600",
                t.type === "error" && "text-rose-600",
                t.type === "default" && "text-blue-600"
              )}
            />
            <p className="flex-1 text-sm text-slate-800">{t.msg}</p>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
              className="text-slate-400 hover:text-slate-700"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
