export type QuestMarkerPoint = {
  x: number;
  y: number;
};

export type QuestMarkerViewport = QuestMarkerPoint & {
  width: number;
  height: number;
};

export type QuestMarkerPlacement = {
  mode: "world" | "edge";
  x: number;
  y: number;
  rotation: number;
};

const EDGE_INSET = Object.freeze({
  left: 24,
  right: 24,
  top: 84,
  bottom: 36
});

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function questMarkerPlacement(
  target: QuestMarkerPoint,
  viewport: QuestMarkerViewport
): QuestMarkerPlacement {
  const localX = target.x - viewport.x;
  const localY = target.y - viewport.y;
  const onscreen =
    localX >= 0 &&
    localX <= viewport.width &&
    localY >= 0 &&
    localY <= viewport.height;
  if (onscreen) {
    return {
      mode: "world",
      x: target.x,
      y: target.y,
      rotation: 0
    };
  }

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const deltaX = localX - centerX;
  const deltaY = localY - centerY;
  const left = EDGE_INSET.left;
  const right = viewport.width - EDGE_INSET.right;
  const top = EDGE_INSET.top;
  const bottom = viewport.height - EDGE_INSET.bottom;
  const horizontalScale =
    deltaX > 0
      ? (right - centerX) / deltaX
      : deltaX < 0
        ? (left - centerX) / deltaX
        : Number.POSITIVE_INFINITY;
  const verticalScale =
    deltaY > 0
      ? (bottom - centerY) / deltaY
      : deltaY < 0
        ? (top - centerY) / deltaY
        : Number.POSITIVE_INFINITY;
  const scale = Math.min(horizontalScale, verticalScale);

  return {
    mode: "edge",
    x: clamp(centerX + deltaX * scale, left, right),
    y: clamp(centerY + deltaY * scale, top, bottom),
    rotation: Math.atan2(deltaY, deltaX) - Math.PI / 2
  };
}
