const STORAGE_KEY = "jfreeze_api_base";

/** Базовый URL API (для Capacitor / удалённого сервера). Пусто = тот же origin. */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY)?.trim();
    if (stored) return stored.replace(/\/$/, "");
  }
  const env = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (env) return env.replace(/\/$/, "");
  return "";
}

export function setApiBase(url: string) {
  if (typeof window === "undefined") return;
  const clean = url.trim().replace(/\/$/, "");
  if (clean) localStorage.setItem(STORAGE_KEY, clean);
  else localStorage.removeItem(STORAGE_KEY);
}

export function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getApiBase();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function checkApiHealth(base?: string): Promise<boolean> {
  try {
    const testUrl = base
      ? `${base.replace(/\/$/, "")}/api/health`
      : resolveApiUrl("/api/health");
    const res = await fetch(testUrl, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean((data as { ok?: boolean }).ok);
  } catch {
    return false;
  }
}
