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
  const res = await fetch(url, init);
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

export async function importOrders(body: Record<string, unknown>) {
  return apiFetch<{ imported: number; message?: string }>("/api/orders/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
