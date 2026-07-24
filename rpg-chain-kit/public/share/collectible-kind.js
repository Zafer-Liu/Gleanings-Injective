export function collectionType(item = {}) {
  const raw = String(
    item.category || item.item_type || ""
  ).trim();
  const normalized = raw.toLowerCase();
  const badge =
    item.badge_id !== undefined ||
    item.medal_id !== undefined ||
    normalized === "badge" ||
    normalized === "medal" ||
    normalized.includes("gleanings badge") ||
    raw.includes("徽章") ||
    raw.includes("勋章");
  if (badge) {
    return {
      kind: "badge",
      label: "徽章",
      glyph: "章"
    };
  }

  const collectibleItem =
    normalized === "item" ||
    normalized.includes("gleanings item") ||
    raw.includes("道具");
  if (collectibleItem) {
    return {
      kind: "item",
      label: "道具",
      glyph: "物"
    };
  }

  return {
    kind: "collectible",
    label: raw || "链上藏品",
    glyph: "藏"
  };
}
