import { describe, expect, it } from "vitest";
import type { ChapterMapContent } from "../../content/chapter/types";
import { buildChapterGeometry } from "./ChapterMapGeometry";

const map: ChapterMapContent = {
  size: { width: 44, height: 30 },
  tileSize: 32,
  playerSpawn: { x: 20, y: 24 },
  npcSpawns: { master: { x: 8, y: 9 } },
  collisions: [
    {
      id: "wall",
      x: 1.5,
      y: 2,
      width: 3.25,
      height: 1.5
    }
  ],
  occluders: [
    {
      id: "jar-bank",
      x: 5,
      y: 6.25,
      width: 2,
      height: 2.75
    }
  ]
};

describe("ChapterMapGeometry", () => {
  it("converts the declared tile map into an integer-pixel world", () => {
    const geometry = buildChapterGeometry(map);

    expect(geometry.width).toBe(1408);
    expect(geometry.height).toBe(960);
    expect(geometry.collisions).toEqual([
      {
        id: "wall",
        x: 48,
        y: 64,
        width: 104,
        height: 48
      }
    ]);
  });

  it("places foreground occluders at the bottom-edge depth", () => {
    const geometry = buildChapterGeometry(map);

    expect(geometry.occluders).toEqual([
      {
        id: "jar-bank",
        x: 160,
        y: 200,
        width: 64,
        height: 88,
        depth: 288
      }
    ]);
  });
});
