import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHAIN_BRIDGE_URL,
  resolveChainOrigin
} from "./chainConfig";

describe("resolveChainOrigin", () => {
  it("uses the local Vite proxy during development when no URL is configured", () => {
    expect(resolveChainOrigin(undefined, true)).toBe("");
  });

  it("uses the deployed Railway bridge in production when no URL is configured", () => {
    expect(resolveChainOrigin(undefined, false)).toBe(
      "https://gleanings-production.up.railway.app"
    );
    expect(DEFAULT_CHAIN_BRIDGE_URL).not.toContain("127.0.0.1");
  });

  it("honors an explicitly configured bridge URL and removes trailing slashes", () => {
    expect(resolveChainOrigin(" https://chain.example.test/// ", true)).toBe(
      "https://chain.example.test"
    );
  });
});
