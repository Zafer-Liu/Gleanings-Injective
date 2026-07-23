import { useEffect, useState } from "react";
import { startGame } from "../game/startGame";
import { MedalService } from "../game/systems/MedalService";

const CHAIN_ORIGIN = import.meta.env.VITE_CHAIN_BRIDGE_URL ?? (import.meta.env.DEV ? "http://127.0.0.1:3100" : window.location.origin);
const WALLET_STORAGE_KEY = "gleanings.collection.wallet.v1";

type Eip1193Provider = { request: (request: { method: string; params?: unknown[] }) => Promise<unknown>; isMetaMask?: boolean; isOkxWallet?: boolean; providers?: Eip1193Provider[] };
type AnnouncedWallet = { info?: { name?: string }; provider: Eip1193Provider };

type Collectible = { id: string; name: string; description: string; source: string; kind: "道具" | "勋章" };
type ChainAsset = { token_id: string; item?: { collectible_id?: string; medal_id?: string; name?: string; description?: string; category?: string; item_type?: string; source?: string } };

async function readChainAssets(wallet: string): Promise<ChainAsset[]> {
  const response = await fetch(`${CHAIN_ORIGIN}/api/rpg/assets/${wallet}`);
  const body: unknown = await response.json();
  if (!response.ok) throw new Error((body as { error?: string }).error ?? "无法读取链上收藏");
  if (!Array.isArray(body)) throw new Error("链上服务返回了无效的收藏数据");
  return body as ChainAsset[];
}

function loadCollectedItems(): Collectible[] {
  try {
    const save = JSON.parse(localStorage.getItem("gleanings.act1.save.v1") ?? "{}") as { inventory?: string[]; act1Complete?: boolean };
    const items: Collectible[] = (save.inventory ?? []).flatMap((id) => id === "item_taipo_note" ? [{ id, name: "太婆字条", description: "太婆留在纸箱里的字条，是通往冬酿记忆的第一把钥匙。", source: "《拾遗》· 第一幕 / 纸箱", kind: "道具" as const }] : []);
    if (save.act1Complete) {
      const medal = new MedalService(window.localStorage).unlockActOne()[0];
      if (medal) items.push({ id: medal.id, name: medal.name, description: medal.description, source: "《拾遗》· 第一幕 / 开坛", kind: "勋章" });
    }
    return items;
  } catch { return []; }
}

function savedWallet(): string {
  const value = localStorage.getItem(WALLET_STORAGE_KEY) ?? "";
  return /^0x[a-fA-F0-9]{40}$/.test(value) ? value : "";
}

function walletName(wallet: AnnouncedWallet, index: number): string {
  if (wallet.info?.name) return wallet.info.name;
  if (wallet.provider.isOkxWallet) return "OKX Wallet";
  if (wallet.provider.isMetaMask) return "MetaMask";
  return `浏览器钱包 ${index + 1}`;
}

