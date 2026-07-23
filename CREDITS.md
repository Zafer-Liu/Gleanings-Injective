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
