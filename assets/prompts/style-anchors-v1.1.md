# 《拾遗》风格锚生成提示词 v1.1

生成方式：OpenAI 内置 `image_gen`。
统一要求：无文字、无水印；图像中的标题、铭文、编号和来源信息由前端或设计软件叠加。

## 全局风格约束

```text
editorial pixel art for an interactive Fujian folk-life archive,
tactile specimen-book presentation, restrained warm nostalgia,
limited palette: ink brown #211A17, rice paper #EADDC5,
aged-wine amber #C9873F, hongqu red #A83B32,
lacquer wood #5B3A29, clay #7A5845,
blue-gray #48677A, winter frost #B7C2C0,
clean readable silhouettes, consistent upper-right warm light,
medium-low pixel density, lived-in domestic detail,
no text, no letters, no watermark
```

统一负面约束：

```text
generic imperial China, palace, dragon, phoenix, lantern festival,
bright red and gold luxury, cyberpunk, neon, crypto dashboard,
glossy NFT card, 3D render, photorealistic, smooth vector,
chibi anime, oversized eyes, random calligraphy, text, logo, watermark
```

## 01｜冬日酒坊

```text
Asset type: 16:9 narrative game environment style anchor.
Create a lived-in traditional Fujian rice-wine workshop during the cold
brewing season: rows of earthenware jars, steamed glutinous rice, hongqu
red yeast rice in a shallow bamboo tray, timber beams, lattice window,
and pale winter frost outside. No people.

Use a wide layered establishing composition with a clear central working
area and calm darker space on the right for a character portrait and
cultural annotations. The interior is warm and amber; the exterior is
cool and frosted. Keep the setting humble, practical, historically
grounded, and readable at 640x360.
```

## 02｜少女太婆

参考图：`style_scene_brewery_source.png`

```text
Asset type: isolated half-body visual-novel character anchor.
Create young Lin A-ma / Taipo, a teenage-to-young-adult Fujian rice-wine
apprentice. Show a 3/4 front portrait from head to below waist. She wears
simple indigo-gray working clothes and a muted warm apron; her dark hair
is tied back practically. Her gaze is calm and focused. Her fingertips
are visibly but subtly stained hongqu red.

Match the reference scene's pixel density, palette, tactile texture, and
upper-right warm light. Avoid fantasy hanfu and anime proportions.
Generate on a perfectly flat solid #00ff00 background with no shadows,
gradients, reflections, or floor plane so the background can be removed.
Do not use #00ff00 inside the character.
```

## 03｜冬酿曲印

参考图：`style_scene_brewery_source.png`、`style_char_taipo_young_alpha.png`

```text
Asset type: isolated square collectible relic anchor.
Create one thick circular hand-pressed token made from Fujian hongqu red
yeast rice and glutinous rice. It has a slightly irregular handmade edge,
matte compressed grain texture, restrained frost and snow-line relief
around the rim, and a quiet blank recessed center reserved for a separate
frontend inscription overlay. It must not resemble currency.

Use a three-quarter top-down view, a crisp readable silhouette, generous
padding, and warm upper-right amber light. Generate on a perfectly flat
solid #00ff00 background with no shadows or reflections. No text,
characters, letters, coin symbols, gold shine, or magical glow.
```

## 04｜酒签选择组件

参考图：`style_scene_brewery_source.png`、`style_item_dongniang_alpha.png`

```text
Asset type: production-style game UI component board.
Show three states of the same blank horizontal wine-tag choice button:
default, hover/focus, and selected/pressed. Arrange them left-to-right on
a plain ink-brown presentation background.

Each component uses a double-frame construction: a dark lacquer-wood
outer support and warm rice-paper inner writing surface, with a generous
empty text-safe area and a small fastening detail at the left. Default is
quiet and flat. Hover/focus lifts slightly with a restrained amber edge
and visible non-text focus cue. Selected is pressed into the page and
shows one small irregular hongqu-red seal imprint at the right.

No text, letters, numbers, logo, generic gray border, glassmorphism,
neon, glossy Web3 styling, thick icons, or huge rounded pills.
```
