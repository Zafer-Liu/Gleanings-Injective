import { LONGJING_CHARACTER_ASSETS } from "./LongjingAssetCatalog";

export type LongjingActorRole =
  | "lin_nianan"
  | "mia"
  | "chen_old"
  | "chen_young"
  | "master_he"
  | "market_vendor"
  | "tea_merchant";

const TEXTURE_BY_ROLE: Record<LongjingActorRole, string> = {
  lin_nianan: "actor-yi",
  mia: "actor-mia",
  chen_old: LONGJING_CHARACTER_ASSETS.chenOld.key,
  chen_young: LONGJING_CHARACTER_ASSETS.chenYoung.key,
  master_he: LONGJING_CHARACTER_ASSETS.masterHe.key,
  market_vendor: LONGJING_CHARACTER_ASSETS.marketVendor.key,
  tea_merchant: LONGJING_CHARACTER_ASSETS.teaMerchant.key
};

export function longjingActorTexture(role: LongjingActorRole): string {
  return TEXTURE_BY_ROLE[role];
}

