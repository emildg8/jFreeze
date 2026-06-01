import { describe, expect, it } from "vitest";
import { formatRelativeRu } from "@/lib/format/relative-time";

describe("formatRelativeRu", () => {
  const now = new Date("2026-06-01T12:00:00");

  it("formats minutes", () => {
    const d = new Date("2026-06-01T11:50:00");
    expect(formatRelativeRu(d, now)).toBe("10 мин. назад");
  });

  it("formats yesterday", () => {
    const d = new Date("2026-05-31T12:00:00");
    expect(formatRelativeRu(d, now)).toBe("вчера");
  });
});
