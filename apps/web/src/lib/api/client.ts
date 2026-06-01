import { resolveApiUrl } from "./base-url";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(resolveApiUrl(url), init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error ?? `Ошибка ${res.status}`,
      res.status,
    );
  }
  return data as T;
}

export async function refreshCart(): Promise<void> {
  await apiFetch("/api/cart", { method: "POST" });
}

/** fetch с учётом базового URL (Capacitor, multipart). */
export function apiFetchRaw(url: string, init?: RequestInit) {
  return fetch(resolveApiUrl(url), init);
}

export async function importOrders(body: Record<string, unknown>) {
  return apiFetch<{ imported: number; message?: string }>("/api/orders/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
