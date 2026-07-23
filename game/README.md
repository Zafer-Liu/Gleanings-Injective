# 《拾遗》第一章《一坛回声》

这是《拾遗》第一章的完整可玩流程。玩家从海外公寓里太婆寄来的纸箱出发，进入冬日酒坊与
产后厨房的两段家族记忆，再回到当下完成一张福建老酒文化标签。剧情结束后，游戏会衔接
一支约 80 秒的黄酒文化后记。

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
- `I`：打开或关闭背包
- 酒坛前长按 `E`：揭坛
- 文化后记 `Space`：暂停，`S`：开关字幕，`Esc`：跳过
- 总完成页 `V`：重看文化后记，`R`：清除存档并重新体验

## 四幕与后记

1. 《开坛》：林怡整理太婆纸箱、阅读家书并揭开老酒坛。
2. 《冬酿》：青年太婆在阿凤师的酒坊里辨红曲、拌曲、下缸与封坛。
3. 《添暖》：中年太婆备齐碗、面线和老酒，为阿珍煮一碗老酒面线。
4. 《归家》：林怡和米娅一起整理三代人的文化标签，并完成本地演示铸造。
5. 《一坛酒，一条河》：从家中酒坛讲到谷物酿酒、贾湖遗存、酒曲复式发酵、宋元工艺与
   福建红曲黄酒。片中明确区分贾湖发酵饮品与今天的黄酒。

当前任务物件上方始终只有一个金色箭头。第二、三幕地图均大于 640×360 视口，摄像机跟随
人物移动；角色使用固定 32×48 像素帧，不会因向右移动而缩小。

## 内容与代码位置

- `src/content/act1` 至 `src/content/act4`：中文对白、任务、交互点与地图几何
- `src/content/film/huangjiuFilm.ts`：文化后记时间轴、字幕与来源链接
- `src/game/domain/`：可测试的章节状态机与启动路由
- `src/game/scenes/`：四幕、文化后记与总完成场景
- `../assets/rpg_v2/`：运行时 24 色像素素材；`*_source.png` 只用于回溯

对白、任务和交互均由内容文件驱动。新增文案时保留稳定的 `id`，人物显示名只写中文。
改变碰撞或交互坐标后，需同时确认目标仍可从相邻 tile 接近。

## 存档

章节存档键为 `gleanings.chapter-one.save.v2`。完成第一幕后，旧键
`gleanings.act1.save.v1` 会自动迁移到第二幕；刷新后会按 `currentAct` 回到对应场景。
坏存档会备份到 `gleanings.chapter-one.corrupt`。

手动重置可在浏览器控制台执行：

```js
localStorage.removeItem("gleanings.chapter-one.save.v2");
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
摇杆仍属于后续增强项；所有关键声音信息已有文字或视觉反馈，不影响章节通关。

## Injective 勋章存证演示

已拾取的剧情道具会立刻同步到右上角的「收藏馆」；第一幕完成后还会加入「冬酿守忆章」。收藏馆无需连接钱包即可使用。玩家可对任意收藏主动选择「上链展示」，确认交易后该收藏会作为 ERC-721 NFT 展示链上编号。

先在另一个终端启动链上桥服务，并完成 `rpg-chain-kit/.env` 中 Injective EVM RPC、Chain ID、合约地址和浏览器地址的真实网络配置：

```powershell
cd ..\..\rpg-chain-kit
npm start
```

可选环境变量 `VITE_CHAIN_BRIDGE_URL` 默认是 `http://127.0.0.1:3100`。演示前请在 MetaMask 中切换到已部署合约的 Injective EVM 网络。
