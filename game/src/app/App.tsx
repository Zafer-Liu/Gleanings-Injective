import { useEffect, useState } from "react";
import { startGame } from "../game/startGame";
import { MedalService } from "../game/systems/MedalService";
import { resolveChainOrigin } from "./chainConfig";
import {
  chapterMetaForScene,
  type ChapterMeta
} from "./chapterMeta";

const CHAIN_ORIGIN = resolveChainOrigin(
  import.meta.env.VITE_CHAIN_BRIDGE_URL,
  import.meta.env.DEV
);

type Collectible = { id: string; name: string; description: string; source: string; kind: "道具" | "勋章" };
type ChainAsset = { token_id: string; item?: { collectible_id?: string; medal_id?: string; name?: string; description?: string; category?: string; item_type?: string; source?: string } };

function loadCollectedItems(): Collectible[] {
  try {
    const save = JSON.parse(localStorage.getItem("gleanings.act1.save.v1") ?? "{}") as { inventory?: string[]; act1Complete?: boolean };
    const items: Collectible[] = (save.inventory ?? []).flatMap((id) => id === "item_taipo_note" ? [{ id, name: "太婆字条", description: "太婆留在纸箱里的字条，是通往冬酿记忆的第一把钥匙。", source: "《拾遗》· 第一幕 / 纸箱", kind: "道具" as const }] : []);
    if (save.act1Complete) {
      const medal = new MedalService(window.localStorage).unlockActOne()[0];
      if (medal) items.push({ id: medal.id, name: medal.name, description: medal.description, source: "《拾遗》· 第一幕 / 开坛", kind: "勋章" });
    }
    const longjing = JSON.parse(
      localStorage.getItem("gleanings.chapter-two.save.v1") ?? "{}"
    ) as { relics?: string[]; chapterComplete?: boolean };
    const longjingRelics: Record<
      string,
      Omit<Collectible, "id">
    > = {
      relic_old_tea_scoop: {
        name: "旧茶斗",
        description: "陈守一封锅后留下的旧茶斗，也是林念安进入茶园记忆的触点。",
        source: "《拾遗》· 第二章 / 同号茶罐",
        kind: "道具"
      },
      relic_qingming_bud: {
        name: "清明芽签",
        description: "记录十二次芽叶判断：节气不是催促，先问这一片叶是否适合今天这一锅。",
        source: "《拾遗》· 第二章 / 清明之前",
        kind: "道具"
      },
      relic_palm_fire: {
        name: "掌火纹",
        description: "看叶、听叶、感受温度后留下的掌火记忆；手法不是固定连招。",
        source: "《拾遗》· 第二章 / 一掌春火",
        kind: "道具"
      },
      relic_one_leaf_origin: {
        name: "一叶来处",
        description: "数字剧情纪念品，只记录玩家完成本章，不构成对现实茶叶产地、品质、地理标志或真伪的证明。",
        source: "《拾遗》· 第二章 / 名字的重量",
        kind: "勋章"
      }
    };
    (longjing.relics ?? []).forEach((id) => {
      const collectible = longjingRelics[id];
      if (collectible !== undefined) {
        items.push({ id, ...collectible });
      }
    });
    return items;
  } catch { return []; }
}

