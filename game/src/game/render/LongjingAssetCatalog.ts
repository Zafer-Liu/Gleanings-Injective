type ImageAsset = {
  key: string;
  path: string;
};

type SheetAsset = ImageAsset & {
  frameWidth: number;
  frameHeight: number;
};

export const LONGJING_CHARACTER_ASSETS = {
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
} as const satisfies Record<string, ImageAsset>;

export const LONGJING_OBJECT_ASSET = {
  key: "longjing-gameplay-objects",
  path: "/objects/obj_longjing_gameplay_384x32.png",
  frameWidth: 32,
  frameHeight: 32
} as const satisfies SheetAsset;

export const LONGJING_LEAF_ASSET = {
  key: "longjing-leaf-states",
  path: "/items/it_longjing_leaf_states_160x32.png",
  frameWidth: 32,
  frameHeight: 32
} as const satisfies SheetAsset;

export const LONGJING_FIRING_ASSET = {
  key: "longjing-firing-states",
  path: "/fx/fx_longjing_firing_states_192x64.png",
  frameWidth: 64,
  frameHeight: 64
} as const satisfies SheetAsset;

export const LONGJING_BADGE_ASSETS = [
  {
    key: "badge-fujian-aged-rice-wine",
    path: "/collection/badges/fujian-aged-rice-wine.png"
  },
  {
    key: "badge-qingming-bud",
    path: "/collection/badges/qingming-bud.png"
  },
  {
    key: "badge-west-lake-longjing-tea",
    path: "/collection/badges/west-lake-longjing-tea.png"
  }
] as const satisfies readonly ImageAsset[];
