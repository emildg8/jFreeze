import { describe, expect, it } from "vitest";
import { validateFridgeImage } from "@/lib/fridge/image-utils";
import { getDemoVisionItems } from "@/lib/fridge/demo-items";

describe("validateFridgeImage", () => {
  it("rejects oversized buffer", () => {
    const big = Buffer.alloc(9 * 1024 * 1024);
    const r = validateFridgeImage(big, "x.jpg");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("8 МБ");
  });

  it("accepts jpeg", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff]);
    const r = validateFridgeImage(buf, "photo.JPG");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ext).toBe(".jpg");
  });
});

describe("getDemoVisionItems", () => {
  it("returns freezer items", () => {
    const items = getDemoVisionItems("freezer");
    expect(items.some((i) => i.name.includes("Пельмени"))).toBe(true);
  });
});
