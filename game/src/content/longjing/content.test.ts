import { describe, expect, it } from "vitest";
import { CHARACTERS } from "../characters";
import {
  LONGJING_MAPS,
  LONGJING_MARKET_INTERACTABLES,
  LONGJING_OBJECT_LAYOUT,
  LONGJING_PICKING_LEAVES,
  LONGJING_TRUTH_INTERACTABLES,
  longjingDialogue
} from "./content";
import type {
  ChapterInteractable,
  ChapterMapContent
} from "../chapter/types";

function isBlocked(
  map: ChapterMapContent,
  x: number,
  y: number
): boolean {
  return map.collisions.some(
    (collision) =>
      x >= collision.x &&
      x < collision.x + collision.width &&
      y >= collision.y &&
      y < collision.y + collision.height
  );
}

function canReachTarget(
  map: ChapterMapContent,
  target: Pick<ChapterInteractable, "tile" | "range">
): boolean {
  const queue = [map.playerSpawn];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    const key = `${current.x},${current.y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (
      Math.abs(current.x - target.tile.x) +
        Math.abs(current.y - target.tile.y) <=
      target.range
    ) {
      return true;
    }
    [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ].forEach((next) => {
      if (
        next.x >= 0 &&
        next.x < map.size.width &&
        next.y >= 0 &&
        next.y < map.size.height &&
        !isBlocked(map, next.x, next.y)
      ) {
        queue.push(next);
      }
    });
  }
  return false;
}

describe("Longjing chapter content", () => {
  it("ships four maps larger than the 640×360 viewport", () => {
    expect(LONGJING_MAPS.market.size).toEqual({
      width: 38,
      height: 26
    });
    expect(LONGJING_MAPS.terrace.size).toEqual({
      width: 48,
      height: 32
    });
    expect(LONGJING_MAPS.workshop.size).toEqual({
      width: 40,
      height: 28
    });
    expect(LONGJING_MAPS.truth.size).toEqual({
      width: 34,
      height: 24
    });
    Object.values(LONGJING_MAPS).forEach((map) => {
      expect(map.size.width * map.tileSize).toBeGreaterThan(640);
      expect(map.size.height * map.tileSize).toBeGreaterThan(360);
    });
  });

  it("provides twelve reachable picking judgements with mixed leaf states", () => {
    expect(LONGJING_PICKING_LEAVES).toHaveLength(12);
    expect(
      LONGJING_PICKING_LEAVES.filter(
        (leaf) => leaf.kind === "tender"
      )
    ).toHaveLength(6);
    expect(
      new Set(LONGJING_PICKING_LEAVES.map((leaf) => leaf.kind))
    ).toEqual(
      new Set(["tender", "too_young", "mature", "wet", "damaged"])
    );
  });

  it("keeps the chapter's names and cultural boundary in player-facing copy", () => {
    const copy = JSON.stringify(longjingDialogue);

    expect(copy).toContain(CHARACTERS.protagonist.displayName);
    expect(copy).toContain(CHARACTERS.mia.displayName);
    expect(copy).toContain(CHARACTERS.chenShouyi.displayName);
    expect(copy).toContain("茶是不是好喝，是一件事");
    expect(copy).toContain("叶子能压成一样的形，来处压不出来");
    expect(copy).toContain("应提交进一步核查");
    expect(copy).not.toContain("喝一口就知道");
    expect(copy).not.toContain("产区外都是假茶");
  });

  it("uses narrow object collisions instead of whole-sprite blocking boxes", () => {
    const allCollisions = Object.values(LONGJING_MAPS).flatMap(
      (map) => map.collisions
    );
    const objectCollisions = allCollisions.filter(
      (collision) => !collision.id.startsWith("boundary_")
    );

    expect(objectCollisions.length).toBeGreaterThan(8);
    expect(
      objectCollisions.every(
        (collision) =>
          collision.width < 20 && collision.height < 12
      )
    ).toBe(true);
  });

  it("keeps every task target reachable without crossing an air wall", () => {
    const targets = [
      ...LONGJING_MARKET_INTERACTABLES.map((target) => ({
        map: LONGJING_MAPS.market,
        target
      })),
      ...LONGJING_PICKING_LEAVES.map((leaf) => ({
        map: LONGJING_MAPS.terrace,
        target: { tile: leaf.tile, range: 1 }
      })),
      {
        map: LONGJING_MAPS.workshop,
        target: { tile: { x: 20, y: 17 }, range: 1 }
      },
      {
        map: LONGJING_MAPS.workshop,
        target: { tile: { x: 31, y: 14 }, range: 1 }
      },
      ...LONGJING_TRUTH_INTERACTABLES.map((target) => ({
        map: LONGJING_MAPS.truth,
        target
      }))
    ];

    targets.forEach(({ map, target }) => {
      expect(
        canReachTarget(map, target),
        `target ${target.tile.x},${target.tile.y}`
      ).toBe(true);
    });
  });

  it("uses the same declared object layout for rendering and collisions", () => {
    const cases = [
      ["workshop", "stove", LONGJING_OBJECT_LAYOUT.workshop.stove],
      [
        "workshop",
        "ledger_table",
        LONGJING_OBJECT_LAYOUT.workshop.ledgerTable
      ],
      [
        "workshop",
        "basket_stack",
        LONGJING_OBJECT_LAYOUT.workshop.basketStack
      ],
      [
        "truth",
        "sealed_stove",
        LONGJING_OBJECT_LAYOUT.truth.sealedStove
      ],
      [
        "truth",
        "tea_table",
        LONGJING_OBJECT_LAYOUT.truth.teaTable
      ]
    ] as const;

    cases.forEach(([mapKey, id, layout]) => {
      expect(
        LONGJING_MAPS[mapKey].collisions.find(
          (collision) => collision.id === id
        )
      ).toMatchObject(layout);
    });
  });
});

describe("Longjing map collision alignment", () => {
  it("keeps visibly open market lanes and scene exits free of colliders", () => {
    const openTiles = [
      { map: LONGJING_MAPS.market, points: [
        [16, 14],
        [17, 14],
        [18, 14],
        [19, 14],
        [16, 15],
        [17, 15],
        [18, 15],
        [19, 15],
        [18, 24],
        [19, 24],
        [20, 24]
      ] },
      { map: LONGJING_MAPS.terrace, points: [
        [43, 24],
        [43, 25]
      ] },
      { map: LONGJING_MAPS.workshop, points: [
        [14, 26],
        [15, 26],
        [24, 26],
        [25, 26]
      ] },
      { map: LONGJING_MAPS.truth, points: [
        [9, 6],
        [10, 6],
        [24, 6],
        [25, 6]
      ] }
    ] as const;

    openTiles.forEach(({ map, points }) => {
      points.forEach(([x, y]) => {
        expect(isBlocked(map, x, y), `open floor ${x},${y}`).toBe(false);
      });
    });
  });

  it("keeps every terrace collider on its visible seven-tile tea bed", () => {
    const teaRows = LONGJING_MAPS.terrace.collisions
      .filter((collision) => collision.id.startsWith("tea_row_"))
      .map(({ x, y, width, height }) => ({
        x,
        y,
        width,
        height
      }));

    expect(teaRows).toEqual(
      [5, 11, 17].flatMap((y) =>
        [6, 16, 25, 35].map((x) => ({
          x,
          y,
          width: 7,
          height: 2
        }))
      )
    );
  });

  it("keeps the workshop basket collider over the visible stack", () => {
    expect(LONGJING_OBJECT_LAYOUT.workshop.basketStack).toEqual({
      x: 4,
      y: 20,
      width: 6,
      height: 3
    });
  });
});
