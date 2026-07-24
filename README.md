# 拾遗 · Gleanings

一款讲述**中国传统事物**走向世界的选集式叙事收藏游戏。现已落地第一章“福建老酒”与
第二章“西湖龙井”。纯 2D RPG 探索 · 叙事选择 · 可核验文化内容 · Injective 链上收藏。

> AdventureX 2026 参赛项目

## 可玩章节

`game/` 已落地两章连续流程：

- 第一章《一坛回声》：公寓探索、冬酿记忆、老酒面线、文化酒签与约 60 秒黄酒后记。
- 第二章《一叶来处》：茶市来源核验、十二枚鲜叶采留判断、五轮手工炒制、旧作坊证据闭环、
  三种题记选择与约 60 秒西湖龙井后记。

两章均支持自动存档、刷新恢复、任务箭头、碰撞与摄像机跟随；第二章完成页可回看两支后记。

```bash
cd game
pnpm install
pnpm dev
```

详细操作、内容修改与测试说明见 [game/README.md](game/README.md)。

## 文档

- [设计文档.md](设计文档.md) — 完整项目设计（赛道策略、玩法、逐幕脚本、区块链/AI 设计、开发计划、文书）
- [内容设计.md](内容设计.md) — 人物 · 剧情 · 道具 · 内容系统（第一章《福建老酒》完整剧情与信物）
- [素材需求.md](素材需求.md) — 全部素材清单（美术/UI/音频/文案/NFT 元数据，含规格与优先级）
- [纯 2D RPG 设计](docs/plans/2026-07-23-pure-2d-rpg-design.md) — 640×360 画布、地图规模、tile/sprite/UI、状态与像素质量门槛
- [纯 2D RPG 制作计划](docs/plans/2026-07-23-pure-2d-rpg-implementation.md) — v2 素材与集成任务
- [第一幕制作级设计](docs/plans/2026-07-23-act1-open-jar-design.md) — 《开坛》3–5 分钟完整体验、状态与验收标准
- [第一幕实施计划](docs/plans/2026-07-23-act1-open-jar-implementation.md) — React + Phaser 落地与验证步骤
- [v1 视觉风格设计](docs/plans/2026-07-23-visual-style-assets-design.md) — 旧“闽地民俗标本馆”参考，已由纯 RPG v2 取代
- [链上设计.md](链上设计.md) — 完整链上方案（资产模型、合约、铸造与防作弊、元数据、部署、安全、测试）
- [contracts/Gleanings.sol](contracts/Gleanings.sol) — ERC-721 藏品合约（信物 + 徽章，OZ v5，已编译通过）

## 参赛赛道

- Injective Blockchain x AI 创新赛道
- 【新国货出海】WOPC — 超级合子 SuperZygo
- 一个人 = 一支工程团队 — Qoder

## 技术栈

- 前端：React + Phaser 3（tile map / 碰撞 / 摄像机 / NPC / 任务）+ 数据驱动对白与选择
- 生成服务：已核对文化事实 + 玩家选择 → 双语文化酒签 / metadata / EIP-712 voucher
- 合约：Injective EVM / Solidity（ERC-721：唯一信物 + 徽章）
- AI：构建期像素素材生成 + 运行时受控个性化表达
