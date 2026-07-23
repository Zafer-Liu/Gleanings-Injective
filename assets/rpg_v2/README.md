# 《拾遗》纯 2D RPG 素材包 v2

本目录是 v2 的独立生产线。`assets/` 下原有 Batch 0 继续保留为题材与文化参考，
不得作为游戏内素材与本目录混用。

## 第一幕《开坛》素材

| 文件 | 规格 | 用途 |
|---|---:|---|
| `previews/preview_apartment_gameplay_640x360.png` | 640×360 | 海外公寓实机视觉锚 |
| `maps/map_apartment_full_960x640.png` | 30×20 tiles | 第一幕完整可滚动地图 |
| `tilesets/tileset_apartment_256x256.png` | 8×8 / 32×32 | 公寓 tileset |
| `sprites/spr_yi_walk_96x192.png` | 3×4 / 32×48 | 林怡四方向三帧行走表 |
| `sprites/spr_mia_walk_96x192.png` | 3×4 / 32×48 | 米娅四方向三帧行走表 |
| `objects/obj_cardboard_box_32x32.png` | 32×32 | 太婆纸箱 |
| `objects/obj_laojiu_jar_sealed_32x64.png` | 32×64 | 封坛状态 |
| `objects/obj_laojiu_jar_open_32x64.png` | 32×64 | 揭坛状态 |
| `items/it_taipo_note_32x32.png` | 32×32 | 太婆字条背包图标 |
| `fx/fx_jar_memory_640x360.png` | 640×360 RGBA | 酒香记忆转场 |

## 已完成的首批风格锚

| 文件 | 规格 | 用途 |
|---|---:|---|
| `previews/preview_brewery_gameplay_640x360.png` | 640×360 | 酒坊实机视口 |
| `maps/map_brewery_full_1280x896.png` | 40×28 tiles | 大于视口的酒坊完整地图 |
| `tilesets/tileset_brewery_256x256.png` | 8×8 / 32×32 | 酒坊 tileset 风格锚 |
| `sprites/spr_yi_walk_96x192.png` | 3×4 / 32×48 | 林怡四方向三帧行走表 |
| `objects/obj_hongqu_tray_32x32.png` | 32×32 | 红曲盘场景物件 |
| `items/it_hongqu_sample_32x32.png` | 32×32 | 红曲样品背包图标 |
| `items/it_relic_dongniang_detail_128x128.png` | 128×128 | 冬酿曲印遗物详情 |
| `ui/ui_rpg_hud_640x360.png` | 640×360 RGBA | 原生像素 HUD 透明叠层 |
| `palette/fujian_rpg_24.png` | 24 色 | 项目唯一母色板 |
| `previews/style_board_rpg_v2_1920x1080.png` | 1920×1080 | v2 交付总览 |

## 第二、三幕正式运行素材

| 文件 | 规格 | 用途 |
|---|---:|---|
| `maps/map_brewery_winter_1408x960.png` | 44×30 tiles | 第二幕冬日酒坊正式地图 |
| `sprites/spr_taipo_young_walk_96x192.png` | 3×4 / 32×48 | 青年太婆四方向行走表 |
| `sprites/spr_afeng_walk_96x192.png` | 3×4 / 32×48 | 阿凤师四方向行走表 |
| `maps/map_postpartum_kitchen_1152x832.png` | 36×26 tiles | 第三幕产后老酒面线厨房 |
| `sprites/spr_taipo_middle_walk_96x192.png` | 3×4 / 32×48 | 中年太婆四方向行走表 |
| `sprites/spr_azhen_walk_96x192.png` | 3×4 / 32×48 | 阿珍四方向行走表 |
| `objects/obj_bowl_32x32.png` | 32×32 | 取碗任务物件 |
| `objects/obj_noodles_32x32.png` | 32×32 | 面线任务物件 |
| `objects/obj_laojiu_ladle_32x32.png` | 32×32 | 舀老酒任务物件 |
| `objects/obj_cooked_noodles_32x32.png` | 32×32 | 老酒面线成品 |
| `items/it_blue_white_cup_128x128.png` | 128×128 | 第三幕青花杯遗物 |

`*_source.png` 是生成源图，只供回溯和重新处理；游戏不得直接加载。

## 引擎规则

- 原生画布固定 `640×360`，展示只允许 `2×` 或 `3×` 最近邻整数缩放。
- tile 固定 `32×32`；角色单帧固定 `32×48`。
- tile、sprite、object、item 使用硬边；透明通道只能为 `0` 或 `255`。
- 禁止抗锯齿、渐变、模糊、柔光、景深、伪 3D 与高分辨率插画缩小冒充像素素材。
- 摄像机位置、UI 坐标和角色落点全部取整数。
- 浏览器必须设置 `image-rendering: pixelated`，Phaser 需启用 `pixelArt: true` 和 `roundPixels: true`。

## 当前状态

第一至第三幕运行素材已达到尺寸、网格、色板和透明通道规范。
第二、三幕的碰撞和任务坐标已按正式地图家具边缘对齐；文化审核仍需在正式发布前完成。

生产记录见 `manifest/assets.manifest.json`，提示词与后处理规则见
`prompts/style-anchors-v2.md`。
