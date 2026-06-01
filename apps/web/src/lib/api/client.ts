import { resolveApiUrl } from "./base-url";
import { friendlyApiMessage } from "./user-messages";

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
  let res: Response;
  try {
    res = await fetch(resolveApiUrl(url), init);
  } catch {
    throw new ApiError(friendlyApiMessage(0), 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const serverMsg = (data as { error?: string }).error;
    throw new ApiError(friendlyApiMessage(res.status, serverMsg), res.status);
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
