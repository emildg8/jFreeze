"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Chip } from "./ui/Chip";

interface Store {
  id: string;
  displayName: string;
  availability: string;
  label?: string;
}

export function StoreChips() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    apiFetch<{ stores: Store[] }>("/api/stores")
      .then((d) => setStores(d.stores ?? []))
      .catch(() => setStores([]));
  }, []);

  if (stores.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {stores.map((s) => (
        <Chip key={s.id} active={s.availability === "active"}>
          {s.availability === "active" ? "●" : s.availability === "beta" ? "β" : "○"}{" "}
          {s.label ?? s.displayName}
        </Chip>
      ))}
    </div>
  );
}
