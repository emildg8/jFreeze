import { useEffect, useState } from "react";
import {
  defaultAuthTab,
  type AuthProvidersStatus,
  type LoginTab,
} from "@/lib/auth/providers";

const DEFAULT: AuthProvidersStatus = {
  phone: true,
  email: false,
  google: false,
  apple: false,
};

export function useAuthProviders() {
  const [providers, setProviders] = useState<AuthProvidersStatus>(DEFAULT);
  const [tab, setTab] = useState<LoginTab>("phone");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((d: { providers?: AuthProvidersStatus }) => {
        const next = d.providers ?? DEFAULT;
        setProviders(next);
        setTab(defaultAuthTab(next));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return { providers, tab, setTab, loading };
}
