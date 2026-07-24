import type { RelicView } from "../ui/RelicPanel";
import type { SenseChoice } from "./act1State";
import type {
  Act2Phase,
  Act2Question
} from "./chapterState";

const QUEST_BY_PHASE: Record<Act2Phase, string> = {
  ARRIVE: "act2_talk_master",
  INSPECT_TRAY: "act2_inspect_tray",
  INSPECT_JAR: "act2_inspect_jar",
  TAKE_SAMPLE: "act2_take_sample",
  MIX: "act2_mix",
  VAT: "act2_vat",
  SEAL: "act2_seal",
  QUESTION: "act2_question",
  COMPLETE: "act2_complete"
};

const TARGET_BY_PHASE: Record<
  Exclude<Act2Phase, "COMPLETE">,
  string
> = {
  ARRIVE: "master",
  INSPECT_TRAY: "hongqu_tray",
  INSPECT_JAR: "clay_jar",
  TAKE_SAMPLE: "hongqu_sample",
  MIX: "mix_station",
  VAT: "vat_station",
  SEAL: "seal_station",
  QUESTION: "master"
};

export function act2QuestId(phase: Act2Phase): string {
  return QUEST_BY_PHASE[phase];
}

export function act2TargetId(phase: Act2Phase): string | null {
  return phase === "COMPLETE" ? null : TARGET_BY_PHASE[phase];
}

export function act2RelicView(
  sense: SenseChoice,
  question: Act2Question
): RelicView {
  if (sense === "cold_clay" && question === "ask_future") {
    return {
      eyebrow: "冬酿记忆 · 特殊回响",
      name: "留白印",
      rarity: "传世",
      description:
        "太婆没有回答未来，只在曲印背面留下一块空白。它等着下一代写下去。",
      texture: "item-dongniang-relic"
    };
  }
  return {
    eyebrow: "幕二信物",
    name: "冬酿曲印",
    rarity: question === "ask_hongqu" ? "寻常" : "稀有",
    description:
      question === "ask_hongqu"
        ? "红曲的颜色留在木印上，也留在少女太婆的指尖。"
        : "一枚记着冬日节气与酿造次序的旧曲印。",
    texture: "item-dongniang-relic"
  };
}