function ChainArchive() {
  const [open, setOpen] = useState(false);
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("收藏馆随游戏进度同步；连接钱包仅在你选择上链展示时需要。");
  const [minting, setMinting] = useState("");
  const [collectibles, setCollectibles] = useState<Collectible[]>(loadCollectedItems);
  const [chainCollectibles, setChainCollectibles] = useState<Collectible[]>([]);
  const [onChainTokens, setOnChainTokens] = useState<Record<string, string>>({});
  const [syncVersion, setSyncVersion] = useState(0);
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    const syncWallet = () => {
      setCollectibles(loadCollectedItems());
      fetch(`${CHAIN_ORIGIN}/api/rpg/wallet`)
        .then((response) => response.json())
        .then(async (data: { address?: string }) => {
          const address = data.address ?? "";
          setWallet(address);
          setStatus(address ? `钱包已连接：${address.slice(0, 6)}…${address.slice(-4)}。你可以选择把任意收藏上链展示。` : "收藏馆已同步本地道具；连接钱包后可选择上链展示。");
          if (!address) return;
          const assets = await fetch(`${CHAIN_ORIGIN}/api/rpg/assets/${address}`).then((response) => response.json()) as ChainAsset[];
          setChainCollectibles(assets.map((asset) => {
            const item = asset.item ?? {};
            const id = item.collectible_id ?? item.medal_id ?? `chain-token-${asset.token_id}`;
            return { id, name: item.name ?? `链上藏品 #${asset.token_id}`, description: item.description ?? "从钱包同步的链上收藏。", source: item.source ?? "Injective EVM Testnet", kind: item.category === "勋章" || item.medal_id ? "勋章" : "道具" };
          }));
          setOnChainTokens(Object.fromEntries(assets.flatMap((asset) => {
            const id = asset.item?.collectible_id ?? asset.item?.medal_id ?? `chain-token-${asset.token_id}`;
            return [[id, asset.token_id]];
          })));
        })
        .catch((error) => {
          setStatus(`读取链上收藏失败：${error instanceof Error ? error.message : "请确认链上桥服务正在运行"}`);
        });
    };
    syncWallet();
    window.addEventListener("focus", syncWallet);
    window.addEventListener("gleanings:scenechange", syncWallet);
    return () => {
      window.removeEventListener("focus", syncWallet);
      window.removeEventListener(
        "gleanings:scenechange",
        syncWallet
      );
    };
  }, [syncVersion]);

  const refreshChainCollection = () => {
    setStatus("正在从 Injective EVM 读取该钱包的链上收藏…");
    setSyncVersion((version) => version + 1);
  };

  const shareCollection = async () => {
    if (!wallet) return connect();
    try {
      const response = await fetch(`${CHAIN_ORIGIN}/api/rpg/share-link/${wallet}`);
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "无法生成分享链接");
      setShareLink(data.url);
      if (navigator.share) {
        try { await navigator.share({ title: "拾遗 · 藏品册", text: "看看我在《拾遗》中收藏的文化记忆。", url: data.url }); } catch { /* User may dismiss the native share sheet. */ }
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "无法生成分享链接");
    }
  };

  const copyShareLink = async () => {
    try { await navigator.clipboard.writeText(shareLink); setStatus("分享链接已复制，可以发送给朋友。 "); }
    catch { setStatus("无法自动复制，请长按二维码下方链接手动复制。 "); }
  };

  const connect = () => {
    window.open(`${CHAIN_ORIGIN}/connect.html`, "gleanings-wallet", "width=520,height=640");
    setStatus("请在新窗口连接 MetaMask；连接成功后重新打开收藏馆即可同步。");
  };

  const mint = async (collectible: Collectible) => {
    if (!wallet) return connect();
    setMinting(collectible.id);
    try {
      const response = await fetch(`${CHAIN_ORIGIN}/api/rpg/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "mint",
          wallet,
          item: {
            name: collectible.name,
            item_type: "Gleanings Collectible",
            collectible_id: collectible.id,
            category: collectible.kind,
            rarity: "Story",
            description: collectible.description,
            source: collectible.source
          }
        })
      });
      const data = (await response.json()) as { request_id?: string; wallet_url?: string; error?: string };
      if (!response.ok || !data.wallet_url) throw new Error(data.error ?? "无法创建上链请求");
      window.open(data.wallet_url, "gleanings-mint", "width=560,height=680");
      setStatus("请在 MetaMask 确认交易；确认后收藏馆会自动刷新链上编号。");
      const timer = window.setInterval(async () => {
        try {
          const result = await fetch(`${CHAIN_ORIGIN}/api/rpg/requests/${data.request_id}`).then((item) => item.json()) as { status?: string };
          if (result.status === "confirmed") {
            window.clearInterval(timer);
            const assets = await fetch(`${CHAIN_ORIGIN}/api/rpg/assets/${wallet}`).then((item) => item.json()) as ChainAsset[];
            const token = assets.find((asset) => (asset.item?.collectible_id ?? asset.item?.medal_id) === collectible.id);
            if (token) setOnChainTokens((current) => ({ ...current, [collectible.id]: token.token_id }));
            setStatus(`${collectible.name} 已在 Injective EVM 上存证${token ? `，链上编号 #${token.token_id}` : ""}。`);
          }
          if (result.status === "failed") { window.clearInterval(timer); setStatus("交易未完成；本地勋章会保留，可稍后再次尝试。"); }
        } catch { window.clearInterval(timer); }
      }, 1800);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "上链请求失败");
    } finally {
      setMinting("");
    }
  };

  return <>
    <div className="chain-actions">
      <button className="chain-button" onClick={connect}>{wallet ? `已连接 ${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "连接钱包"}</button>
      <button className="museum-button" onClick={() => setOpen(true)}>收藏馆</button>
    </div>
    {open && <section className="museum" role="dialog" aria-modal="true" aria-label="收藏馆">
      <div className="museum__head"><div><p>GLEANINGS / COLLECTION</p><h2>拾遗收藏馆</h2></div><button onClick={() => setOpen(false)}>关闭 ×</button></div>
      <p className="museum__status">{status}</p>
      <div className="collection-tools"><button className="chain-button collection-refresh" onClick={refreshChainCollection}>读取链上收藏</button><button className="museum-button" onClick={() => void shareCollection()}>{wallet ? "手机分享" : "连接后分享"}</button></div>
      {shareLink && <div className="share-panel"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareLink)}`} alt="手机打开收藏馆的二维码" /><div><strong>扫码查看我的收藏</strong><p>手机与电脑在同一 Wi‑Fi 时，可扫描二维码打开公开藏品册。</p><code>{shareLink}</code><button className="chain-button" onClick={() => void copyShareLink()}>复制分享链接</button></div></div>}
      {[...collectibles, ...chainCollectibles.filter((chainItem) => !collectibles.some((localItem) => localItem.id === chainItem.id))].length ? [...collectibles, ...chainCollectibles.filter((chainItem) => !collectibles.some((localItem) => localItem.id === chainItem.id))].map((collectible) => <article className="medal" key={collectible.id}><div className="medal__seal" aria-hidden="true">{collectible.kind === "勋章" ? "章" : "藏"}</div><div className="medal__copy"><h3>{collectible.name}</h3><p>{collectible.description}</p><small>{onChainTokens[collectible.id] ? `Injective EVM 链上编号 #${onChainTokens[collectible.id]}` : `已拾取${collectible.kind} · 可选择上链展示`}</small></div>{onChainTokens[collectible.id] ? <span className="onchain">已上链</span> : <button className="mint-button" disabled={minting === collectible.id} onClick={() => void mint(collectible)}>{minting === collectible.id ? "准备中…" : "上链展示"}</button>}</article>) : <p className="museum__empty">尚未拾取收藏。探索场景、调查纸箱并取得太婆字条后，它会立即出现在这里。</p>}
      <p className="museum__note">收藏馆始终可打开，不必连接钱包。上链完全可选；链上记录只证明数字剧情藏品的获得与展示，不证明任何现实酒或茶的产地、品质和真伪。</p>
    </section>}
  </>;
}

export function App() {
  const [chapterMeta, setChapterMeta] = useState<ChapterMeta>(
    chapterMetaForScene("Boot")
  );

  useEffect(() => {
    const onSceneChange = (event: Event) => {
      const sceneKey = (event as CustomEvent<{ sceneKey: string }>)
        .detail.sceneKey;
      setChapterMeta(chapterMetaForScene(sceneKey));
    };
    window.addEventListener("gleanings:scenechange", onSceneChange);
    const game = startGame("game-root");
    return () => {
      window.removeEventListener(
        "gleanings:scenechange",
        onSceneChange
      );
      game.destroy(true);
    };
  }, []);

  return (
    <main
      className={`app-shell${chapterMeta.title === "一叶来处" ? " app-shell--chapter-two" : ""}`}
    >
      <header className="game-masthead" aria-label="游戏标题">
        <p className="eyebrow">{chapterMeta.eyebrow}</p>
        <h1>
          拾遗 <span>· {chapterMeta.title}</span>
        </h1>
        <p className="chapter-note">
          {chapterMeta.note}
        </p>
        <ChainArchive />
      </header>

      <section className="stage-wrap" aria-label={chapterMeta.stageLabel}>
        <div className="corner-mark corner-mark--top" aria-hidden="true" />
        <div id="game-root" className="game-frame" data-testid="game-root" />
        <div className="corner-mark corner-mark--bottom" aria-hidden="true" />
      </section>

      <footer className="controls-note">
        <span>移动 WASD / 方向键</span>
        <span>交互 E / 空格</span>
        <span>背包 I · 面板方向键 · 影片暂停 Space · 字幕 S · 音量 ↑↓</span>
      </footer>
    </main>
  );
}
