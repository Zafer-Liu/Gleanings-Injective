import type {
  ChapterDialogueLine,
  ChapterInteractable,
  ChapterMapContent,
  ChapterQuestContent
} from "../chapter/types";
import { CHARACTERS } from "../characters";
import type {
  LongjingInscription,
  LongjingLeafKind
} from "../../game/domain/longjingState";

const TILE_SIZE = 32;

function boundaryCollisions(
  width: number,
  height: number
): ChapterMapContent["collisions"] {
  return [
    { id: "boundary_top", x: 0, y: 0, width, height: 2 },
    {
      id: "boundary_bottom",
      x: 0,
      y: height - 2,
      width,
      height: 2
    },
    { id: "boundary_left", x: 0, y: 0, width: 2, height },
    {
      id: "boundary_right",
      x: width - 2,
      y: 0,
      width: 2,
      height
    }
  ];
}

export const LONGJING_OBJECT_LAYOUT = {
  workshop: {
    northShelf: { x: 4, y: 4, width: 10, height: 2 },
    dryingRack: { x: 27, y: 5, width: 8, height: 3 },
    stove: { x: 17, y: 12, width: 7, height: 4 },
    ledgerTable: { x: 28, y: 11, width: 6, height: 3 },
    basketStack: { x: 5, y: 17, width: 5, height: 3 }
  },
  truth: {
    oldCabinet: { x: 4, y: 5, width: 7, height: 3 },
    sealedStove: { x: 13, y: 5, width: 7, height: 4 },
    signatureCabinet: { x: 24, y: 5, width: 6, height: 3 },
    teaTable: { x: 13, y: 13, width: 8, height: 3 },
    signboard: { x: 4, y: 15, width: 5, height: 2 }
  }
} as const;

export const LONGJING_MAPS = {
  market: {
    size: { width: 38, height: 26 },
    tileSize: TILE_SIZE,
    playerSpawn: { x: 18, y: 18 },
    npcSpawns: {
      mia: { x: 20, y: 18 },
      vendor: { x: 18, y: 16 },
      chen: { x: 31, y: 12 }
    },
    collisions: [
      ...boundaryCollisions(38, 26),
      { id: "stall_west", x: 4, y: 5, width: 9, height: 4 },
      { id: "stall_north", x: 15, y: 4, width: 8, height: 4 },
      { id: "tea_house", x: 28, y: 4, width: 8, height: 7 },
      { id: "tin_table", x: 14, y: 14, width: 6, height: 2 },
      { id: "record_table", x: 22, y: 14, width: 5, height: 2 }
    ],
    occluders: []
  },
  terrace: {
    size: { width: 48, height: 32 },
    tileSize: TILE_SIZE,
    playerSpawn: { x: 23, y: 21 },
    npcSpawns: {
      masterHe: { x: 23, y: 20 },
      merchant: { x: 42, y: 25 }
    },
    collisions: [
      ...boundaryCollisions(48, 32),
      { id: "tea_row_a1", x: 4, y: 5, width: 8, height: 2 },
      { id: "tea_row_a2", x: 15, y: 5, width: 8, height: 2 },
      { id: "tea_row_a3", x: 26, y: 5, width: 8, height: 2 },
      { id: "tea_row_a4", x: 37, y: 5, width: 7, height: 2 },
      { id: "tea_row_b1", x: 4, y: 11, width: 8, height: 2 },
      { id: "tea_row_b2", x: 15, y: 11, width: 8, height: 2 },
      { id: "tea_row_b3", x: 26, y: 11, width: 8, height: 2 },
      { id: "tea_row_b4", x: 37, y: 11, width: 7, height: 2 },
      { id: "tea_row_c1", x: 4, y: 17, width: 8, height: 2 },
      { id: "tea_row_c2", x: 15, y: 17, width: 8, height: 2 },
      { id: "tea_row_c3", x: 26, y: 17, width: 8, height: 2 },
      { id: "tea_row_c4", x: 37, y: 17, width: 7, height: 2 },
      { id: "pavilion", x: 39, y: 23, width: 5, height: 4 }
    ],
    occluders: []
  },
  workshop: {
    size: { width: 40, height: 28 },
    tileSize: TILE_SIZE,
    playerSpawn: { x: 20, y: 19 },
    npcSpawns: {
      youngChen: { x: 20, y: 19 },
      masterHe: { x: 23, y: 18 },
      merchant: { x: 31, y: 12 }
    },
    collisions: [
      ...boundaryCollisions(40, 28),
      {
        id: "north_shelf",
        ...LONGJING_OBJECT_LAYOUT.workshop.northShelf
      },
      {
        id: "drying_rack",
        ...LONGJING_OBJECT_LAYOUT.workshop.dryingRack
      },
      { id: "stove", ...LONGJING_OBJECT_LAYOUT.workshop.stove },
      {
        id: "ledger_table",
        ...LONGJING_OBJECT_LAYOUT.workshop.ledgerTable
      },
      {
        id: "basket_stack",
        ...LONGJING_OBJECT_LAYOUT.workshop.basketStack
      }
    ],
    occluders: []
  },
  truth: {
    size: { width: 34, height: 24 },
    tileSize: TILE_SIZE,
    playerSpawn: { x: 16, y: 19 },
    npcSpawns: {
      mia: { x: 18, y: 19 },
      chen: { x: 16, y: 17 }
    },
    collisions: [
      ...boundaryCollisions(34, 24),
      {
        id: "old_cabinet",
        ...LONGJING_OBJECT_LAYOUT.truth.oldCabinet
      },
      {
        id: "sealed_stove",
        ...LONGJING_OBJECT_LAYOUT.truth.sealedStove
      },
      {
        id: "signature_cabinet",
        ...LONGJING_OBJECT_LAYOUT.truth.signatureCabinet
      },
      {
        id: "tea_table",
        ...LONGJING_OBJECT_LAYOUT.truth.teaTable
      },
      {
        id: "signboard",
        ...LONGJING_OBJECT_LAYOUT.truth.signboard
      }
    ],
    occluders: []
  }
} satisfies Record<string, ChapterMapContent>;

