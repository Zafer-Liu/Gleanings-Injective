import { describe, expect, it } from "vitest";
import {
  BADGE_CATALOG,
  collectibleFromChainItem,
  filterCollectibles,
  loadCollectedItems,
  mergeCollectibles,
  mintItemForCollectible
} from "./collectibleCatalog";

function storageWith(
  values: Record<string, unknown>
): Pick<Storage, "getItem"> {
  return {
    getItem(key: string) {
      return key in values
        ? JSON.stringify(values[key])
        : null;
    }
  };
}

describe("collectible catalog", () => {
  it("将两章旧奖励归一化为八枚稳定徽章", () => {
    const storage = storageWith({
      "gleanings.act1.save.v1": {
        inventory: ["item_taipo_note"],
        act1Complete: true
      },
      "gleanings.chapter-one.save.v2": {
        version: 2,
        relics: [
          "relic_dongniang_common",
          "relic_dongniang_rare",
          "relic_blue_white_cup_inherit",
          "relic_one_jar_echo"
        ]
      },
      "gleanings.chapter-two.save.v1": {
        version: 1,
        relics: [
          "relic_old_tea_scoop",
          "relic_qingming_bud",
          "relic_palm_fire",
          "relic_one_leaf_origin"
        ]
      }
    });

    const collectibles = loadCollectedItems(storage);
    const badges = collectibles.filter(
      (item) => item.kind === "badge"
    );

    expect(badges).toHaveLength(8);
    expect(badges.map((item) => item.id)).toEqual([
      "badge_ch1_winter_brew_seal",
      "badge_ch1_red_koji_trace",
      "badge_ch1_warm_wine_cup",
      "badge_ch1_fujian_aged_rice_wine",
      "badge_ch2_old_tea_scoop",
      "badge_ch2_qingming_bud",
      "badge_ch2_hand_fire_mark",
      "badge_ch2_west_lake_longjing"
    ]);
    expect(badges.map((item) => item.name)).toEqual([
      "冬酿印",
      "红曲痕",
      "温酒盏",
      "福建老酒",
      "旧茶斗",
      "清明芽",
      "掌火纹",
      "西湖龙井"
    ]);
    expect(collectibles.find((item) =>
      item.id === "item_taipo_note"
    )?.kind).toBe("item");
  });

  it("第一章 v2 存档本身可证明开坛已完成", () => {
    const collectibles = loadCollectedItems(
      storageWith({
        "gleanings.chapter-one.save.v2": {
          version: 2,
          relics: []
        }
      })
    );

    expect(collectibles.map((item) => item.name)).toContain(
      "冬酿印"
    );
  });

  it("兼容仅保留旧 MedalService 记录的玩家", () => {
    const collectibles = loadCollectedItems(
      storageWith({
        "gleanings.medals.v1": [
          {
            id: "act1-winter-brewing",
            name: "冬酿守忆章"
          }
        ]
      })
    );

    expect(collectibles).toMatchObject([
      {
        id: "badge_ch1_winter_brew_seal",
        name: "冬酿印",
        kind: "badge"
      }
    ]);
  });

  it("每枚徽章都有短中文名、英文名、国际化键和 SVG", () => {
    expect(BADGE_CATALOG).toHaveLength(8);
    for (const badge of BADGE_CATALOG) {
      expect(Array.from(badge.name.zh).length).toBeLessThanOrEqual(5);
      expect(badge.name.en).toMatch(/[A-Za-z]/);
      expect(badge.i18nKey).toMatch(/^collectibles\.badges\./);
      expect(badge.image).toMatch(
        /^\/collection\/badges\/[a-z0-9-]+\.png$/
      );
      expect(badge.image).not.toContain("/ink/");
    }
    expect(BADGE_CATALOG.at(3)?.name).toEqual({
      zh: "福建老酒",
      en: "Fujian Aged Rice Wine"
    });
    expect(BADGE_CATALOG.at(7)?.name).toEqual({
      zh: "西湖龙井",
      en: "West Lake Longjing Tea"
    });
  });

  it("兼容旧链上勋章字段并归一化为 canonical badge", () => {
    const collectible = collectibleFromChainItem(
      {
        collectible_id: "relic_one_leaf_origin",
        category: "勋章",
        name: "一叶来处"
      },
      "27"
    );

    expect(collectible).toMatchObject({
      id: "badge_ch2_west_lake_longjing",
      kind: "badge",
      name: "西湖龙井",
      nameEn: "West Lake Longjing Tea"
    });
  });

  it("筛选按稳定类型工作并在合并时去重", () => {
    const local = loadCollectedItems(
      storageWith({
        "gleanings.act1.save.v1": {
          inventory: ["item_taipo_note"],
          act1Complete: true
        }
      })
    );
    const duplicate = collectibleFromChainItem(
      {
        medal_id: "act1-winter-brewing",
        category: "徽章"
      },
      "8"
    );
    const merged = mergeCollectibles(local, [duplicate]);

    expect(merged).toHaveLength(2);
    expect(filterCollectibles(merged, "badge")).toHaveLength(1);
    expect(filterCollectibles(merged, "item")).toHaveLength(1);
    expect(filterCollectibles(merged, "all")).toHaveLength(2);
  });

  it("为徽章生成可国际化的稳定上链元数据", () => {
    const badge = collectibleFromChainItem(
      {
        collectible_id:
          "badge_ch1_fujian_aged_rice_wine"
      },
      "1"
    );

    expect(
      mintItemForCollectible(
        badge,
        "https://game.example/"
      )
    ).toMatchObject({
      collectible_id:
        "badge_ch1_fujian_aged_rice_wine",
      badge_id:
        "badge_ch1_fujian_aged_rice_wine",
      category: "badge",
      i18n_key:
        "collectibles.badges.fujian_aged_rice_wine",
      name: "福建老酒",
      name_zh: "福建老酒",
      name_en: "Fujian Aged Rice Wine",
      description_zh: badge.description,
      description_en: badge.descriptionEn,
      source_zh: badge.source,
      source_en: badge.sourceEn,
      item_type: "Gleanings Badge",
      rarity: "Story"
    });
  });
});
