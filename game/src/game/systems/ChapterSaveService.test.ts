import { beforeEach, describe, expect, it } from "vitest";
import {
  ACT2_SPAWN_TILE,
  ACT3_SPAWN_TILE,
  createChapterFromActOne
} from "../domain/chapterState";
import { reduceChapter } from "../domain/chapterReducer";
import { ChapterSaveService } from "./ChapterSaveService";

describe("ChapterSaveService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a valid v2 chapter save", () => {
    const service = new ChapterSaveService(localStorage);
    const state = reduceChapter(createChapterFromActOne("aroma"), {
      type: "ACT2_TALK_MASTER"
    });

    service.save(state);

    expect(service.load()).toEqual(state);
  });

  it("migrates a completed v1 act save and persists the v2 result", () => {
    const service = new ChapterSaveService(localStorage);
    localStorage.setItem(
      ChapterSaveService.LEGACY_KEY,
      JSON.stringify({
        version: 1,
        phase: "COMPLETE",
        questId: "act1_complete",
        inventory: ["item_taipo_note"],
        inspectedObjects: [],
        senseChoice: "cold_clay",
        playerTile: { x: 24, y: 9 },
        movementLocked: true,
        act1Complete: true,
        movedTiles: 12
      })
    );

    const loaded = service.load();

    expect(loaded?.currentAct).toBe(2);
    expect(loaded?.act1Sense).toBe("cold_clay");
    expect(loaded?.playerTile).toEqual(ACT2_SPAWN_TILE);
    expect(
      localStorage.getItem(ChapterSaveService.STORAGE_KEY)
    ).not.toBeNull();
  });

  it("does not migrate an unfinished v1 save", () => {
    const service = new ChapterSaveService(localStorage);
    localStorage.setItem(
      ChapterSaveService.LEGACY_KEY,
      JSON.stringify({
        version: 1,
        phase: "MIA_ENTERED",
        senseChoice: null,
        act1Complete: false
      })
    );

    expect(service.load()).toBeNull();
    expect(
      localStorage.getItem(ChapterSaveService.STORAGE_KEY)
    ).toBeNull();
  });

  it("backs up corrupted v2 JSON and returns no chapter", () => {
    const service = new ChapterSaveService(localStorage);
    localStorage.setItem(ChapterSaveService.STORAGE_KEY, "{broken");

    expect(service.load()).toBeNull();
    expect(
      localStorage.getItem(ChapterSaveService.CORRUPT_KEY)
    ).toBe("{broken");
  });

  it("rejects an unknown v2 version", () => {
    const service = new ChapterSaveService(localStorage);
    localStorage.setItem(
      ChapterSaveService.STORAGE_KEY,
      JSON.stringify({
        ...createChapterFromActOne("aroma"),
        version: 99
      })
    );

    expect(service.load()).toBeNull();
  });

  it("recovers an out-of-bounds act two tile to its spawn", () => {
    const service = new ChapterSaveService(localStorage);
    localStorage.setItem(
      ChapterSaveService.STORAGE_KEY,
      JSON.stringify({
        ...createChapterFromActOne("aroma"),
        playerTile: { x: 999, y: -1 }
      })
    );

    expect(service.load()?.playerTile).toEqual(ACT2_SPAWN_TILE);
  });

  it("recovers an out-of-bounds act three tile to its spawn", () => {
    const service = new ChapterSaveService(localStorage);
    let state = createChapterFromActOne("aroma");
    const events = [
      { type: "ACT2_TALK_MASTER" },
      { type: "ACT2_INSPECT_TRAY" },
      { type: "ACT2_INSPECT_JAR" },
      { type: "ACT2_TAKE_SAMPLE" },
      { type: "ACT2_COMPLETE_STEP", step: "mix" },
      { type: "ACT2_COMPLETE_STEP", step: "vat" },
      { type: "ACT2_COMPLETE_STEP", step: "seal" },
      { type: "ACT2_CHOOSE_QUESTION", choice: "ask_hongqu" }
    ] as const;
    for (const event of events) {
      state = reduceChapter(state, event);
    }
    localStorage.setItem(
      ChapterSaveService.STORAGE_KEY,
      JSON.stringify({ ...state, playerTile: { x: 100, y: 100 } })
    );

    expect(service.load()?.playerTile).toEqual(ACT3_SPAWN_TILE);
  });

  it("clears both chapter and legacy saves for a full restart", () => {
    const service = new ChapterSaveService(localStorage);
    localStorage.setItem(ChapterSaveService.STORAGE_KEY, "{}");
    localStorage.setItem(ChapterSaveService.LEGACY_KEY, "{}");

    service.clearAll();

    expect(
      localStorage.getItem(ChapterSaveService.STORAGE_KEY)
    ).toBeNull();
    expect(
      localStorage.getItem(ChapterSaveService.LEGACY_KEY)
    ).toBeNull();
  });
});
