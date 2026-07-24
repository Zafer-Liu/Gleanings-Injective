import type { TilePosition } from "../../game/domain/act1State";

export type ChapterDialogueLine = {
  speakerId: string;
  speakerName: string;
  text: string;
};

export type ChapterDialogueChoice<TValue extends string = string> = {
  value: TValue;
  label: string;
  feedback: string;
  motif?: string;
};

export type ChapterQuestContent = {
  id: string;
  title: string;
  hint: string;
};

export type ChapterInteractable = {
  id: string;
  tile: TilePosition;
  range: number;
  prompt: string;
  dialogueGroup: string;
  enabledPhases?: string[];
  optional?: boolean;
};

export type ChapterTileRectangle = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ChapterMapContent = {
  size: { width: number; height: number };
  tileSize: number;
  playerSpawn: TilePosition;
  npcSpawns: Record<string, TilePosition>;
  collisions: ChapterTileRectangle[];
  occluders: ChapterTileRectangle[];
};
