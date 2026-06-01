import { describe, expect, it } from "vitest";
import {
  formatImapError,
  imapSinceDate,
  shouldImportForConnections,
} from "@/lib/sources/imap-sync";
import type { ParsedSourceImport } from "@/lib/sources/types";

describe("imapSinceDate", () => {
  it("returns date in the past", () => {
    const since = imapSinceDate(7);
    const diff = Date.now() - since.getTime();
    expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(8 * 24 * 60 * 60 * 1000);
  });
});

describe("formatImapError", () => {
  it("maps auth errors", () => {
    expect(formatImapError(new Error("AUTHENTICATIONFAILED"))).toContain("войти");
  });
});

describe("shouldImportForConnections", () => {
  const parsed: ParsedSourceImport = {
    storeId: "ozon",
    storeName: "Озон",
    channel: "email",
    confidence: "high",
    orders: [{ externalId: "1", orderedAt: new Date(), items: [] }],
  };

  it("skips disabled store", () => {
    expect(
      shouldImportForConnections(parsed, {
        ozon: { enabled: false, email: true, sms: true },
      }),
    ).toBe(false);
  });

  it("imports enabled store", () => {
    expect(
      shouldImportForConnections(parsed, {
        ozon: { enabled: true, email: true, sms: true },
      }),
    ).toBe(true);
  });
});
