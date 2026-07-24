import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("production debug bootstrap", () => {
  it("registers dev synchronously before the application module", () => {
    const html = readFileSync(
      resolve(process.cwd(), "index.html"),
      "utf8"
    );
    const bootstrap = html.indexOf(
      'Object.defineProperty(window, "dev"'
    );
    const application = html.indexOf(
      '<script type="module" src="/src/main.tsx"></script>'
    );

    expect(bootstrap).toBeGreaterThan(-1);
    expect(application).toBeGreaterThan(bootstrap);
  });
});
