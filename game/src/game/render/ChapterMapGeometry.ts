import type {
  ChapterMapContent,
  ChapterTileRectangle
} from "../../content/chapter/types";

export type ChapterPixelRectangle = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ChapterPixelOccluder = ChapterPixelRectangle & {
  depth: number;
};

export type ChapterGeometry = {
  width: number;
  height: number;
  collisions: ChapterPixelRectangle[];
  occluders: ChapterPixelOccluder[];
};

function toPixels(
  rectangle: ChapterTileRectangle,
  tileSize: number
): ChapterPixelRectangle {
  return {
    id: rectangle.id,
    x: Math.round(rectangle.x * tileSize),
    y: Math.round(rectangle.y * tileSize),
    width: Math.round(rectangle.width * tileSize),
    height: Math.round(rectangle.height * tileSize)
  };
}

export function buildChapterGeometry(
  map: ChapterMapContent
): ChapterGeometry {
  return {
    width: map.size.width * map.tileSize,
    height: map.size.height * map.tileSize,
    collisions: map.collisions.map((rectangle) =>
      toPixels(rectangle, map.tileSize)
    ),
    occluders: map.occluders.map((rectangle) => {
      const pixels = toPixels(rectangle, map.tileSize);
      return {
        ...pixels,
        depth: pixels.y + pixels.height
      };
    })
  };
}
