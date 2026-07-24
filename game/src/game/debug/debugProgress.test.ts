import { describe, expect, it } from "vitest";
import { ChapterSaveService } from "../systems/ChapterSaveService";
import { LongjingSaveService } from "../systems/LongjingSaveService";
import { SaveService } from "../systems/SaveService";
import {
  DEBUG_COLLECTIBLES_STORAGE_KEY,
  grantDebugCollectibles,
  readDebugCollectibleUnlocks
} from "./debugCollectibles";
import { advanceDebugStage } from "./debugProgress";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("debug progression", () => {
  it("从第一幕跳到冬酿坊时生成完整且可加载的前置存档", () => {
    const storage = new MemoryStorage();
    const session = new MemoryStorage();

    expect(
      advanceDebugStage("Apartment", storage, session)
    ).toEqual({
      sceneKey: "ActTwo",
      label: "第一章 · 冬酿坊"
    });
    expect(new SaveService(storage).load()).toMatchObject({
      phase: "COMPLETE",
      act1Complete: true,
      senseChoice: "hongqu_red"
    });
    expect(new ChapterSaveService(storage).load()).toMatchObject({
      currentAct: 2,
      act2Phase: "ARRIVE"
    });
    expect(
      session.getItem("gleanings.active-chapter.v1")
    ).toBe("one");
  });

  it("第一章各幕跳转会补齐前置奖励并保留已有收藏", () => {
    const storage = new MemoryStorage();
    const service = new ChapterSaveService(storage);

    advanceDebugStage("Apartment", storage);
    const withExtraReward = service.load();
    expect(withExtraReward).not.toBeNull();
    service.save({
      ...withExtraReward!,
      relics: ["debug_existing_relic"]
    });

    expect(advanceDebugStage("ActTwo", storage)?.sceneKey).toBe(
      "ActThree"
    );
    expect(service.load()).toMatchObject({
      currentAct: 3,
      act2Phase: "COMPLETE"
    });
    expect(service.load()?.relics).toEqual(
      expect.arrayContaining([
        "relic_dongniang_common",
        "debug_existing_relic"
      ])
    );

    expect(advanceDebugStage("ActThree", storage)?.sceneKey).toBe(
      "ActFour"
    );
    expect(advanceDebugStage("ActFour", storage)?.sceneKey).toBe(
      "HuangjiuFilm"
    );
    expect(
      advanceDebugStage("HuangjiuFilm", storage)?.sceneKey
    ).toBe("ChapterComplete");
    expect(service.load()).toMatchObject({
      currentAct: "complete",
      chapterComplete: true
    });
  });

  it("第二章每个目标存档都通过严格的一致性校验", () => {
    const storage = new MemoryStorage();
    const service = new LongjingSaveService(storage);
    const transitions = [
      ["ChapterComplete", "LongjingMarket", "market"],
      ["LongjingMarket", "LongjingTerrace", "terrace"],
      ["LongjingTerrace", "LongjingWorkshop", "workshop"],
      ["LongjingWorkshop", "LongjingTruth", "truth"],
      ["LongjingTruth", "LongjingFilm", "film"],
      ["LongjingFilm", "LongjingComplete", "complete"]
    ] as const;

    for (const [from, sceneKey, act] of transitions) {
      expect(advanceDebugStage(from, storage)?.sceneKey).toBe(
        sceneKey
      );
      expect(service.load()?.currentAct).toBe(act);
    }
    expect(service.load()).toMatchObject({
      chapterComplete: true,
      filmSeen: true
    });
    expect(advanceDebugStage("LongjingComplete", storage)).toBeNull();
  });

  it("徽章和道具解锁标记可分别一键写入并自动去重", () => {
    const storage = new MemoryStorage();

    grantDebugCollectibles(storage, "badge");
    grantDebugCollectibles(storage, "item");
    grantDebugCollectibles(storage, "badge");

    expect(readDebugCollectibleUnlocks(storage)).toEqual([
      "badge",
      "item"
    ]);
    expect(
      JSON.parse(
        storage.getItem(DEBUG_COLLECTIBLES_STORAGE_KEY) ?? "null"
      )
    ).toEqual(["badge", "item"]);
  });
});
