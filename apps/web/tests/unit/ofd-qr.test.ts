import { describe, expect, it } from "vitest";
import { parseOfdQr } from "@/lib/receipt/ofd-qr";

describe("parseOfdQr", () => {
  it("parses standard fiscal QR string", () => {
    const data = parseOfdQr(
      "t=20240601T120000&s=1234.56&fn=9288000100123456&i=12345&fp=9876543210&n=1",
    );
    expect(data).not.toBeNull();
    expect(data?.totalRub).toBeCloseTo(1234.56, 2);
    expect(data?.fn).toBe("9288000100123456");
    expect(data?.fd).toBe("12345");
    expect(data?.fp).toBe("9876543210");
  });

  it("parses URL with query", () => {
    const data = parseOfdQr(
      "https://consumer.1-ofd.ru/v1?t=20240601T1200&s=100&fn=1&i=2&fp=3",
    );
    expect(data?.totalRub).toBe(100);
  });

  it("returns null for garbage", () => {
    expect(parseOfdQr("hello")).toBeNull();
  });
});
