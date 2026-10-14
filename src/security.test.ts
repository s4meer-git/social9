import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CSP } from "@social9/core/security/csp";

describe("deployed headers", () => {
  it("serve exactly the public Content-Security-Policy", () => {
    const headers = readFileSync("public/_headers", "utf8");
    const line = headers.split("\n").find((l) => l.trim().startsWith("Content-Security-Policy:"));
    expect(line?.split("Content-Security-Policy:")[1].trim()).toBe(CSP);
  });
});
