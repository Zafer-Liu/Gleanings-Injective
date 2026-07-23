import { describe, expect, it } from "vitest";
import { act1Content } from "../../content/act1/content";
import {
  buildApartmentGeometry,
  tileToPixelCenter
} from "./ApartmentRenderer";

describe("ApartmentRenderer geometry", () => {
  function collisionAt(x: number, y: number): string | null {
    const geometry = buildApartmentGeometry(
      act1Content.map,
      act1Content.interactables
    );
    const collision = geometry.collisions.find(
      (rectangle) =>
        x >= rectangle.x &&
        x < rectangle.x + rectangle.width &&
        y >= rectangle.y &&
        y < rectangle.y + rectangle.height
    );
    return collision?.id ?? null;
  }

  it("converts every collision rectangle to integer pixels", () => {
    const geometry = buildApartmentGeometry(
      act1Content.map,
      act1Content.interactables
    );

    for (const rectangle of geometry.collisions) {
      expect(Number.isInteger(rectangle.x)).toBe(true);
      expect(Number.isInteger(rectangle.y)).toBe(true);
      expect(Number.isInteger(rectangle.width)).toBe(true);
      expect(Number.isInteger(rectangle.height)).toBe(true);
    }
  });

  it("converts interactable tiles to centered integer pixels", () => {
    const geometry = buildApartmentGeometry(
      act1Content.map,
      act1Content.interactables
    );

    expect(geometry.interactables.find((item) => item.id === "obj_cardboard_box"))
      .toMatchObject({ x: 208, y: 432 });
    expect(geometry.interactables.find((item) => item.id === "obj_laojiu_jar"))
      .toMatchObject({ x: 848, y: 304 });
  });

  it("rounds camera and actor coordinates to whole pixels", () => {
    expect(tileToPixelCenter({ x: 14, y: 15 }, 32)).toEqual({
      x: 464,
      y: 496
    });
  });

  it.each([
    [620, 224],
    [456, 368]
  ])(
    "keeps visible floor at pixel (%i, %i) walkable",
    (x, y) => {
      expect(collisionAt(x, y)).toBeNull();
    }
  );

  it.each([
    [144, 208, "desk_collision"],
    [276, 272, "sofa_collision"],
    [212, 400, "boxes_collision"],
    [240, 496, "parcel_collision"],
    [720, 272, "kitchen_island_collision"],
    [850, 304, "jar_collision"],
    [708, 432, "entry_console_collision"]
  ])(
    "keeps the furniture solid at pixel (%i, %i)",
    (x, y, collisionId) => {
      expect(collisionAt(x, y)).toBe(collisionId);
    }
  );
});
