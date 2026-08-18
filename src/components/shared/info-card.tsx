"use client";

import { ReactNode } from "react";

interface InfoCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}

export default function InfoCard({ icon, label, value, mono }: InfoCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">
          {label}
        </p>
        <p className={`text-sm font-medium text-slate-800 mt-1 truncate ${mono ? "font-mono" : ""}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
