import type {
  ApartmentMapContent,
  InteractableContent,
  TileRectangle
} from "../../content/act1/content";
import type { TilePosition } from "../domain/act1State";

export type PixelRectangle = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PixelInteractable = {
  id: string;
  x: number;
  y: number;
  tile: TilePosition;
  range: number;
};

export type ApartmentGeometry = {
  width: number;
  height: number;
  collisions: PixelRectangle[];
  interactables: PixelInteractable[];
};

export function tileToPixelCenter(
  tile: TilePosition,
  tileSize: number
): TilePosition {
  return {
    x: Math.round(tile.x * tileSize + tileSize / 2),
    y: Math.round(tile.y * tileSize + tileSize / 2)
  };
}

function rectangleToPixels(
  rectangle: TileRectangle,
  tileSize: number
): PixelRectangle {
  return {
    id: rectangle.id,
    x: Math.round(rectangle.x * tileSize),
    y: Math.round(rectangle.y * tileSize),
    width: Math.round(rectangle.width * tileSize),
    height: Math.round(rectangle.height * tileSize)
  };
}

export function buildApartmentGeometry(
  map: ApartmentMapContent,
  interactables: InteractableContent[]
): ApartmentGeometry {
  return {
    width: map.size.width * map.tileSize,
    height: map.size.height * map.tileSize,
    collisions: map.collisions.map((rectangle) =>
      rectangleToPixels(rectangle, map.tileSize)
    ),
    interactables: interactables.map((interactable) => ({
      id: interactable.id,
      ...tileToPixelCenter(interactable.tile, map.tileSize),
      tile: { ...interactable.tile },
      range: interactable.range
    }))
  };
}