export const LONGJING_MARKET_INTERACTABLES: ChapterInteractable[] = [
  {
    id: "market_vendor",
    tile: { x: 18, y: 16 },
    range: 1,
    prompt: "E · 问旧货摊主",
    dialogueGroup: "marketVendor",
    enabledPhases: ["ARRIVE"]
  },
  {
    id: "tea_tin_a",
    tile: { x: 15, y: 16 },
    range: 1,
    prompt: "E · 查看第一罐茶",
    dialogueGroup: "tinA",
    enabledPhases: ["INSPECT_TIN_A"]
  },
  {
    id: "tea_tin_b",
    tile: { x: 18, y: 16 },
    range: 1,
    prompt: "E · 对照第二罐茶",
    dialogueGroup: "tinB",
    enabledPhases: ["INSPECT_TIN_B"]
  },
  {
    id: "market_records",
    tile: { x: 23, y: 16 },
    range: 1,
    prompt: "E · 核对市场记录",
    dialogueGroup: "marketRecords",
    enabledPhases: ["RECORDS"]
  },
  {
    id: "provenance_board",
    tile: { x: 25, y: 17 },
    range: 1,
    prompt: "E · 整理来处板",
    dialogueGroup: "boardIntro",
    enabledPhases: ["BOARD"]
  },
  {
    id: "old_tea_scoop",
    tile: { x: 31, y: 12 },
    range: 1,
    prompt: "E · 触碰旧茶斗",
    dialogueGroup: "teaScoop",
    enabledPhases: ["TEA_SCOOP"]
  }
];

export type LongjingPickingLeaf = {
  id: string;
  tile: { x: number; y: number };
  kind: LongjingLeafKind;
  label: string;
  feedback: string;
};

