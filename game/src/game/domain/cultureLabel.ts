import type {
  Act2Question,
  Act3Inscription,
  Act4Explanation,
  ChapterOneSaveV2
} from "./chapterState";
import type { SenseChoice } from "./act1State";

export type CultureLabel = {
  chineseName: string;
  englishName: string;
  englishIntro: string;
  culturalFact: string;
  creativeText: string;
  pathSummary: string[];
  templateSource: "LOCAL_TEMPLATE_V1";
  pathHash: string;
};

export type DemoMintReceipt = {
  tokenId: string;
  pathHash: string;
  status: "local-demo";
  network: "none";
};

const NAME_BY_SENSE: Record<
  SenseChoice,
  { chinese: string; english: string }
> = {
  aroma: {
    chinese: "暖香旧酿",
    english: "Warmth from an Old Jar"
  },
  hongqu_red: {
    chinese: "红曲家书",
    english: "A Letter in Red Yeast"
  },
  cold_clay: {
    chinese: "封坛岁月",
    english: "Years Sealed in Clay"
  }
};

const INTRO_BY_EXPLANATION: Record<Act4Explanation, string> = {
  letter:
    "A jar of Fujian laojiu can carry a family message across distance and time.",
  three_generations:
    "Fujian laojiu links three generations through brewing, care, and remembrance.",
  fujian_hongqu:
    "This Fujian huangjiu tradition uses red yeast rice as a distinctive regional signature."
};

const QUESTION_LABEL: Record<Act2Question, string> = {
  ask_hongqu: "红曲的颜色",
  ask_winter: "冬酿的节气",
  ask_future: "传承的以后"
};

const INSCRIPTION_LABEL: Record<Act3Inscription, string> = {
  warm: "暖",
  inherit: "承",
  remember: "念"
};

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function pathKey(state: ChapterOneSaveV2): string {
  return [
    state.act1Sense,
    state.act2Question ?? "unset",
    state.act3Inscription ?? "unset",
    state.act4Explanation ?? "unset"
  ].join("|");
}

export function generateCultureLabel(
  state: ChapterOneSaveV2
): CultureLabel {
  const name = NAME_BY_SENSE[state.act1Sense];
  const explanation = state.act4Explanation ?? "letter";
  const question = state.act2Question ?? "ask_hongqu";
  const inscription = state.act3Inscription ?? "warm";
  const pathHash = stableHash(pathKey(state));
  const creativeText =
    state.labelTemplate === 0
      ? `太婆把一个冬天封进坛里，又把一碗老酒面线端到人前。林怡最终接住的，是“${INSCRIPTION_LABEL[inscription]}”留下的回声。`
      : `从红曲染过的指尖，到异乡公寓里被揭开的坛口，太婆没有写完的家书，由林怡沿着“${QUESTION_LABEL[question]}”继续读了下去。`;

  return {
    chineseName: name.chinese,
    englishName: name.english,
    englishIntro: INTRO_BY_EXPLANATION[explanation],
    culturalFact:
      "文化事实：福建红曲黄酒以谷物为原料，红曲是其具有辨识度的地方酿造传统之一。",
    creativeText,
    pathSummary: [
      `第一眼 · ${state.act1Sense}`,
      `冬酿追问 · ${question}`,
      `酒盏铭文 · ${INSCRIPTION_LABEL[inscription]}`,
      `表达角度 · ${explanation}`
    ],
    templateSource: "LOCAL_TEMPLATE_V1",
    pathHash
  };
}

export function createDemoMint(
  label: CultureLabel
): DemoMintReceipt {
  return {
    tokenId: `DEMO-${label.pathHash.toUpperCase()}`,
    pathHash: label.pathHash,
    status: "local-demo",
    network: "none"
  };
}
