type DebugStorageReader = Pick<Storage, "getItem">;
type DebugStorageWriter = Pick<Storage, "getItem" | "setItem">;

export type DebugCollectibleKind = "badge" | "item";

export const DEBUG_COLLECTIBLES_STORAGE_KEY =
  "gleanings.debug.collectibles.v1";

export function readDebugCollectibleUnlocks(
  storage: DebugStorageReader
): DebugCollectibleKind[] {
  try {
    const raw = storage.getItem(DEBUG_COLLECTIBLES_STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (kind): kind is DebugCollectibleKind =>
        kind === "badge" || kind === "item"
    );
  } catch {
    return [];
  }
}

export function grantDebugCollectibles(
  storage: DebugStorageWriter,
  kind: DebugCollectibleKind
): void {
  storage.setItem(
    DEBUG_COLLECTIBLES_STORAGE_KEY,
    JSON.stringify([
      ...new Set([...readDebugCollectibleUnlocks(storage), kind])
    ])
  );
}
