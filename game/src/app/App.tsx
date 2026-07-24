import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { startGame } from "../game/startGame";
import { resolveChainOrigin } from "./chainConfig";
import { CharacterPage } from "./CharacterPage";
import {
  collectibleFromChainItem,
  collectibleKindLabel,
  filterCollectibles,
  loadCollectedItems,
  mergeCollectibles,
  mintItemForCollectible,
  type ChainCollectibleItem,
  type Collectible,
  type CollectibleFilter
} from "./collectibleCatalog";
import {
  chapterMetaForScene,
  type ChapterMeta
} from "./chapterMeta";

const CHAIN_ORIGIN = resolveChainOrigin(
  import.meta.env.VITE_CHAIN_BRIDGE_URL,
  import.meta.env.DEV
);
const WALLET_SESSION_KEY = "gleanings.collection.wallet.session.v1";
const LEGACY_WALLET_STORAGE_KEY = "gleanings.collection.wallet.v1";

type Eip1193Provider = { request: (request: { method: string; params?: unknown[] }) => Promise<unknown>; isMetaMask?: boolean; isOkxWallet?: boolean; providers?: Eip1193Provider[] };
type AnnouncedWallet = { info?: { name?: string }; provider: Eip1193Provider };

type ChainAsset = {
  token_id: string;
  item?: ChainCollectibleItem & { item_type?: string };
};

async function readChainAssets(wallet: string): Promise<ChainAsset[]> {
  const response = await fetch(`${CHAIN_ORIGIN}/api/rpg/assets/${wallet}`);
  const body: unknown = await response.json();
  if (!response.ok) throw new Error((body as { error?: string }).error ?? "无法读取链上收藏");
  if (!Array.isArray(body)) throw new Error("链上服务返回了无效的收藏数据");
  return body as ChainAsset[];
}