export const LONGJING_PICKING_LEAVES: LongjingPickingLeaf[] = [
  {
    id: "leaf_01",
    tile: { x: 10, y: 20 },
    kind: "tender",
    label: "嫩度匀齐、叶面完整",
    feedback: "这一片符合今天这一锅的要求，轻提，不要掐伤。"
  },
  {
    id: "leaf_02",
    tile: { x: 14, y: 20 },
    kind: "too_young",
    label: "芽头尚小，叶片未展",
    feedback: "它还可以再长一长。今天不摘，也是采茶的一部分。"
  },
  {
    id: "leaf_03",
    tile: { x: 21, y: 20 },
    kind: "mature",
    label: "叶片已经明显展开",
    feedback: "这片叶并非不好，只是与今天这一锅的嫩度不一致。"
  },
  {
    id: "leaf_04",
    tile: { x: 25, y: 20 },
    kind: "wet",
    label: "叶面还挂着雨水",
    feedback: "雨水会改变后续受热。先等叶面干爽，再作判断。"
  },
  {
    id: "leaf_05",
    tile: { x: 32, y: 20 },
    kind: "damaged",
    label: "叶缘有明显损伤",
    feedback: "把它留在枝上观察，不混进这一锅。"
  },
  {
    id: "leaf_06",
    tile: { x: 36, y: 20 },
    kind: "tender",
    label: "嫩度匀齐、叶面完整",
    feedback: "看准以后再下手，动作反而会更快。"
  },
  {
    id: "leaf_07",
    tile: { x: 10, y: 14 },
    kind: "tender",
    label: "叶片舒展，大小相近",
    feedback: "这一片可以入篓。记住它离枝时的手感。"
  },
  {
    id: "leaf_08",
    tile: { x: 14, y: 14 },
    kind: "mature",
    label: "叶片较大，茎部偏硬",
    feedback: "不要只追求数量。原料不匀，锅里更难照顾。"
  },
  {
    id: "leaf_09",
    tile: { x: 25, y: 14 },
    kind: "tender",
    label: "叶色清润，芽叶完整",
    feedback: "合适。用指腹提起，不要用指甲截断。"
  },
  {
    id: "leaf_10",
    tile: { x: 36, y: 14 },
    kind: "wet",
    label: "叶尖仍有水珠",
    feedback: "先放过它。节气不是催促你忽略叶子的理由。"
  },
  {
    id: "leaf_11",
    tile: { x: 14, y: 8 },
    kind: "tender",
    label: "嫩度匀齐、没有损伤",
    feedback: "这一片合适。竹篓不要压得太满。"
  },
  {
    id: "leaf_12",
    tile: { x: 36, y: 8 },
    kind: "tender",
    label: "芽叶完整，叶面干爽",
    feedback: "最后一片。先看叶，再动手。"
  }
];

export const LONGJING_TRUTH_INTERACTABLES: ChapterInteractable[] = [
  {
    id: "chen_ledger",
    tile: { x: 16, y: 17 },
    range: 1,
    prompt: "E · 请陈守一打开旧柜",
    dialogueGroup: "truthLedger",
    enabledPhases: ["ARRIVE"]
  },
  {
    id: "original_batch",
    tile: { x: 7, y: 9 },
    range: 1,
    prompt: "E · 查看原始批次账",
    dialogueGroup: "originalBatch",
    enabledPhases: ["COLLECT", "BOARD"]
  },
  {
    id: "refusal_copy",
    tile: { x: 27, y: 9 },
    range: 1,
    prompt: "E · 查看拒签留底",
    dialogueGroup: "refusalCopy",
    enabledPhases: ["COLLECT", "BOARD"]
  },
  {
    id: "truth_board",
    tile: { x: 17, y: 16 },
    range: 1,
    prompt: "E · 完成来源声明",
    dialogueGroup: "truthStatement",
    enabledPhases: ["BOARD"]
  },
  {
    id: "inscription_table",
    tile: { x: 17, y: 16 },
    range: 1,
    prompt: "E · 为藏品题词",
    dialogueGroup: "inscriptionIntro",
    enabledPhases: ["INSCRIPTION"]
  }
];

const narrator = (
  text: string,
  speakerName = "旁白"
): ChapterDialogueLine => ({
  speakerId: "narrator",
  speakerName,
  text
});

const line = (
  speakerId: string,
  speakerName: string,
  text: string
): ChapterDialogueLine => ({ speakerId, speakerName, text });

export const longjingDialogue: Record<
  string,
  ChapterDialogueLine[]
