import { describe, expect, it } from "vitest";
import { isBlockedAddress, validateGeneratedBundle } from "../server/ai-provider";

describe("AI provider safety helpers", () => {
  it("blocks private, loopback, link-local, and documentation network addresses", () => {
    for (const address of ["127.0.0.1", "10.2.3.4", "172.20.0.1", "192.168.1.2", "169.254.1.2"]) {
      expect(isBlockedAddress(address)).toBe(true);
    }
    expect(isBlockedAddress("fe80::1")).toBe(true);
    expect(isBlockedAddress("2001:db8::1")).toBe(true);
  });

  it("allows public IPv4 and IPv6 destinations", () => {
    expect(isBlockedAddress("1.1.1.1")).toBe(false);
    expect(isBlockedAddress("2606:4700:4700::1111")).toBe(false);
  });

  it("rejects generated source paths that escape the project directory", () => {
    const raw = JSON.stringify({
      summary: "Starter",
      packageName: "com.example.app",
      files: [{ path: "../outside.txt", content: "no" }],
      setupSteps: [],
    });
    expect(() => validateGeneratedBundle(raw)).toThrow("unsafe source path");
  });

  it("rejects duplicate source paths", () => {
    const raw = JSON.stringify({
      summary: "Starter",
      packageName: "com.example.app",
      files: [
        { path: "App.tsx", content: "first" },
        { path: "App.tsx", content: "second" },
      ],
      setupSteps: [],
    });
    expect(() => validateGeneratedBundle(raw)).toThrow("duplicate source paths");
  });

  it("keeps serialized source bundles within the MySQL TEXT byte limit", () => {
    const raw = JSON.stringify({
      summary: "Starter",
      packageName: "com.example.app",
      files: [{ path: "App.tsx", content: "က".repeat(21_000) }],
      setupSteps: [],
    });
    expect(() => validateGeneratedBundle(raw)).toThrow("too large to store");
  });
});
