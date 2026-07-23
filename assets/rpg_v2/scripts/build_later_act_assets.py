"""Build later-act runtime PNGs from selected image-generation sources."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


REPO_ROOT = Path(__file__).resolve().parents[3]
ASSET_ROOT = REPO_ROOT / "assets/rpg_v2"
PALETTE_PATH = ASSET_ROOT / "palette/fujian_rpg_24.png"


def project_palette() -> tuple[Image.Image, list[tuple[int, int, int]]]:
    with Image.open(PALETTE_PATH) as image:
        rgb = image.convert("RGB")
        source_pixels = (
            rgb.get_flattened_data()
            if hasattr(rgb, "get_flattened_data")
            else rgb.getdata()
        )
        colors = list(dict.fromkeys(source_pixels))
    palette = Image.new("P", (1, 1))
    flat = [channel for color in colors for channel in color]
    flat.extend([0] * (768 - len(flat)))
    palette.putpalette(flat[:768])
    return palette, colors


def quantize_rgb(image: Image.Image) -> Image.Image:
    palette, _ = project_palette()
    return image.convert("RGB").quantize(
        palette=palette,
        dither=Image.Dither.NONE,
    ).convert("RGB")


def quantize_rgba(image: Image.Image) -> Image.Image:
    alpha = image.convert("RGBA").getchannel("A").point(
        lambda value: 255 if value >= 128 else 0
    )
    rgb = quantize_rgb(image)
    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha)
    return rgba


def crop_to_ratio(image: Image.Image, width: int, height: int) -> Image.Image:
    target_ratio = width / height
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        crop_width = round(image.height * target_ratio)
        left = (image.width - crop_width) // 2
        box = (left, 0, left + crop_width, image.height)
    else:
        crop_height = round(image.width / target_ratio)
        top = (image.height - crop_height) // 2
        box = (0, top, image.width, top + crop_height)
    return image.crop(box)


def build_map(source: Path, target: Path, size: tuple[int, int]) -> None:
    with Image.open(source) as image:
        cropped = crop_to_ratio(image.convert("RGB"), *size)
        resized = cropped.resize(size, Image.Resampling.LANCZOS)
        final = quantize_rgb(resized)
    target.parent.mkdir(parents=True, exist_ok=True)
    final.save(target, optimize=True)


def foreground_mask(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    mask = Image.new("L", rgb.size, 0)
    pixels = []
    source_pixels = (
        rgb.get_flattened_data()
        if hasattr(rgb, "get_flattened_data")
        else rgb.getdata()
    )
    for red, green, blue in source_pixels:
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


def build_sprite_sheet(source: Path, target: Path) -> None:
    with Image.open(source) as image:
        rgba = image.convert("RGBA")
    mask = foreground_mask(rgba)
    source_width = rgba.width
    source_height = rgba.height
    sheet = Image.new("RGBA", (96, 192), (0, 0, 0, 0))

    for row in range(4):
        for column in range(3):
            left = round(column * source_width / 3)
            right = round((column + 1) * source_width / 3)
            top = round(row * source_height / 4)
            bottom = round((row + 1) * source_height / 4)
            cell = rgba.crop((left, top, right, bottom))
            cell_mask = mask.crop((left, top, right, bottom))
            bbox = cell_mask.getbbox()
            if bbox is None:
                continue
            subject = cell.crop(bbox)
            subject_mask = cell_mask.crop(bbox)
            scale = min(28 / subject.width, 44 / subject.height)
            size = (
                max(1, round(subject.width * scale)),
                max(1, round(subject.height * scale)),
            )
            subject = subject.resize(size, Image.Resampling.NEAREST)
            subject_mask = subject_mask.resize(size, Image.Resampling.NEAREST)
            subject.putalpha(subject_mask)
            x = column * 32 + (32 - size[0]) // 2
            y = row * 48 + 47 - size[1]
            sheet.alpha_composite(subject, (x, y))

    final = quantize_rgba(sheet)
    target.parent.mkdir(parents=True, exist_ok=True)
    final.save(target, optimize=True)


def rgba_canvas(size: int = 32) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    return image, ImageDraw.Draw(image)


def save_icon(image: Image.Image, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    quantize_rgba(image).save(target, optimize=True)


def draw_small_items() -> None:
    deep = "#211A17"
    wood = "#6E4932"
    paper = "#EADDC5"
    straw = "#D4B46A"
    red = "#A83B32"
    blue = "#4C6265"
    pale = "#B7C2C0"

    bowl, draw = rgba_canvas()
    draw.ellipse((5, 10, 27, 22), fill=deep)
    draw.ellipse((7, 9, 25, 18), fill=pale)
    draw.ellipse((9, 11, 23, 16), fill=blue)
    draw.rectangle((9, 18, 23, 23), fill=pale)
    draw.rectangle((12, 23, 20, 25), fill=blue)
    save_icon(bowl, ASSET_ROOT / "objects/obj_bowl_32x32.png")

    noodles, draw = rgba_canvas()
    draw.rectangle((6, 7, 26, 24), fill=wood)
    for offset in range(0, 16, 3):
        draw.line((9 + offset, 9, 7 + offset, 22), fill=paper, width=2)
    draw.rectangle((5, 23, 27, 26), fill=deep)
    save_icon(noodles, ASSET_ROOT / "objects/obj_noodles_32x32.png")

    ladle, draw = rgba_canvas()
    draw.ellipse((6, 14, 22, 28), fill=deep)
    draw.ellipse((8, 15, 20, 24), fill=red)
    draw.line((18, 16, 28, 4), fill=wood, width=3)
    draw.line((20, 16, 30, 5), fill=straw, width=1)
    save_icon(ladle, ASSET_ROOT / "objects/obj_laojiu_ladle_32x32.png")

    cooked, draw = rgba_canvas()
    draw.ellipse((4, 9, 28, 23), fill=deep)
    draw.ellipse((6, 8, 26, 19), fill=pale)
    draw.ellipse((8, 10, 24, 18), fill=red)
    for x in (10, 13, 16, 19, 22):
        draw.line((x, 10, x - 3, 18), fill=paper, width=1)
    draw.rectangle((8, 19, 24, 25), fill=blue)
    save_icon(cooked, ASSET_ROOT / "objects/obj_cooked_noodles_32x32.png")

    cup32, draw = rgba_canvas()
    draw.ellipse((5, 5, 27, 14), fill=deep)
    draw.ellipse((7, 6, 25, 12), fill=pale)
    draw.ellipse((9, 7, 23, 11), fill=red)
    draw.rectangle((7, 10, 25, 24), fill=pale)
    draw.rectangle((9, 13, 11, 22), fill=blue)
    draw.rectangle((15, 12, 17, 23), fill=blue)
    draw.rectangle((21, 13, 23, 22), fill=blue)
    draw.rectangle((11, 24, 21, 27), fill=blue)
    cup128 = cup32.resize((128, 128), Image.Resampling.NEAREST)
    save_icon(
        cup128,
        ASSET_ROOT / "items/it_blue_white_cup_128x128.png",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--brewery-source", type=Path, required=True)
    parser.add_argument("--kitchen-source", type=Path, required=True)
    parser.add_argument("--young-source", type=Path, required=True)
    parser.add_argument("--afeng-source", type=Path, required=True)
    parser.add_argument("--middle-source", type=Path, required=True)
    parser.add_argument("--azhen-source", type=Path, required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    build_map(
        args.brewery_source,
        ASSET_ROOT / "maps/map_brewery_winter_1408x960.png",
        (1408, 960),
    )
    build_map(
        args.kitchen_source,
        ASSET_ROOT / "maps/map_postpartum_kitchen_1152x832.png",
        (1152, 832),
    )
    for source, filename in [
        (args.young_source, "spr_taipo_young_walk_96x192.png"),
        (args.afeng_source, "spr_afeng_walk_96x192.png"),
        (args.middle_source, "spr_taipo_middle_walk_96x192.png"),
        (args.azhen_source, "spr_azhen_walk_96x192.png"),
    ]:
        build_sprite_sheet(source, ASSET_ROOT / f"sprites/{filename}")
    draw_small_items()
    print("Later-act assets built.")


if __name__ == "__main__":
    main()