async function loadWalletConnectProvider(): Promise<{ init: (options: Record<string, unknown>) => Promise<Eip1193Provider & { connect: () => Promise<unknown> }> }> {
  const existing = (globalThis as typeof globalThis & { "@walletconnect/ethereum-provider"?: { EthereumProvider?: unknown } })["@walletconnect/ethereum-provider"]?.EthereumProvider;
  if (existing) return existing as { init: (options: Record<string, unknown>) => Promise<Eip1193Provider & { connect: () => Promise<unknown> }> };
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${CHAIN_ORIGIN}/vendor/walletconnect/index.umd.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("二维码组件加载失败，请刷新页面后重试。"));
    document.head.append(script);
  });
  const loaded = (globalThis as typeof globalThis & { "@walletconnect/ethereum-provider"?: { EthereumProvider?: unknown } })["@walletconnect/ethereum-provider"]?.EthereumProvider;
  if (!loaded) throw new Error("二维码组件加载失败，请刷新页面后重试。");
  return loaded as { init: (options: Record<string, unknown>) => Promise<Eip1193Provider & { connect: () => Promise<unknown> }> };
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
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletModalStatus, setWalletModalStatus] = useState("选择浏览器扩展，或使用手机钱包扫码连接。");
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [announcedWallets, setAnnouncedWallets] = useState<AnnouncedWallet[]>([]);

  useEffect(() => {
    const syncWallet = () => {
      setCollectibles(loadCollectedItems());
      const address = savedWallet();
      setWallet(address);
      setStatus(address ? `此设备已连接钱包（末四位 ${address.slice(-4)}）。你可以选择把任意收藏上链展示。` : "收藏馆已同步本地道具；连接钱包后可选择上链展示。");
      if (!address) return;
      readChainAssets(address)
        .then((assets) => {
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
    const timer = window.setInterval(syncWallet, 1500);
    return () => { window.removeEventListener("focus", syncWallet); window.clearInterval(timer); };
  }, [syncVersion]);

  useEffect(() => {
    const onAnnouncement = (event: Event) => {
      const detail = (event as CustomEvent<AnnouncedWallet>).detail;
      if (!detail?.provider) return;
      setAnnouncedWallets((current) => current.some((item) => item.provider === detail.provider) ? current : [...current, detail]);
    };
    window.addEventListener("eip6963:announceProvider", onAnnouncement);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", onAnnouncement);
  }, []);

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

  const availableExtensions = (): AnnouncedWallet[] => {
    const injected = (window as typeof window & { ethereum?: Eip1193Provider }).ethereum;
    const legacy = injected?.providers ?? (injected ? [injected] : []);
    return [...announcedWallets, ...legacy.map((provider) => ({ provider }))].filter((item, index, list) => list.findIndex((candidate) => candidate.provider === item.provider) === index);
  };

  const connect = () => {
    setWalletModalStatus(wallet ? `当前设备已连接尾号 ${wallet.slice(-4)} 的钱包。你可以改用另一个钱包。` : "选择浏览器扩展，或使用手机钱包扫码连接。");
    setWalletModalOpen(true);
  };

  const saveConnectedWallet = (address: string) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("钱包没有返回有效地址。");
    localStorage.setItem(WALLET_STORAGE_KEY, address);
    setWallet(address);
    setWalletModalStatus(`已连接尾号 ${address.slice(-4)} 的钱包。收藏馆正在读取链上藏品。`);
    setStatus(`此设备已连接钱包（末四位 ${address.slice(-4)}）。你可以选择把任意收藏上链展示。`);
    setSyncVersion((version) => version + 1);
  };

  const connectExtension = async (provider: Eip1193Provider) => {
    setConnectingWallet(true);
    try {
      setWalletModalStatus("正在请求钱包授权…");
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      saveConnectedWallet(accounts?.[0] ?? "");
    } catch (error) {
      setWalletModalStatus(`连接失败：${error instanceof Error ? error.message : String(error)}`);
    } finally { setConnectingWallet(false); }
  };

  const connectMobile = async () => {
    setConnectingWallet(true);
    try {
      const response = await fetch(`${CHAIN_ORIGIN}/api/rpg/config`);
      const config = await response.json() as { walletconnect_project_id?: string; chain_id?: number; rpc_url?: string };
      if (!config.walletconnect_project_id) throw new Error("此服务尚未配置 WalletConnect Project ID。请在 Railway Variables 设置 WALLETCONNECT_PROJECT_ID。");
      setWalletModalStatus("正在打开二维码，请使用手机钱包中的 WalletConnect 扫码。");
      const EthereumProvider = await loadWalletConnectProvider();
      const provider = await EthereumProvider.init({ projectId: config.walletconnect_project_id, optionalChains: [Number(config.chain_id) || 1439], showQrModal: true, rpcMap: { [Number(config.chain_id) || 1439]: config.rpc_url }, metadata: { name: "拾遗收藏馆", description: "Gleanings Injective collection", url: window.location.origin, icons: [] } });
      await provider.connect();
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      saveConnectedWallet(accounts?.[0] ?? "");
    } catch (error) {
      setWalletModalStatus(`扫码连接失败：${error instanceof Error ? error.message : String(error)}`);
    } finally { setConnectingWallet(false); }
  };

  const disconnect = () => {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    setWallet("");
    setChainCollectibles([]);
    setOnChainTokens({});
    setStatus("已断开此设备的钱包显示；游戏本地收藏不受影响。");
    setWalletModalStatus("已断开。选择其他钱包继续连接。");
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
            const assets = await readChainAssets(wallet);
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
      <button className="chain-button" onClick={connect}>{wallet ? `已连接 · ${wallet.slice(-4)}` : "连接钱包"}</button>
      <button className="museum-button" onClick={() => setOpen(true)}>收藏馆</button>
    </div>
    {walletModalOpen && <section className="wallet-modal" role="dialog" aria-modal="true" aria-label="连接钱包">
      <div className="wallet-modal__panel">
        <div className="wallet-modal__head"><div><p>GLEANINGS / WALLET</p><h2>连接你的收藏</h2></div><button onClick={() => setWalletModalOpen(false)} aria-label="关闭连接钱包">关闭 ×</button></div>
        <p className="wallet-modal__intro">钱包只用于读取、展示或上链藏品。剧情进度始终保留在这台设备，连接不是游玩的前提。</p>
        <div className="wallet-methods"><div className="wallet-method"><span className="wallet-method__glyph">⌘</span><div><h3>浏览器钱包</h3><p>选择已安装的 MetaMask、OKX Wallet 或其他兼容扩展。</p></div></div><div className="wallet-method"><span className="wallet-method__glyph">□</span><div><h3>手机扫码连接</h3><p>使用手机钱包的 WalletConnect 扫码，无需电脑和手机同一 Wi-Fi。</p></div></div></div>
        <div className="wallet-options">{availableExtensions().map((item, index) => <button key={`${walletName(item, index)}-${index}`} className="wallet-option" disabled={connectingWallet} onClick={() => void connectExtension(item.provider)}><span>{walletName(item, index)}</span><small>连接 →</small></button>)}{availableExtensions().length === 0 && <p className="wallet-option__empty">未发现浏览器钱包扩展。可安装 MetaMask / OKX Wallet，或直接使用手机扫码。</p>}<button className="wallet-option wallet-option--mobile" disabled={connectingWallet} onClick={() => void connectMobile()}><span>用手机钱包扫码</span><small>打开二维码 →</small></button></div>
        {wallet && <button className="wallet-disconnect" onClick={disconnect}>断开此设备的钱包</button>}
        <p className="wallet-modal__status" role="status">{walletModalStatus}</p>
      </div>
    </section>}
    {open && <section className="museum" role="dialog" aria-modal="true" aria-label="收藏馆">
      <div className="museum__head"><div><p>GLEANINGS / COLLECTION</p><h2>拾遗收藏馆</h2></div><button onClick={() => setOpen(false)}>关闭 ×</button></div>
      <p className="museum__status">{status}</p>
      <div className="collection-tools"><button className="chain-button collection-refresh" onClick={refreshChainCollection}>读取链上收藏</button><button className="museum-button" onClick={() => void shareCollection()}>{wallet ? "手机分享" : "连接后分享"}</button></div>
      {shareLink && <div className="share-panel"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareLink)}`} alt="手机打开收藏馆的二维码" /><div><strong>扫码查看我的收藏</strong><p>可扫描二维码打开公开藏品册。</p><code>{shareLink}</code><button className="chain-button" onClick={() => void copyShareLink()}>复制分享链接</button></div></div>}
      {[...collectibles, ...chainCollectibles.filter((chainItem) => !collectibles.some((localItem) => localItem.id === chainItem.id))].length ? [...collectibles, ...chainCollectibles.filter((chainItem) => !collectibles.some((localItem) => localItem.id === chainItem.id))].map((collectible) => <article className="medal" key={collectible.id}><div className="medal__seal" aria-hidden="true">{collectible.kind === "勋章" ? "章" : "藏"}</div><div className="medal__copy"><h3>{collectible.name}</h3><p>{collectible.description}</p><small>{onChainTokens[collectible.id] ? `Injective EVM 链上编号 #${onChainTokens[collectible.id]}` : `已拾取${collectible.kind} · 可选择上链展示`}</small></div>{onChainTokens[collectible.id] ? <span className="onchain">已上链</span> : <button className="mint-button" disabled={minting === collectible.id} onClick={() => void mint(collectible)}>{minting === collectible.id ? "准备中…" : "上链展示"}</button>}</article>) : <p className="museum__empty">尚未拾取收藏。探索场景、调查纸箱并取得太婆字条后，它会立即出现在这里。</p>}
      <p className="museum__note">收藏馆始终可打开，不必连接钱包。上链完全可选；只有你选择展示的收藏才会铸造成 Injective EVM NFT。</p>
    </section>}
  </>;
}

export function App() {
  useEffect(() => {
    const game = startGame("game-root");
    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <main className="app-shell">
      <header className="game-masthead" aria-label="游戏标题">
        <p className="eyebrow">GLEANINGS / ACT 01</p>
        <h1>
          拾遗 <span>· 开坛</span>
        </h1>
        <p className="chapter-note">福建老酒 · 一段被封在坛里的家书</p>
        <ChainArchive />
      </header>

      <section className="stage-wrap" aria-label="第一幕游戏画面">
        <div className="corner-mark corner-mark--top" aria-hidden="true" />
        <div id="game-root" className="game-frame" data-testid="game-root" />
        <div className="corner-mark corner-mark--bottom" aria-hidden="true" />
      </section>

      <footer className="controls-note">
        <span>移动 WASD / 方向键</span>
        <span>交互 E / 空格</span>
        <span>背包 I</span>
      </footer>
    </main>
  );
}
