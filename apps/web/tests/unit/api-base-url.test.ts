import { describe, expect, it } from "vitest";
import { resolveApiUrl } from "@/lib/api/base-url";

describe("resolveApiUrl", () => {
  it("keeps absolute urls", () => {
    expect(resolveApiUrl("https://example.com/x")).toBe("https://example.com/x");
  });

  it("prepends base when set via env", () => {
    const prev = process.env.NEXT_PUBLIC_API_BASE;
    process.env.NEXT_PUBLIC_API_BASE = "http://192.168.1.5:3000";
    expect(resolveApiUrl("/api/health")).toBe("http://192.168.1.5:3000/api/health");
    process.env.NEXT_PUBLIC_API_BASE = prev;
  });
});
