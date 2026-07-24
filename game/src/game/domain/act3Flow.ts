import type { RelicView } from "../ui/RelicPanel";
import type {
  Act3Inscription,
  Act3Material,
  Act3Phase
} from "./chapterState";

const MATERIAL_ORDER: Act3Material[] = [
  "bowl",
  "noodles",
  "laojiu"
];

const QUEST_BY_PHASE: Record<Act3Phase, string> = {
  ARRIVE: "act3_talk_family",
  COLLECT: "act3_collect",
  READY_TO_COOK: "act3_cook",
  COOKED: "act3_serve",
  INSCRIPTION: "act3_inscription",
  COMPLETE: "act3_complete"
};

export function act3QuestId(phase: Act3Phase): string {
  return QUEST_BY_PHASE[phase];
}

export function act3TargetId(
  phase: Act3Phase,
  materials: Act3Material[]
): string | null {
  switch (phase) {
    case "ARRIVE":
      return "family";
    case "COLLECT":
      return (
        MATERIAL_ORDER.find(
          (material) => !materials.includes(material)
        ) ?? "stove"
      );
    case "READY_TO_COOK":
      return "stove";
    case "COOKED":
      return "azhen";
    case "INSCRIPTION":
    case "COMPLETE":
      return null;
  }
}

export function act3Progress(materials: Act3Material[]): string {
  return `备料 ${materials.length}/3`;
}

export function act3RelicView(
  choice: Act3Inscription
): RelicView {
  const copy: Record<
    Act3Inscription,
    { mark: string; tone: string; description: string }
  > = {
    warm: {
      mark: "暖",
      tone: "温暖",
      description:
        "这只酒盏记得灶火与面线的热气，\n也记得有人在最疲惫的时候被好好照顾。"
    },
    inherit: {
      mark: "承",
      tone: "敬意",
      description:
        "一双手把旧方法接过来，又在新的日子里继续做下去。"
    },
    remember: {
      mark: "念",
      tone: "怅惘",
      description:
        "喝酒的人会离席，碗盏却把席间的话留得更久。"
    }
  };
  const selected = copy[choice];
  return {
    eyebrow: "幕三信物",
    name: `青花酒盏 · ${selected.mark}`,
    rarity: selected.tone,
    description: selected.description,
    texture: "item-blue-white-cup"
  };
}
