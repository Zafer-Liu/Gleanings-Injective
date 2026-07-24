import taipoNoteImage from "../../../assets/rpg_v2/collection/taipo-note.png";

const badgeImage = (filename: string) =>
  `/collection/badges/${filename}`;

export type CollectibleKind = "item" | "badge";
export type CollectibleFilter = "all" | CollectibleKind;

type LocalizedText = {
  zh: string;
  en: string;
};

export type CollectibleDefinition = {
  id: string;
  i18nKey: string;
  kind: CollectibleKind;
  rewardIds: readonly string[];
  name: LocalizedText;
  description: LocalizedText;
  source: LocalizedText;
  image?: string;
};

export type Collectible = {
  id: string;
  i18nKey: string;
  kind: CollectibleKind;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  source: string;
  sourceEn: string;
  image?: string;
};

export type ChainCollectibleItem = {
  collectible_id?: string;
  medal_id?: string;
  badge_id?: string;
  i18n_key?: string;
  category?: string;
  name?: string;
  name_zh?: string;
  name_en?: string;
  description?: string;
  description_zh?: string;
  description_en?: string;
  source?: string;
  source_zh?: string;
  source_en?: string;
  image?: string;
};

const ITEM_CATALOG: readonly CollectibleDefinition[] = [
  {
    id: "item_taipo_note",
    i18nKey: "collectibles.items.great_grandmothers_note",
    kind: "item",
    rewardIds: ["item_taipo_note"],
    name: {
      zh: "太婆字条",
      en: "Great-grandmother's Note"
    },
    description: {
      zh: "太婆留在纸箱里的字条，是通往冬酿记忆的第一把钥匙。",
      en: "A note left in the carton, the first key to the memory of winter brewing."
    },
    source: {
      zh: "《拾遗》· 第一章 / 纸箱",
      en: "Gleanings · Chapter One / Carton"
    },
    image: taipoNoteImage
  }
];

