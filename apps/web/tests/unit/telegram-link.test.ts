import { describe, expect, it } from "vitest";

function parseCommand(text: string): { cmd: string; args: string } {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return { cmd: "", args: "" };
  const [first, ...rest] = trimmed.split(/\s+/);
  const cmd = first.split("@")[0].toLowerCase();
  return { cmd, args: rest.join(" ").trim() };
}

describe("telegram commands", () => {
  it("parses link with code", () => {
    const p = parseCommand("/link AB12CD");
    expect(p.cmd).toBe("/link");
    expect(p.args).toBe("AB12CD");
  });

  it("strips bot suffix", () => {
    const p = parseCommand("/help@MyJfreezeBot");
    expect(p.cmd).toBe("/help");
  });
});
