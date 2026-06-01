import { useEffect, useState } from "react";

type LinkedAccount = {
  providers: string[];
  phone: string | null;
};

export function useLinkedAccount(fallbackPhone?: string | null) {
  const [data, setData] = useState<LinkedAccount | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/linked")
      .then((r) => {
        if (!r.ok) throw new Error("load failed");
        return r.json();
      })
      .then((d: { providers?: string[]; phone?: string | null }) => {
        setData({
          providers: d.providers ?? [],
          phone: d.phone ?? fallbackPhone ?? null,
        });
      })
      .catch(() => {
        setError(true);
        setData({ providers: [], phone: fallbackPhone ?? null });
      });
  }, [fallbackPhone]);

  return {
    providers: data?.providers ?? null,
    phone: data?.phone ?? fallbackPhone ?? null,
    loading: data === null && !error,
    error,
  };
}
