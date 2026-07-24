export type LocalMedal = {
  id: "act1-winter-brewing";
  name: string;
  description: string;
  unlockedAt: string;
  onChainTokenId?: string;
  transactionHash?: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export class MedalService {
  static readonly STORAGE_KEY = "gleanings.medals.v1";

  constructor(private readonly storage: StorageLike) {}

  list(): LocalMedal[] {
    try {
      const value: unknown = JSON.parse(this.storage.getItem(MedalService.STORAGE_KEY) ?? "[]");
      return Array.isArray(value) ? value.filter((item): item is LocalMedal => typeof item === "object" && item !== null && (item as { id?: unknown }).id === "act1-winter-brewing") : [];
    } catch { return []; }
  }

  unlockActOne(): LocalMedal[] {
    const medals = this.list();
    if (medals.some((medal) => medal.id === "act1-winter-brewing")) return medals;
    const next: LocalMedal[] = [...medals, { id: "act1-winter-brewing", name: "冬酿守忆章", description: "完成《开坛》，将冬酿的第一缕记忆留在旅程中。", unlockedAt: new Date().toISOString() }];
    this.storage.setItem(MedalService.STORAGE_KEY, JSON.stringify(next));
    return next;
  }
}
