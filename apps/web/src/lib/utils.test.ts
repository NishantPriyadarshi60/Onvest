import { describe, it, expect } from "vitest";
import { cn, formatCurrency, truncateAddress } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("resolves Tailwind conflicts", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });
});

describe("formatCurrency", () => {
  it("formats cents as currency by default", () => {
    expect(formatCurrency(100000)).toBe("$1,000");
  });

  it("formats dollars when majorUnits=true", () => {
    expect(formatCurrency(1000, "USD", true)).toBe("$1,000");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });
});

describe("truncateAddress", () => {
  it("truncates valid Ethereum address", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(addr)).toBe("0x1234...5678");
  });

  it("returns short string as-is", () => {
    expect(truncateAddress("0x1234")).toBe("0x1234");
  });

  it("uses custom char count", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(addr, 6)).toBe("0x123456...345678");
  });
});
