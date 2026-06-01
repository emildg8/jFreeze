import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/auth/safe-callback";
import { authErrorMessage } from "@/lib/auth/errors";
import { parseOtpCooldownSec } from "@/lib/auth/phone-normalize";
import { buildLoginTabOptions, resolveLoginTab } from "@/lib/auth/providers";
import {
  accountDisplayName,
  formatAccountPhone,
  mapDbUserToAuth,
  profileInitials,
} from "@/lib/auth/profile";
import {
  formatPhoneInput,
  isPhoneComplete,
  normalizePhone,
} from "@/lib/auth/phone-normalize";

describe("normalizePhone", () => {
  it("accepts 10-digit RU mobile", () => {
    expect(normalizePhone("9001234567")).toBe("+79001234567");
  });

  it("accepts 8-prefix", () => {
    expect(normalizePhone("89001234567")).toBe("+79001234567");
  });

  it("rejects too short", () => {
    expect(normalizePhone("12345")).toBeNull();
  });
});

describe("formatPhoneInput", () => {
  it("formats partial RU number", () => {
    expect(formatPhoneInput("7900123")).toBe("+7 900 123");
  });
});

describe("isPhoneComplete", () => {
  it("true for full RU number", () => {
    expect(isPhoneComplete("+7 900 123-45-67")).toBe(true);
  });
});

describe("parseOtpCooldownSec", () => {
  it("extracts seconds from wait message", () => {
    expect(parseOtpCooldownSec("Подождите 42 сек.")).toBe(42);
  });
});

describe("safeCallbackUrl", () => {
  it("blocks external redirects", () => {
    expect(safeCallbackUrl("https://evil.test")).toBe("/account");
  });
});

describe("authErrorMessage", () => {
  it("maps known codes", () => {
    expect(authErrorMessage("CredentialsSignin")).toContain("Неверный код");
  });
});

describe("buildLoginTabOptions", () => {
  it("hides email tab when disabled", () => {
    const opts = buildLoginTabOptions({
      phone: true,
      email: false,
      google: false,
      apple: false,
    });
    expect(opts).toHaveLength(1);
  });
});

describe("resolveLoginTab", () => {
  it("falls back when tab unavailable", () => {
    const opts = buildLoginTabOptions({
      phone: true,
      email: false,
      google: false,
      apple: false,
    });
    expect(resolveLoginTab("email", opts)).toBe("phone");
  });
});

describe("mapDbUserToAuth", () => {
  it("maps phone user", () => {
    const user = mapDbUserToAuth({
      id: "1",
      name: "+7 900 123-45-67",
      email: null,
      image: null,
      phone: "+79001234567",
    });
    expect(user.phone).toBe("+79001234567");
  });
});

describe("profile helpers", () => {
  it("profileInitials from name", () => {
    expect(profileInitials("Иван Петров", null)).toBe("ИП");
  });

  it("accountDisplayName formats phone", () => {
    expect(accountDisplayName("+79001234567", "+79001234567")).toContain("+7");
  });

  it("formatAccountPhone returns null for empty", () => {
    expect(formatAccountPhone(null)).toBeNull();
  });
});
