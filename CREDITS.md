# 素材来源与生成记录

## Batch 0｜视觉风格锚

生成日期：2026-07-23

- 冬日酒坊背景：OpenAI 内置 `image_gen` 生成，人工最近邻缩放。
- 少女太婆立绘：OpenAI 内置 `image_gen` 生成，以酒坊为风格参考；
  使用官方 imagegen helper 去除色键背景并人工缩放。
- 冬酿曲印：OpenAI 内置 `image_gen` 生成，以酒坊和少女太婆为风格参考；
  使用官方 imagegen helper 去除色键背景并人工缩放。
- 酒签选择组件：OpenAI 内置 `image_gen` 生成，以酒坊和冬酿曲印为风格参考；
  人工制作交付尺寸。
- 风格板：使用上述项目自有素材确定性排版合成。

当前批次没有使用第三方照片、插画、图标或音频。

完整提示词与约束见
[`assets/prompts/style-anchors-v1.1.md`](assets/prompts/style-anchors-v1.1.md)，
资产尺寸与处理记录见
[`assets/manifest/assets.manifest.json`](assets/manifest/assets.manifest.json)。

> 文化审核状态仍为 `pending`。场景、服饰、器物和酿造细节在品牌方或
> 文化顾问确认前仅用于风格开发与 Demo，不作为史实图像发布。

## Batch RPG v2｜纯 2D RPG 风格锚

生成日期：2026-07-23

- 酒坊实机视口、酒坊 tileset、Yi 四方向行走表：OpenAI 内置 `image_gen`
  生成，以项目自有 Batch 0 酒坊图为题材参考；经固定 24 色无抖动量化、
  逐格重排、最近邻缩放与硬透明处理。
- 酒坊 40×28 完整地图：使用本批次 tileset 确定性拼装。
- 红曲盘、红曲样品和冬酿曲印像素详情：由项目自有素材裁切或像素化派生。
- 原生 HUD 与 v2 风格板：使用项目色板确定性绘制、排版。

本批次没有使用第三方照片、插画、图标或音频；旧图只提供题材参考，
其柔光、伪 3D 和高分辨率插画语言没有进入 v2。

完整提示词见
[`assets/rpg_v2/prompts/style-anchors-v2.md`](assets/rpg_v2/prompts/style-anchors-v2.md)，
资产规格与状态见
[`assets/rpg_v2/manifest/assets.manifest.json`](assets/rpg_v2/manifest/assets.manifest.json)。

## 墨屏展签字体

- 墨屏 PNG 使用 Noto Sans SC（SIL Open Font License 1.1）内嵌渲染，
  来源为 `@fontsource/noto-sans-sc`，用于保证 Railway 环境中的中文字符完整显示。
