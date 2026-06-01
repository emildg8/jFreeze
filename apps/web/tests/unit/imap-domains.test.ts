import { describe, expect, it } from "vitest";
import { buildImapFromDomains } from "@/lib/sources/imap-sync";

describe("buildImapFromDomains", () => {
  it("collects domains from enabled stores", () => {
    const domains = buildImapFromDomains({
      ozon: { enabled: true, email: true, sms: true },
      samokat: { enabled: false, email: true, sms: true },
    });
    expect(domains).toContain("ozon.ru");
    expect(domains.some((d) => d.includes("samokat"))).toBe(false);
  });

  it("uses full catalog when nothing enabled (ещё не настроено)", () => {
    const domains = buildImapFromDomains({
      ozon: { enabled: false, email: true, sms: true },
    });
    expect(domains.length).toBeGreaterThan(0);
  });

  it("filters to single enabled store", () => {
    const all = buildImapFromDomains({
      ozon: { enabled: true, email: true, sms: true },
      samokat: { enabled: false, email: true, sms: true },
    });
    expect(all).toContain("ozon.ru");
    expect(all.some((d) => d.includes("samokat"))).toBe(false);
  });
});