> = {
  marketOpening: [
    narrator("杭州的春雨刚停。拾遗馆收到两罐来自不同卖家的旧茶。"),
    line(
      CHARACTERS.mia.id,
      CHARACTERS.mia.displayName,
      "都写着“西湖龙井”，罐子却完全不一样。"
    ),
    line(
      CHARACTERS.protagonist.id,
      CHARACTERS.protagonist.displayName,
      "先看记录。名字越响，越不能只看包装。"
    )
  ],
  marketVendor: [
    line("vendor", "旧货摊主", "一罐来自清仓，一罐是寄卖。我只保留了随货卡。"),
    line(
      CHARACTERS.mia.id,
      CHARACTERS.mia.displayName,
      "那我们从两张卡开始。"
    )
  ],
  tinA: [
    narrator("罐甲：剧情批次 WLLJ-17-0422，随货卡写着“四月三日采制”。"),
    line(
      CHARACTERS.protagonist.id,
      CHARACTERS.protagonist.displayName,
      "先记下声明，不急着把它当成证明。"
    )
  ],
  tinB: [
    narrator("罐乙使用了同一批次编号，采制日期却写着“四月七日”。"),
    line(
      CHARACTERS.mia.id,
      CHARACTERS.mia.displayName,
      "同一批次，为什么会有两个日期？"
    ),
    line(
      CHARACTERS.protagonist.id,
      CHARACTERS.protagonist.displayName,
      "也可能只是填错。先别判它，我们去找记录。"
    )
  ],
  marketRecords: [
    narrator("旧票据指向一处集散仓，无法与包装上声明的来源互相印证。"),
    line(
      CHARACTERS.mia.id,
      CHARACTERS.mia.displayName,
      "落款是“守一茶坊”，但电话十二年前就停用了。"
    )
  ],
  boardIntro: [
    narrator("把包装声明、可核记录与矛盾分开，问题才露出真正的形状。"),
    line(
      CHARACTERS.protagonist.id,
      CHARACTERS.protagonist.displayName,
      "包装声明本身，不能证明包装声明。"
    )
  ],
  teaScoop: [
    line(
      CHARACTERS.chenShouyi.id,
      CHARACTERS.chenShouyi.displayName,
      "茶是不是好喝，是一件事。该不该叫这个名字，是另一件事。"
    ),
    narrator("旧茶斗被指腹碰到的一刻，焦香、雨声和一双年轻的手同时涌来。")
  ],
  terraceOpening: [
    narrator("多年前，清明前的一场雨刚刚收住。"),
    line(
      CHARACTERS.masterHe.id,
      CHARACTERS.masterHe.displayName,
      "守一，今天不是比谁摘得多。先替这一锅挑对叶子。"
    )
  ],
  terraceStart: [
    line("young_chen", "青年陈守一", "同一棵树，怎么还有这么多不能摘的？"),
    line(
      CHARACTERS.masterHe.id,
      CHARACTERS.masterHe.displayName,
      "不是不能摘，是先问这一片叶该不该在今天离开枝头。"
    )
  ],
  terraceEnd: [
    line("merchant", "收货人", "做得一样扁，装进好看的罐子就行。"),
    line("young_chen", "青年陈守一", "形一样，来处也能一样吗？")
  ],
  workshopOpening: [
    line(
      CHARACTERS.masterHe.id,
      CHARACTERS.masterHe.displayName,
      "手法没有固定次序，锅里的叶子才是口令。"
    ),
    narrator("看叶色、听摩擦声、感受手心的温度，再决定下一步。")
  ],
  workshopMemory: [
    line("merchant", "经销人", "做得一样扁，客人看不出来。旧批号还可以继续用。"),
    line(
      CHARACTERS.chenShouyi.id,
      CHARACTERS.chenShouyi.displayName,
      "叶子能压成一样的形，来处压不出来。这个字，我不签。"
    ),
    narrator("签样后来被人绕开茶坊复制。陈守一摘下招牌，也封住了自己的锅。")
  ],
  truthOpening: [
    narrator("记忆退去，茶坊仍在原处。米娅扶住了林念安。"),
    line(
      CHARACTERS.protagonist.id,
      CHARACTERS.protagonist.displayName,
      "我看见了当年的拒签，但记忆不能代替今天的记录。"
    )
  ],
  truthLedger: [
    line(
      CHARACTERS.chenShouyi.id,
      CHARACTERS.chenShouyi.displayName,
      "旧账和留底都在柜里。你们自己对。"
    )
  ],
  originalBatch: [
    narrator("原始账本保留了守一茶坊当年的批次范围，与两只茶罐上的编号不符。")
  ],
  refusalCopy: [
    narrator("拒签留底上的版式，与茶罐后来复用的旧签样一致。")
  ],
  truthStatement: [
    narrator(
      "两罐产品的包装信息存在重复与矛盾，且使用了未经授权的旧签样。现有记录不能支持其所声明的来处，应停止使用误导性信息，并应提交进一步核查。",
      "来源声明"
    )
  ],
  inscriptionIntro: [
    line(
      CHARACTERS.mia.id,
      CHARACTERS.mia.displayName,
      "我们留下的不是一句“真假”，而是一条还能被别人核对的路。"
    )
  ],
  endingRestoreName: [
    line(
      CHARACTERS.chenShouyi.id,
      CHARACTERS.chenShouyi.displayName,
      "名字放回原处，人才能把路走明白。"
    )
  ],
  endingKeepTruth: [
    line(
      CHARACTERS.chenShouyi.id,
      CHARACTERS.chenShouyi.displayName,
      "不急着喊破，先把每一页留住。"
    )
  ],
  endingPassOn: [
    line(
      CHARACTERS.chenShouyi.id,
      CHARACTERS.chenShouyi.displayName,
      "锅不开，手艺就只剩一个说法。"
    )
  ],
  finalTea: [
    narrator("陈守一擦净封存多年的锅，决定明天开一堂公开课。"),
    line(
      CHARACTERS.mia.id,
      CHARACTERS.mia.displayName,
      "第一课教什么？"
    ),
    line(
      CHARACTERS.chenShouyi.id,
      CHARACTERS.chenShouyi.displayName,
      "先教他们问——这片叶，从哪里来。"
    )
  ]
};

