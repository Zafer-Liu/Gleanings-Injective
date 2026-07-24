"""Build Lin Nian'an's back-facing runtime frames from a complete source strip."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


REPO_ROOT = Path(__file__).resolve().parents[3]
ASSET_ROOT = REPO_ROOT / "assets/rpg_v2"
SOURCE_PATH = ASSET_ROOT / "sprites/spr_yi_back_walk_source.png"
TARGET_PATH = ASSET_ROOT / "sprites/spr_yi_walk_96x192.png"
PALETTE_PATH = ASSET_ROOT / "palette/fujian_rpg_24.png"


def flattened_pixels(image: Image.Image):
    return (
        image.get_flattened_data()
        if hasattr(image, "get_flattened_data")
        else image.getdata()
    )


def project_palette() -> Image.Image:
    with Image.open(PALETTE_PATH) as image:
        colors = list(
            dict.fromkeys(flattened_pixels(image.convert("RGB")))
        )
    palette = Image.new("P", (1, 1))
    flat = [channel for color in colors for channel in color]
    flat.extend([0] * (768 - len(flat)))
    palette.putpalette(flat[:768])
    return palette


def foreground_mask(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    mask = Image.new("L", rgb.size, 0)
    pixels = []
    for red, green, blue in flattened_pixels(rgb):
        is_green = (
            green > 145
            and green > red * 1.45
            and green > blue * 1.45
            and red < 150
            and blue < 150
        )
        pixels.append(0 if is_green else 255)
    mask.putdata(pixels)
    return mask


def quantize_rgba(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A").point(
        lambda value: 255 if value >= 128 else 0
    )
    rgb = image.convert("RGB").quantize(
        palette=project_palette(),
        dither=Image.Dither.NONE,
    ).convert("RGB")
    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    return result


def source_cell(
    image: Image.Image,
    mask: Image.Image,
    column: int,
) -> tuple[Image.Image, Image.Image]:
    left = round(column * image.width / 3)
    right = round((column + 1) * image.width / 3)
    return (
        image.crop((left, 0, right, image.height)),
        mask.crop((left, 0, right, image.height)),
    )


def build_back_subject(
    cell: Image.Image,
    mask: Image.Image,
) -> Image.Image:
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("Back-facing source cell has no character")
    if bbox[1] < 64:
        raise ValueError(
            "Back-facing source character is clipped at the top edge"
        )
    subject = cell.crop(bbox).convert("RGBA")
    subject_mask = mask.crop(bbox)
    scale = min(28 / subject.width, 45 / subject.height)
    size = (
        max(1, round(subject.width * scale)),
        max(1, round(subject.height * scale)),
    )
    subject = subject.resize(size, Image.Resampling.NEAREST)
    subject_mask = subject_mask.resize(size, Image.Resampling.NEAREST)
    subject.putalpha(subject_mask)
    return subject


def main() -> None:
    with Image.open(SOURCE_PATH) as source:
        back_source = source.convert("RGBA")
    source_mask = foreground_mask(back_source)

    with Image.open(TARGET_PATH) as target:
        sheet = target.convert("RGBA")
    sheet.paste((0, 0, 0, 0), (0, 144, 96, 192))

    for column in range(3):
        cell, cell_mask = source_cell(
            back_source,
            source_mask,
            column,
        )
        subject = build_back_subject(cell, cell_mask)
        x = column * 32 + (32 - subject.width) // 2
        y = 192 - subject.height
        sheet.alpha_composite(subject, (x, y))

    quantize_rgba(sheet).save(TARGET_PATH, optimize=True)
    print("Lin Nian'an back-facing frames rebuilt from complete source.")


if __name__ == "__main__":
    main()
