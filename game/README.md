# 第一幕《开坛》可玩垂直切片

这是《拾遗》的第一段完整可玩流程。玩家在海外公寓中扮演林怡，整理太婆寄来的纸箱，
读到字条，与室友米娅交谈，最后在酒坛前做出一次感知选择并揭开被封住的冬酿记忆。

## 启动

需要 Node.js 20+ 与 pnpm 10+。

```bash
cd game
pnpm install
pnpm dev
```

浏览器打开终端显示的地址。生产构建使用：

```bash
pnpm build
pnpm exec vite preview
```

## 操作

- `WASD` / 方向键：四方向移动
- `E` / 空格：调查、推进对白、确认
- `I`：打开或关闭四格背包
- 酒坛前长按 `E`：揭坛
- 结算页 `R`：清除第一幕存档并重新体验

完整主线为：移动教学 → 调查左下纸箱 → 背包读太婆字条 → 米娅入场 → 调查右上酒坛
→ 选择香气、红色或凉意 → 长按揭坛 → 记忆转场 → 第一幕结算。

## 内容与代码位置

- `src/content/act1/dialogue.zh-CN.json`：中文对白与三个感知选项
- `src/content/act1/quests.json`：任务标题和超时提示
- `src/content/act1/interactables.json`：交互点、距离与对白组
- `src/content/act1/apartment-map.json`：地图尺寸、出生点和碰撞矩形
- `src/game/domain/`：可测试的第一幕状态机
- `src/game/scenes/`：公寓、记忆转场与结算场景
- `../assets/rpg_v2/`：运行时像素素材；`*_source.png` 只用于回溯

对白、任务和交互均由 JSON 驱动。新增文案时保留稳定的 `id`，人物显示名只写中文。
改变碰撞或交互坐标后，需同时确认主线目标仍可从相邻 tile 接近。

## 存档

存档键为 `gleanings.act1.save.v1`。关键节点会自动写入 `localStorage`；刷新后继续，
揭坛中途刷新会安全回退到选择完成状态，坏存档会备份到
`gleanings.act1.corrupt` 并以新档启动。

手动重置可在浏览器控制台执行：

```js
localStorage.removeItem("gleanings.act1.save.v1");
location.reload();
```

## 验证

```bash
pnpm test -- --run
pnpm typecheck
pnpm build
pnpm test:e2e
```

素材规范验证从仓库根目录运行：

```bash
python assets/rpg_v2/scripts/verify_assets.py
```

当前交付覆盖桌面键盘的 640×360 逻辑画布与响应式等比展示。环境音、按键音和移动端虚拟
摇杆列为下一轮 P1 增强项；所有关键声音信息已有文字或视觉反馈，不影响本幕通关。

## Injective 勋章存证演示

已拾取的剧情道具会立刻同步到右上角的「收藏馆」；第一幕完成后还会加入「冬酿守忆章」。收藏馆无需连接钱包即可使用。玩家可对任意收藏主动选择「上链展示」，确认交易后该收藏会作为 ERC-721 NFT 展示链上编号。

先在另一个终端启动链上桥服务，并完成 `rpg-chain-kit/.env` 中 Injective EVM RPC、Chain ID、合约地址和浏览器地址的真实网络配置：

```powershell
cd ..\..\rpg-chain-kit
npm start
```

可选环境变量 `VITE_CHAIN_BRIDGE_URL` 默认是 `http://127.0.0.1:3100`。演示前请在 MetaMask 中切换到已部署合约的 Injective EVM 网络。
