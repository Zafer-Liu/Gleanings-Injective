import { describe, expect, it } from "vitest";
import {
  createLongjingState,
  type LongjingSaveV1
} from "../domain/longjingState";
import { LongjingSaveService } from "./LongjingSaveService";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("LongjingSaveService", () => {
  it("round-trips a valid chapter-two save", () => {
    const storage = new MemoryStorage();
    const service = new LongjingSaveService(storage);
    const state: LongjingSaveV1 = {
      ...createLongjingState(),
      marketPhase: "INSPECT_TIN_B" as const,
      evidence: ["evidence_tin_a"],
      playerTile: { x: 14, y: 16 }
    };

    service.save(state);

    expect(service.load()).toEqual(state);
  });

  it("normalizes unsafe collections and out-of-bounds positions", () => {
    const storage = new MemoryStorage();
    const service = new LongjingSaveService(storage);
    const raw = {
      ...createLongjingState(),
      evidence: ["evidence_tin_a", "evidence_tin_a", 3],
      relics: ["relic_old_tea_scoop", null],
      playerTile: { x: 999, y: -4 }
    };
    storage.setItem(
      LongjingSaveService.STORAGE_KEY,
      JSON.stringify(raw)
    );

    const loaded = service.load();

    expect(loaded?.evidence).toEqual(["evidence_tin_a"]);
    expect(loaded?.relics).toEqual(["relic_old_tea_scoop"]);
    expect(loaded?.playerTile).toEqual({ x: 18, y: 18 });
  });

  it("backs up invalid saves instead of crashing the chapter", () => {
    const storage = new MemoryStorage();
    const service = new LongjingSaveService(storage);
    storage.setItem(LongjingSaveService.STORAGE_KEY, "{bad-json");

    expect(service.load()).toBeNull();
    expect(
      storage.getItem(LongjingSaveService.CORRUPT_KEY)
    ).toBe("{bad-json");
  });
});