export const BADGE_CATALOG: readonly CollectibleDefinition[] = [
  {
    id: "badge_ch1_winter_brew_seal",
    i18nKey: "collectibles.badges.winter_brew_seal",
    kind: "badge",
    rewardIds: ["act1-winter-brewing"],
    name: { zh: "冬酿印", en: "Winter Brew Seal" },
    description: {
      zh: "揭开旧坛封口时留下的第一枚记忆印记。",
      en: "The first memory seal, found when the old winter-brew jar was opened."
    },
    source: {
      zh: "《拾遗》· 第一章 / 开坛",
      en: "Gleanings · Chapter One / Opening the Jar"
    },
    image: badgeImage("winter-brew-seal.png")
  },
  {
    id: "badge_ch1_red_koji_trace",
    i18nKey: "collectibles.badges.red_koji_trace",
    kind: "badge",
    rewardIds: [
      "relic_dongniang_common",
      "relic_dongniang_rare",
      "relic_liubai_legendary"
    ],
    name: { zh: "红曲痕", en: "Red Koji Trace" },
    description: {
      zh: "红曲、谷物与冬日温度共同留下的酿造痕迹。",
      en: "A brewing trace left by red koji, grain, and the measured cold of winter."
    },
    source: {
      zh: "《拾遗》· 第一章 / 冬酿坊",
      en: "Gleanings · Chapter One / Winter Brewery"
    },
    image: badgeImage("red-koji-trace.png")
  },
  {
    id: "badge_ch1_warm_wine_cup",
    i18nKey: "collectibles.badges.warm_wine_cup",
    kind: "badge",
    rewardIds: [
      "relic_blue_white_cup_warm",
      "relic_blue_white_cup_inherit",
      "relic_blue_white_cup_remember"
    ],
    name: { zh: "温酒盏", en: "Warm Wine Cup" },
    description: {
      zh: "一盏热面线旁的温酒，收住家宴里未说尽的话。",
      en: "A warm cup beside the family noodles, holding the words the meal left unsaid."
    },
    source: {
      zh: "《拾遗》· 第一章 / 家宴",
      en: "Gleanings · Chapter One / Family Banquet"
    },
    image: badgeImage("warm-wine-cup.png")
  },
  {
    id: "badge_ch1_fujian_aged_rice_wine",
    i18nKey: "collectibles.badges.fujian_aged_rice_wine",
    kind: "badge",
    rewardIds: ["relic_one_jar_echo"],
    name: {
      zh: "福建老酒",
      en: "Fujian Aged Rice Wine"
    },
    description: {
      zh: "完成第一章所得的文化纪念，记录福建红曲黄酒的酿造与家族记忆。",
      en: "A chapter keepsake recording Fujian red-koji rice wine and the family memories carried by its craft."
    },
    source: {
      zh: "《拾遗》· 第一章 / 一坛回声",
      en: "Gleanings · Chapter One / Echoes of a Jar"
    },
    image: badgeImage("fujian-aged-rice-wine.png")
  },
  {
    id: "badge_ch2_old_tea_scoop",
    i18nKey: "collectibles.badges.old_tea_scoop",
    kind: "badge",
    rewardIds: ["relic_old_tea_scoop"],
    name: { zh: "旧茶斗", en: "Old Tea Scoop" },
    description: {
      zh: "旧茶罐旁的一只茶斗，引出被覆盖的批次与来处。",
      en: "An old scoop beside the tea tins, pointing toward a hidden batch and origin."
    },
    source: {
      zh: "《拾遗》· 第二章 / 旧茶市场",
      en: "Gleanings · Chapter Two / Old Tea Market"
    },
    image: badgeImage("old-tea-scoop.png")
  },
  {
    id: "badge_ch2_qingming_bud",
    i18nKey: "collectibles.badges.qingming_bud",
    kind: "badge",
    rewardIds: ["relic_qingming_bud"],
    name: { zh: "清明芽", en: "Qingming Bud" },
    description: {
      zh: "在清明前的茶园中，经十二次判断留下的一枚嫩芽。",
      en: "A tender bud kept after twelve careful choices in the pre-Qingming tea garden."
    },
    source: {
      zh: "《拾遗》· 第二章 / 清明茶园",
      en: "Gleanings · Chapter Two / Qingming Tea Garden"
    },
    image: badgeImage("qingming-bud.png")
  },
  {
    id: "badge_ch2_hand_fire_mark",
    i18nKey: "collectibles.badges.hand_fire_mark",
    kind: "badge",
    rewardIds: ["relic_palm_fire"],
    name: { zh: "掌火纹", en: "Hand-Fire Mark" },
    description: {
      zh: "看叶、听叶、感温之后，手掌记住的一道火候。",
      en: "A mark of heat remembered by the hand after watching, listening to, and feeling the leaves."
    },
    source: {
      zh: "《拾遗》· 第二章 / 炒茶工坊",
      en: "Gleanings · Chapter Two / Tea Firing Workshop"
    },
    image: badgeImage("hand-fire-mark.png")
  },
  {
    id: "badge_ch2_west_lake_longjing",
    i18nKey: "collectibles.badges.west_lake_longjing",
    kind: "badge",
    rewardIds: ["relic_one_leaf_origin"],
    name: {
      zh: "西湖龙井",
      en: "West Lake Longjing Tea"
    },
    description: {
      zh: "完成第二章所得的文化纪念，记录一片龙井茶叶的节气、手艺与真实来处。",
      en: "A chapter keepsake recording the season, handcraft, and true origin behind a Longjing tea leaf."
    },
    source: {
      zh: "《拾遗》· 第二章 / 名字的重量",
      en: "Gleanings · Chapter Two / The Weight of a Name"
    },
    image: badgeImage("west-lake-longjing-tea.png")
  }
];

export const COLLECTIBLE_CATALOG: readonly CollectibleDefinition[] =
  [...ITEM_CATALOG, ...BADGE_CATALOG];

const definitionsById = new Map<string, CollectibleDefinition>();
for (const definition of COLLECTIBLE_CATALOG) {
  definitionsById.set(definition.id, definition);
  for (const rewardId of definition.rewardIds) {
    definitionsById.set(rewardId, definition);
  }
}

function materialize(
  definition: CollectibleDefinition
): Collectible {
  return {
    id: definition.id,
    i18nKey: definition.i18nKey,
    kind: definition.kind,
    name: definition.name.zh,
    nameEn: definition.name.en,
    description: definition.description.zh,
    descriptionEn: definition.description.en,
    source: definition.source.zh,
    sourceEn: definition.source.en,
    image: definition.image
  };
}

function readValue(
  storage: Pick<Storage, "getItem">,
  key: string
): unknown {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function readRecord(
  storage: Pick<Storage, "getItem">,
  key: string
): Record<string, unknown> | null {
  const value = readValue(storage, key);
  return typeof value === "object" && value !== null &&
    !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string =>
        typeof item === "string"
      )
    : [];
}

