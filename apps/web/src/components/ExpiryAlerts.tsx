"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "./ui/Card";
import { apiFetch } from "@/lib/api/client";

interface Alert {
  id: string;
  name: string;
  urgency: string;
  daysLeft: number;
}

const urgencyLabel: Record<string, string> = {
  expired: "просрочено",
  today: "сегодня",
  soon: "скоро",
};

const urgencyStyle: Record<string, string> = {
  expired: "border-red-200 bg-red-50 text-red-950",
  today: "border-amber-200 bg-amber-50 text-amber-950",
  soon: "border-yellow-200 bg-yellow-50/80 text-yellow-950",
};

export function ExpiryAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    apiFetch<{ alerts: Alert[] }>("/api/expiry?days=7")
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => setAlerts([]));
  }, []);

  if (alerts.length === 0) return null;

  return (
    <Card className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Срок годности</h2>
        <Link href="/fridge" className="text-xs font-medium text-sky-600">
          Открыть →
        </Link>
      </div>
      <ul className="space-y-2">
        {alerts.slice(0, 5).map((a) => (
          <li
            key={a.id}
            className={`rounded-lg border px-3 py-2 text-sm ${urgencyStyle[a.urgency] ?? ""}`}
          >
            <span className="font-medium">{a.name}</span>
            <span className="ml-2 opacity-80">
              {urgencyLabel[a.urgency] ??
                (a.daysLeft <= 0 ? "просрочено" : `через ${a.daysLeft} дн.`)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