function savedWallet(): string {
  localStorage.removeItem(LEGACY_WALLET_STORAGE_KEY);
  const value = sessionStorage.getItem(WALLET_SESSION_KEY) ?? "";
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

function ChainArchive({ showWallet = true }: { showWallet?: boolean } = {}) {
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
  const [selectedCollectible, setSelectedCollectible] = useState<Collectible | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<CollectibleFilter>("all");
  const [cardFlipped, setCardFlipped] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferNotice, setTransferNotice] = useState("确认后该 Token 将离开你的钱包，此操作需要钱包签名。");

  useEffect(() => {
    const syncWallet = () => {
      setCollectibles(loadCollectedItems());
      const address = savedWallet();
      setWallet(address);
      setStatus(address ? `此设备已连接钱包（末四位 ${address.slice(-4)}）。你可以选择把任意收藏上链展示。` : "收藏馆已同步本地道具；连接钱包后可选择上链展示。");
      if (!address) return;
      readChainAssets(address)
        .then((assets) => {
          const normalized = assets.map((asset) => ({
            tokenId: asset.token_id,
            collectible: collectibleFromChainItem(
              asset.item ?? {},
              asset.token_id
            )
          }));
          setChainCollectibles(
            normalized.map((entry) => entry.collectible)
          );
          setOnChainTokens(
            Object.fromEntries(
              normalized.map((entry) => [
                entry.collectible.id,
                entry.tokenId
              ])
            )
          );
        })
        .catch((error) => {
          setStatus(`读取链上收藏失败：${error instanceof Error ? error.message : "请确认链上桥服务正在运行"}`);
        });
    };
    syncWallet();
    window.addEventListener("focus", syncWallet);
    window.addEventListener("gleanings:scenechange", syncWallet);
    window.addEventListener("gleanings:collectionchange", syncWallet);
    return () => {
      window.removeEventListener("focus", syncWallet);
      window.removeEventListener(
        "gleanings:scenechange",
        syncWallet
      );
      window.removeEventListener(
        "gleanings:collectionchange",
        syncWallet
      );
    };
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

  const shareCollectible = async (collectible: Collectible) => {
    try {
      let url = "";
      if (wallet) {
        const response = await fetch(`${CHAIN_ORIGIN}/api/rpg/share-link/${wallet}`);
        const data = await response.json() as { url?: string; error?: string };
        if (!response.ok) throw new Error(data.error ?? "无法生成分享链接");
        if (data.url) {
          const itemUrl = new URL(data.url);
          const tokenId = onChainTokens[collectible.id];
          if (tokenId) itemUrl.searchParams.set("token", tokenId);
          url = itemUrl.toString();
        }
      }
      const text = `${collectible.name}｜${collectible.description}`;
      if (navigator.share) {
        await navigator.share({ title: `拾遗藏品 · ${collectible.name}`, text, ...(url ? { url } : {}) });
        setStatus(`已打开 ${collectible.name} 的分享面板。`);
      } else {
        await navigator.clipboard.writeText([text, url].filter(Boolean).join("\n"));
        setStatus(url ? "这件藏品的独立链接已复制，可以发送给朋友。" : "藏品介绍已复制，可以发送给朋友。");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus(error instanceof Error ? error.message : "暂时无法分享这件藏品");
    }
  };

  const openDotExhibit = (collectible: Collectible) => {
    if (!wallet) return connect();
    const tokenId = onChainTokens[collectible.id];
    if (!tokenId) {
      setStatus("请先把藏品上链，再生成可验证的墨屏展签。");
      return;
    }
    const url = new URL("/dot/", CHAIN_ORIGIN);
    url.searchParams.set("wallet", wallet);
    url.searchParams.set("token", tokenId);
    if (window.matchMedia("(max-width: 680px)").matches) window.location.href = url.toString();
    else window.open(url.toString(), "gleanings-dot-exhibit");
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
    sessionStorage.setItem(WALLET_SESSION_KEY, address);
    localStorage.removeItem(LEGACY_WALLET_STORAGE_KEY);
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
    sessionStorage.removeItem(WALLET_SESSION_KEY);
    localStorage.removeItem(LEGACY_WALLET_STORAGE_KEY);
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
          item: mintItemForCollectible(
            collectible,
            window.location.origin
          )
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

  const transferCollectible = async (collectible: Collectible) => {
    if (!wallet) return connect();
    const tokenId = onChainTokens[collectible.id];
    const recipient = transferRecipient.trim();
    if (!tokenId) {
      setTransferNotice("只有已经上链、并由当前钱包持有的藏品才能转赠。");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setTransferNotice("请输入接收方完整的 0x EVM 钱包地址。");
      return;
    }
    if (recipient.toLowerCase() === wallet.toLowerCase()) {
      setTransferNotice("接收地址不能与当前钱包相同。");
      return;
    }
    setTransferring(true);
    setTransferNotice("正在创建链上转赠请求…");
    try {
      const response = await fetch(`${CHAIN_ORIGIN}/api/rpg/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "transfer", wallet, token_id: tokenId, to_wallet: recipient })
      });
      const data = await response.json() as { request_id?: string; wallet_url?: string; error?: string };
      if (!response.ok || !data.wallet_url || !data.request_id) throw new Error(data.error ?? "无法创建转赠请求");
      window.open(data.wallet_url, "gleanings-transfer", "width=560,height=680");
      setStatus(`请在钱包中确认：把 ${collectible.name}（Token #${tokenId}）转赠给尾号 ${recipient.slice(-4)}。`);
      setTransferNotice(`请在钱包中确认转赠给尾号 ${recipient.slice(-4)}。`);
      const timer = window.setInterval(async () => {
        try {
          const result = await fetch(`${CHAIN_ORIGIN}/api/rpg/requests/${data.request_id}`).then((item) => item.json()) as { status?: string; error?: string };
          if (result.status === "confirmed") {
            window.clearInterval(timer);
            setTransferRecipient("");
            setSelectedCollectible(null);
            setStatus(`${collectible.name} 已转赠给尾号 ${recipient.slice(-4)}，链上所有权已变更。`);
            setTransferring(false);
            setSyncVersion((version) => version + 1);
          }
          if (result.status === "failed") {
            window.clearInterval(timer);
            setStatus(`转赠未完成：${result.error ?? "钱包拒绝或交易失败"}`);
            setTransferNotice(`转赠未完成：${result.error ?? "钱包拒绝或交易失败"}`);
            setTransferring(false);
          }
        } catch {
          window.clearInterval(timer);
          setStatus("暂时无法确认转赠结果，请点击“读取链上收藏”核对。");
          setTransferNotice("暂时无法确认结果，请返回收藏馆读取链上收藏。");
          setTransferring(false);
        }
      }, 1800);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "转赠请求失败");
      setTransferNotice(error instanceof Error ? error.message : "转赠请求失败");
      setTransferring(false);
    }
  };

  const displayedCollectibles = mergeCollectibles(
    collectibles,
    chainCollectibles
  );
  const visibleCollectibles = filterCollectibles(
    displayedCollectibles,
    collectionFilter
  );

  const openCollectibleCard = (collectible: Collectible) => {
    setSelectedCollectible(collectible);
    setCardFlipped(false);
    setTransferRecipient("");
    setTransferNotice("确认后该 Token 将离开你的钱包，此操作需要钱包签名。");
  };

  return <>
    <div className="chain-actions">
      {showWallet && <button className="chain-button" onClick={connect}>{wallet ? `已连接 · ${wallet.slice(-4)}` : "连接钱包"}</button>}
      <button className="museum-button" onClick={() => setOpen(true)}>收藏馆</button>
    </div>
    {walletModalOpen && createPortal(<section className="wallet-modal" role="dialog" aria-modal="true" aria-label="连接钱包">
      <div className="wallet-modal__panel">
        <div className="wallet-modal__head"><div><p>GLEANINGS / WALLET</p><h2>连接你的收藏</h2></div><button onClick={() => setWalletModalOpen(false)} aria-label="关闭连接钱包">关闭 ×</button></div>
        <p className="wallet-modal__intro">钱包只用于读取、展示或上链藏品。剧情进度始终保留在这台设备，连接不是游玩的前提。</p>
        <div className="wallet-methods"><div className="wallet-method"><span className="wallet-method__glyph">⌘</span><div><h3>浏览器钱包</h3><p>选择已安装的 MetaMask、OKX Wallet 或其他兼容扩展。</p></div></div><div className="wallet-method"><span className="wallet-method__glyph">□</span><div><h3>手机扫码连接</h3><p>使用手机钱包的 WalletConnect 扫码，无需电脑和手机同一 Wi-Fi。</p></div></div></div>
        <div className="wallet-options">{availableExtensions().map((item, index) => <button key={`${walletName(item, index)}-${index}`} className="wallet-option" disabled={connectingWallet} onClick={() => void connectExtension(item.provider)}><span>{walletName(item, index)}</span><small>连接 →</small></button>)}{availableExtensions().length === 0 && <p className="wallet-option__empty">未发现浏览器钱包扩展。可安装 MetaMask / OKX Wallet，或直接使用手机扫码。</p>}<button className="wallet-option wallet-option--mobile" disabled={connectingWallet} onClick={() => void connectMobile()}><span>用手机钱包扫码</span><small>打开二维码 →</small></button></div>
        {wallet && <button className="wallet-disconnect" onClick={disconnect}>断开此设备的钱包</button>}
        <p className="wallet-modal__status" role="status">{walletModalStatus}</p>
      </div>
    </section>, document.body)}
    {open && createPortal(<section className="museum" role="dialog" aria-modal="true" aria-label="收藏馆">
      <div className="museum__head"><div><p>GLEANINGS / COLLECTION</p><h2>拾遗收藏馆</h2></div><button onClick={() => setOpen(false)}>关闭 ×</button></div>
      <p className="museum__status">{status}</p>
      <div className="collection-tools"><button className="chain-button collection-refresh" onClick={refreshChainCollection}>读取链上收藏</button><button className="museum-button" onClick={() => void shareCollection()}>{wallet ? "手机分享" : "连接后分享"}</button></div>
      <div className="collection-filter-row">
        <div className="collection-filters" role="group" aria-label="筛选收藏类型">
          {([
            ["all", "全部"],
            ["badge", "徽章"],
            ["item", "道具"]
          ] as const).map(([filter, label]) => <button key={filter} type="button" aria-pressed={collectionFilter === filter} onClick={() => setCollectionFilter(filter)}>{label}</button>)}
        </div>
        <small>{visibleCollectibles.length} / {displayedCollectibles.length} 件</small>
      </div>
      {shareLink && <div className="share-panel"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareLink)}`} alt="手机打开收藏馆的二维码" /><div><strong>扫码查看我的收藏</strong><p>可扫描二维码打开公开藏品册。</p><code>{shareLink}</code><button className="chain-button" onClick={() => void copyShareLink()}>复制分享链接</button></div></div>}
      {visibleCollectibles.length ? visibleCollectibles.map((collectible) => <article className="medal" key={collectible.id}>{collectible.image ? <img className={`medal__image${collectible.kind === "badge" ? " medal__image--badge" : ""}`} src={collectible.image} alt="" /> : <div className="medal__seal" aria-hidden="true">{collectible.kind === "badge" ? "章" : "藏"}</div>}<div className="medal__copy"><h3>{collectible.name}</h3><p>{collectible.description}</p><small>{onChainTokens[collectible.id] ? `Injective EVM 链上编号 #${onChainTokens[collectible.id]}` : `已拾取${collectibleKindLabel(collectible.kind)} · 可选择上链展示`}</small></div><button className="card-open" onClick={() => openCollectibleCard(collectible)}>查看藏品卡</button>{onChainTokens[collectible.id] ? <span className="onchain">已上链</span> : <button className="mint-button" disabled={minting === collectible.id} onClick={() => void mint(collectible)}>{minting === collectible.id ? "准备中…" : "上链展示"}</button>}</article>) : <p className="museum__empty">{displayedCollectibles.length ? "当前分类还没有收藏。" : "尚未拾取收藏。探索场景、调查纸箱并取得太婆字条后，它会立即出现在这里。"}</p>}
      <p className="museum__note">收藏馆始终可打开，不必连接钱包。上链完全可选；链上记录保存玩家自行发起的数字剧情藏品及所有权变化，不作为完成剧情或现实酒茶产地、品质和真伪的独立证明。</p>
    </section>, document.body)}
    {selectedCollectible && createPortal(<section className="flashcard-modal" role="dialog" aria-modal="true" aria-label={`${selectedCollectible.name} 藏品卡`}>
      <div className="flashcard-modal__head"><p>GLEANINGS / STORY CARD</p><button onClick={() => setSelectedCollectible(null)} aria-label="关闭藏品卡">关闭 ×</button></div>
      <button className={`flashcard ${cardFlipped ? "flashcard--flipped" : ""}`} onClick={() => setCardFlipped((flipped) => !flipped)} aria-label={`翻转${selectedCollectible.name}藏品卡`}>
        <span className="flashcard__inner">
          <span className="flashcard__face flashcard__front">
            {selectedCollectible.image ? <span className={`flashcard__art${selectedCollectible.kind === "badge" ? " flashcard__art--badge" : ""}`}><img src={selectedCollectible.image} alt={selectedCollectible.name} /></span> : <span className="flashcard__seal">{selectedCollectible.kind === "badge" ? "章" : "藏"}</span>}
            <span className="flashcard__label">{collectibleKindLabel(selectedCollectible.kind)} / GLEANINGS</span>
            <strong>{selectedCollectible.name}</strong>
            <small>{onChainTokens[selectedCollectible.id] ? `INJECTIVE EVM · TOKEN #${onChainTokens[selectedCollectible.id]}` : "本地旅程收藏"}</small>
            <em>轻触翻转，读取故事</em>
          </span>
          <span className="flashcard__face flashcard__back">
            <span className="flashcard__label">COLLECTION NOTE</span>
            <strong>{selectedCollectible.name}</strong>
            <p>{selectedCollectible.description}</p>
            <small>来源 · {selectedCollectible.source}</small>
            <span className="flashcard__chain-state">{onChainTokens[selectedCollectible.id] ? `已上链 · Token #${onChainTokens[selectedCollectible.id]}` : "尚未上链 · 仍可作为本地收藏分享"}</span>
            <em>轻触返回正面</em>
          </span>
        </span>
      </button>
      <div className="flashcard-actions">
        <div className="flashcard-social-actions">
          <button className="flashcard-share" onClick={() => void shareCollectible(selectedCollectible)}>分享展示链接</button>
          {onChainTokens[selectedCollectible.id] && <button className="flashcard-dot" onClick={() => openDotExhibit(selectedCollectible)}>手机投到墨屏</button>}
        </div>
        {onChainTokens[selectedCollectible.id] && <form className="transfer-form" onSubmit={(event) => { event.preventDefault(); void transferCollectible(selectedCollectible); }}>
          <label htmlFor="transfer-recipient">转赠链上所有权</label>
          <div>
            <input id="transfer-recipient" value={transferRecipient} onChange={(event) => setTransferRecipient(event.target.value)} placeholder="接收方 0x 钱包地址" inputMode="text" autoComplete="off" spellCheck={false} />
            <button type="submit" disabled={transferring}>{transferring ? "准备中…" : "确认转赠"}</button>
          </div>
          <small role="status">{transferNotice}</small>
        </form>}
      </div>
    </section>, document.body)}
  </>;
}

const chapters = [
  { number: "03", name: "瓷", subtitle: "火与白土", mark: "瓷" },
  { number: "04", name: "丝", subtitle: "万里经纬", mark: "丝" }
];

function GameView({ onExit, chapterMeta }: { onExit: () => void; chapterMeta: ChapterMeta }) {
  useEffect(() => {
    const game = startGame("game-root");
    return () => game.destroy(true);
  }, []);

  return (
    <main className={`game-shell game-shell--immersive${chapterMeta.title === "一叶来处" ? " app-shell--chapter-two" : ""}`}>
      <section className="stage-wrap" aria-label={chapterMeta.stageLabel}>
        <div className="game-overlay-actions">
          <ChainArchive showWallet={false} />
          <button className="text-button" type="button" onClick={onExit}>
            ← 返回主页
          </button>
        </div>
        <div className="corner-mark corner-mark--top" aria-hidden="true" />
        <div id="game-root" className="game-frame" data-testid="game-root" />
        <div className="corner-mark corner-mark--bottom" aria-hidden="true" />
      </section>
    </main>
  );
}

function HomeView({
  onStartChapterOne,
  onStartChapterTwo
}: {
  onStartChapterOne: () => void;
  onStartChapterTwo: () => void;
}) {
  return (
    <main className="home">
      <div className="home-grain" aria-hidden="true" />
      <nav className="home-nav" aria-label="主页导航">
        <a className="brand" href="#top" aria-label="拾遗主页">
          <span className="brand-seal">拾</span>
          <span>
            <strong>拾遗</strong>
            <small>GLEANINGS</small>
          </span>
        </a>
        <div className="nav-links">
          <a href="#collection">章节</a>
          <a href="/characters">人物志</a>
          <a href="#story">缘起</a>
          <ChainArchive />
          <button className="nav-start" type="button" onClick={onStartChapterOne}>
            进入第一章
          </button>
        </div>
      </nav>

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="hero-kicker"><span /> 中国传统事物叙事收藏游戏</p>
          <h1 className="hero-title">
            拾起被遗忘的，
            <br />
            <em>让故事再次发生。</em>
          </h1>
          <p className="hero-intro">
            穿过一件旧物的记忆，亲历它从中国走向世界的故事。
            每一次读懂，都将凝成一枚属于你的文化藏品。
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={onStartChapterOne}>
              <span>开启故事</span>
              <b aria-hidden="true">→</b>
            </button>
            <a className="secondary-action" href="#collection">
              探索章节
            </a>
          </div>
          <div className="hero-meta" aria-label="游戏特性">
            <span>纯 2D RPG 探索</span>
            <span>叙事选择</span>
            <span>文化收藏</span>
          </div>
        </div>

        <div className="hero-art" aria-label="第一章福建老酒">
          <div className="orbit orbit--outer" aria-hidden="true" />
          <div className="orbit orbit--inner" aria-hidden="true" />
          <div className="chapter-disc">
            <span className="disc-index">壹</span>
            <img src="/items/it_relic_dongniang_detail_128x128.png" alt="" />
            <div className="disc-glow" aria-hidden="true" />
          </div>
          <div className="floating-note floating-note--top">
            <small>CHAPTER 01</small>
            <strong>福建老酒</strong>
          </div>
          <div className="floating-note floating-note--bottom">
            <span className="pulse-dot" />
            <small>现已开放</small>
          </div>
          <span className="art-character art-character--one">酿</span>
          <span className="art-character art-character--two">忆</span>
        </div>

        <div className="scroll-cue" aria-hidden="true">
          <span>向下探索</span><i />
        </div>
      </section>

      <section id="collection" className="collection-section">
        <header className="section-heading">
          <div>
            <p className="eyebrow">THE CHAPTER / 章节</p>
            <h2>一物一章，一章一世界</h2>
          </div>
          <p>从福建老酒出发，拾起散落在时间里的中国传统事物。</p>
        </header>

        <div className="chapter-grid">
          <button className="chapter-card chapter-card--active" type="button" onClick={onStartChapterOne}>
            <div className="chapter-card__image">
              <img src="/previews/preview_brewery_gameplay_640x360.png" alt="冬日福建酒坊像素场景" />
              <span>可游玩</span>
            </div>
            <div className="chapter-card__body">
              <small>CHAPTER 01</small>
              <h3>福建老酒 <em>· 冬酿</em></h3>
              <p>一坛越过重洋的家书，揭开红曲与冬日的记忆。</p>
              <b>进入第一章 →</b>
            </div>
          </button>

          <button
            className="chapter-card chapter-card--active chapter-card--tea"
            type="button"
            onClick={onStartChapterTwo}
            aria-label="进入第二章：龙井茶"
          >
            <div className="locked-mark">茶</div>
            <div className="chapter-card__body">
              <small>CHAPTER 02</small>
              <h3>龙井茶 <em>· 一叶来处</em></h3>
              <p>从同号茶罐出发，追索一片茶叶的名字、手艺与来处。</p>
              <b>进入第二章 →</b>
            </div>
          </button>

          {chapters.map((chapter) => (
            <article className="chapter-card chapter-card--locked" key={chapter.number}>
              <div className="locked-mark">{chapter.mark}</div>
              <div className="chapter-card__body">
                <small>CHAPTER {chapter.number}</small>
                <h3>{chapter.name} <em>· {chapter.subtitle}</em></h3>
                <p>记忆尚未苏醒</p>
                <b>敬请期待</b>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="story" className="manifesto">
        <p>一件旧物不是过去。</p>
        <h2>当你走进它的故事，<br />传统便有了新的时间。</h2>
        <button type="button" onClick={onStartChapterOne}>开启第一段记忆 <span>→</span></button>
      </section>

      <footer className="home-footer">
        <div className="brand brand--footer">
          <span className="brand-seal">拾</span>
          <span><strong>拾遗</strong><small>GLEANINGS</small></span>
        </div>
        <p>一部关于中国传统事物走向世界的选集式游戏</p>
        <small>ADVENTUREX 2026</small>
      </footer>
    </main>
  );
}

export function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [chapterMeta, setChapterMeta] = useState<ChapterMeta>(
    chapterMetaForScene("Boot")
  );

  useEffect(() => {
    const onSceneChange = (event: Event) => {
      const sceneKey = (event as CustomEvent<{ sceneKey: string }>).detail.sceneKey;
      setChapterMeta(chapterMetaForScene(sceneKey));
    };

    window.addEventListener("gleanings:scenechange", onSceneChange);
    return () => window.removeEventListener("gleanings:scenechange", onSceneChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [isPlaying]);

  if (window.location.pathname === "/characters") {
    return <CharacterPage />;
  }

  const startChapter = (chapter: "one" | "two") => {
    window.sessionStorage.setItem("gleanings.active-chapter.v1", chapter);
    setIsPlaying(true);
  };

  return isPlaying
    ? <GameView onExit={() => setIsPlaying(false)} chapterMeta={chapterMeta} />
    : (
      <HomeView
        onStartChapterOne={() => startChapter("one")}
        onStartChapterTwo={() => startChapter("two")}
      />
    );
}