export function loadCollectedItems(
  storage: Pick<Storage, "getItem"> = window.localStorage
): Collectible[] {
  const unlocked = new Set<string>();
  const unlock = (id: string) => {
    const definition = definitionsById.get(id);
    if (definition !== undefined) unlocked.add(definition.id);
  };

  const legacy = readRecord(
    storage,
    "gleanings.act1.save.v1"
  );
  stringArray(legacy?.inventory).forEach(unlock);
  if (legacy?.act1Complete === true) {
    unlock("act1-winter-brewing");
  }
  const legacyMedals = readValue(
    storage,
    "gleanings.medals.v1"
  );
  if (Array.isArray(legacyMedals)) {
    for (const medal of legacyMedals) {
      if (
        typeof medal === "object" &&
        medal !== null &&
        "id" in medal &&
        typeof medal.id === "string"
      ) {
        unlock(medal.id);
      }
    }
  }

  const chapterOne = readRecord(
    storage,
    "gleanings.chapter-one.save.v2"
  );
  if (chapterOne?.version === 2) {
    unlock("act1-winter-brewing");
    stringArray(chapterOne.relics).forEach(unlock);
  }

  const chapterTwo = readRecord(
    storage,
    "gleanings.chapter-two.save.v1"
  );
  stringArray(chapterTwo?.relics).forEach(unlock);

  return COLLECTIBLE_CATALOG
    .filter((definition) => unlocked.has(definition.id))
    .map(materialize);
}

function chainKind(item: ChainCollectibleItem): CollectibleKind {
  const category = item.category?.trim().toLowerCase();
  return (
    item.medal_id !== undefined ||
    item.badge_id !== undefined ||
    category === "badge" ||
    category === "medal" ||
    item.category === "勋章" ||
    item.category === "徽章"
  )
    ? "badge"
    : "item";
}

export function collectibleFromChainItem(
  item: ChainCollectibleItem,
  tokenId: string
): Collectible {
  const receivedId =
    item.collectible_id ??
    item.badge_id ??
    item.medal_id ??
    `chain-token-${tokenId}`;
  const definition = definitionsById.get(receivedId);
  if (definition !== undefined) return materialize(definition);

  const name = item.name_zh ?? item.name ??
    `链上藏品 #${tokenId}`;
  const description =
    item.description_zh ??
    item.description ??
    "从钱包同步的链上收藏。";
  const source =
    item.source_zh ??
    item.source ??
    "Injective EVM Testnet";
  return {
    id: receivedId,
    i18nKey:
      item.i18n_key ??
      `collectibles.chain.${receivedId}`,
    kind: chainKind(item),
    name,
    nameEn: item.name_en ?? item.name ?? name,
    description,
    descriptionEn:
      item.description_en ??
      item.description ??
      description,
    source,
    sourceEn: item.source_en ?? item.source ?? source,
    image: item.image
  };
}

export function mergeCollectibles(
  local: readonly Collectible[],
  chain: readonly Collectible[]
): Collectible[] {
  const merged = new Map<string, Collectible>();
  for (const collectible of [...local, ...chain]) {
    if (!merged.has(collectible.id)) {
      merged.set(collectible.id, collectible);
    }
  }
  return [...merged.values()];
}

export function filterCollectibles(
  collectibles: readonly Collectible[],
  filter: CollectibleFilter
): Collectible[] {
  return filter === "all"
    ? [...collectibles]
    : collectibles.filter((item) => item.kind === filter);
}

export function collectibleKindLabel(
  kind: CollectibleKind
): "道具" | "徽章" {
  return kind === "badge" ? "徽章" : "道具";
}

export function mintItemForCollectible(
  collectible: Collectible,
  imageOrigin: string
) {
  return {
    name: collectible.name,
    name_zh: collectible.name,
    name_en: collectible.nameEn,
    item_type:
      collectible.kind === "badge"
        ? "Gleanings Badge"
        : "Gleanings Item",
    collectible_id: collectible.id,
    badge_id:
      collectible.kind === "badge"
        ? collectible.id
        : undefined,
    category: collectible.kind,
    i18n_key: collectible.i18nKey,
    rarity: "Story",
    description: collectible.description,
    description_zh: collectible.description,
    description_en: collectible.descriptionEn,
    source: collectible.source,
    source_zh: collectible.source,
    source_en: collectible.sourceEn,
    image: collectible.image
      ? new URL(collectible.image, imageOrigin).href
      : undefined
  };
}
