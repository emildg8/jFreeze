import { describe, expect, it } from "vitest";
import {
  parseFridgeModel,
  encodeFridgeModel,
  buildFridgeVisionContext,
} from "@/lib/fridge/fridge-model";

describe("parseFridgeModel", () => {
  it("parses preset id", () => {
    const m = parseFridgeModel("preset:top-freezer");
    expect(m.presetId).toBe("top-freezer");
    expect(m.layoutType).toBe("top-freezer");
    expect(m.label).toContain("морозилка");
  });

  it("parses custom model", () => {
    const m = parseFridgeModel("custom:Samsung RB37");
    expect(m.customName).toBe("Samsung RB37");
    expect(m.label).toBe("Samsung RB37");
  });

  it("encode roundtrip", () => {
    expect(encodeFridgeModel("side-by-side", null)).toBe("preset:side-by-side");
    expect(encodeFridgeModel(null, "LG GA")).toBe("custom:LG GA");
  });
});

describe("buildFridgeVisionContext", () => {
  it("includes model in prompt", () => {
    const ctx = buildFridgeVisionContext("preset:bottom-freezer");
    expect(ctx.promptExtra).toContain("Морозилка снизу");
    expect(ctx.model.layoutType).toBe("bottom-freezer");
  });
});