export function longjingLines(id: string): ChapterDialogueLine[] {
  return longjingDialogue[id] ?? [];
}

export const LONGJING_INSCRIPTION_CHOICES: Array<{
  value: LongjingInscription;
  label: string;
  feedback: string;
}> = [
  {
    value: "restore_name",
    label: "还名 · 把名字放回真实来处",
    feedback: "地名不是一种外形，它来自具体地方与可核记录。"
  },
  {
    value: "keep_truth",
    label: "留真 · 留下可继续核查的证据",
    feedback: "不靠耸动判断，只保留能被下一双眼睛复核的线索。"
  },
  {
    value: "pass_on",
    label: "传手 · 让技艺重新回到人手之间",
    feedback: "手艺活在观察、练习、待客和传授之中。"
  }
];

export const LONGJING_QUESTS: Record<
  string,
  ChapterQuestContent
> = {
  market_ARRIVE: {
    id: "market_ARRIVE",
    title: "问清两罐茶的来路",
    hint: "旧货摊主正在市场中央等你。"
  },
  market_INSPECT_TIN_A: {
    id: "market_INSPECT_TIN_A",
    title: "查看第一罐茶",
    hint: "先记包装声明，不急着下结论。"
  },
  market_INSPECT_TIN_B: {
    id: "market_INSPECT_TIN_B",
    title: "对照第二罐茶",
    hint: "比较批次编号和采制日期。"
  },
  market_RECORDS: {
    id: "market_RECORDS",
    title: "核对市场记录",
    hint: "在右侧账桌查找票据和旧电话。"
  },
  market_BOARD: {
    id: "market_BOARD",
    title: "整理来处板",
    hint: "把声明、记录和矛盾分别放好。"
  },
  market_TEA_SCOOP: {
    id: "market_TEA_SCOOP",
    title: "前往守一茶坊",
    hint: "关闭的茶坊在街道东北侧。"
  },
  terrace_ARRIVE: {
    id: "terrace_ARRIVE",
    title: "听何师傅讲今天这一锅",
    hint: "先去茶垄下方与何师傅交谈。"
  },
  terrace_PICKING: {
    id: "terrace_PICKING",
    title: "完成十二次芽叶判断",
    hint: "观察当前箭头指向的芽叶。"
  },
  workshop_ARRIVE: {
    id: "workshop_ARRIVE",
    title: "跟何师傅来到锅台",
    hint: "先听锅里的叶子发出什么声音。"
  },
  workshop_FIRING: {
    id: "workshop_FIRING",
    title: "根据叶片状态完成炒制",
    hint: "手法没有固定次序，感官提示才是口令。"
  },
  workshop_MEMORY: {
    id: "workshop_MEMORY",
    title: "看完陈守一拒签的记忆",
    hint: "账桌旁还压着那张旧签样。"
  },
  truth_ARRIVE: {
    id: "truth_ARRIVE",
    title: "请陈守一打开旧柜",
    hint: "记忆不能代替现代记录。"
  },
  truth_COLLECT: {
    id: "truth_COLLECT",
    title: "核对旧账与拒签留底",
    hint: "茶坊两侧各保留了一份记录。"
  },
  truth_BOARD: {
    id: "truth_BOARD",
    title: "完成来源声明",
    hint: "回到中央茶桌，连接全部证据。"
  },
  truth_INSCRIPTION: {
    id: "truth_INSCRIPTION",
    title: "为《一叶来处》题词",
    hint: "选择不会改变事实，只改变你留下的侧重。"
  }
};

export function longjingQuest(
  act: "market" | "terrace" | "workshop" | "truth",
  phase: string
): ChapterQuestContent {
  return (
    LONGJING_QUESTS[`${act}_${phase}`] ?? {
      id: `${act}_${phase}`,
      title: "继续寻找来处",
      hint: ""
    }
  );
}
