import { describe, expect, it } from "vitest";
import {
  LONGJING_BADGE_ASSETS,
  LONGJING_CHARACTER_ASSETS,
  LONGJING_FIRING_ASSET,
  LONGJING_LEAF_ASSET,
  LONGJING_OBJECT_ASSET
} from "./LongjingAssetCatalog";

describe("Longjing gameplay asset catalog", () => {
  it("gives every chapter-two role a dedicated walk sheet", () => {
    expect(LONGJING_CHARACTER_ASSETS).toEqual({
      chenOld: {
        key: "actor-chen-old",
        path: "/sprites/spr_chen_old_walk_96x192.png"
      },
      chenYoung: {
        key: "actor-chen-young",
        path: "/sprites/spr_chen_young_walk_96x192.png"
      },
      masterHe: {
        key: "actor-master-he",
        path: "/sprites/spr_master_he_walk_96x192.png"
      },
      marketVendor: {
        key: "actor-market-vendor",
        path: "/sprites/spr_market_vendor_walk_96x192.png"
      },
      teaMerchant: {
        key: "actor-tea-merchant",
        path: "/sprites/spr_tea_merchant_walk_96x192.png"
      }
    });
  });

  it("declares the object, leaf, firing, and completion image sheets", () => {
    expect(LONGJING_OBJECT_ASSET).toEqual({
      key: "longjing-gameplay-objects",
      path: "/objects/obj_longjing_gameplay_384x32.png",
      frameWidth: 32,
      frameHeight: 32
    });
    expect(LONGJING_LEAF_ASSET).toEqual({
      key: "longjing-leaf-states",
      path: "/items/it_longjing_leaf_states_160x32.png",
      frameWidth: 32,
      frameHeight: 32
    });
    expect(LONGJING_FIRING_ASSET).toEqual({
      key: "longjing-firing-states",
      path: "/fx/fx_longjing_firing_states_192x64.png",
      frameWidth: 64,
      frameHeight: 64
    });
    expect(LONGJING_BADGE_ASSETS.map((asset) => asset.key)).toEqual([
      "badge-fujian-aged-rice-wine",
      "badge-qingming-bud",
      "badge-west-lake-longjing-tea"
    ]);
  });
});
