"""Build chapter-two runtime sprites from image-generation source boards."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


REPO_ROOT = Path(__file__).resolve().parents[3]
ASSET_ROOT = REPO_ROOT / "assets/rpg_v2"
SOURCE_ROOT = ASSET_ROOT / "sources/longjing"
PALETTE_PATH = ASSET_ROOT / "palette/longjing_rpg_24.png"
LONGJING_COLORS = [
    "#171516",
    "#262223",
    "#3A302B",
    "#514137",
    "#6D5846",
    "#8B7055",
    "#A68A68",
    "#C4A883",
    "#DED0B3",
    "#F0E4CA",
    "#7F3029",
    "#C7653D",
    "#1F352B",
    "#2D4B37",
    "#3E6345",
    "#567A51",
    "#71915F",
    "#91AB73",
    "#B2C58A",
    "#D1D9A2",
    "#647B82",
    "#839CA0",
    "#AFC3BD",
    "#D6E1D5",
]

CHARACTERS = {
    "chen_old_walk_source.png": "spr_chen_old_walk_96x192.png",
    "chen_young_walk_source.png": "spr_chen_young_walk_96x192.png",
    "master_he_walk_source.png": "spr_master_he_walk_96x192.png",
    "market_vendor_walk_source.png": "spr_market_vendor_walk_96x192.png",
    "tea_merchant_walk_source.png": "spr_tea_merchant_walk_96x192.png",
}


def project_palette() -> Image.Image:
    with Image.open(PALETTE_PATH) as image:
        colors = list(dict.fromkeys(image.convert("RGB").getdata()))
    palette = Image.new("P", (1, 1))
    flat = [channel for color in colors for channel in color]
    flat.extend(
        channel
        for _ in range(256 - len(colors))
        for channel in colors[0]
    )
    palette.putpalette(flat[:768])
    return palette


def write_palette() -> None:
    image = Image.new("RGB", (24, 1))
    image.putdata(
        [
            tuple(int(color[index : index + 2], 16) for index in (1, 3, 5))
            for color in LONGJING_COLORS
        ]
    )
    PALETTE_PATH.parent.mkdir(parents=True, exist_ok=True)
    image.save(PALETTE_PATH, optimize=True)


def quantize_rgba(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
    rgb = image.convert("RGB").quantize(
        palette=project_palette(),
        dither=Image.Dither.NONE,
    ).convert("RGB")
    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    return result


def chroma_mask(image: Image.Image) -> Image.Image:
    mask = Image.new("L", image.size, 0)
    pixels: list[int] = []
    for red, green, blue, _ in image.convert("RGBA").getdata():
        magenta = (
            red > 175
            and blue > 155
            and green < 145
            and red > green * 1.35
            and blue > green * 1.25
        )
        pixels.append(0 if magenta else 255)
    mask.putdata(pixels)
    return mask


def grid_cell(
    image: Image.Image,
    mask: Image.Image,
    columns: int,
    rows: int,
    column: int,
    row: int,
) -> tuple[Image.Image, Image.Image]:
    left = round(column * image.width / columns)
    right = round((column + 1) * image.width / columns)
    top = round(row * image.height / rows)
    bottom = round((row + 1) * image.height / rows)
    return image.crop((left, top, right, bottom)), mask.crop(
        (left, top, right, bottom)
    )


def isolated_subject(
    cell: Image.Image,
    mask: Image.Image,
    max_size: tuple[int, int],
) -> Image.Image:
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("Generated grid cell has no foreground subject")
    subject = cell.crop(bbox).convert("RGBA")
    subject_mask = mask.crop(bbox)
    scale = min(max_size[0] / subject.width, max_size[1] / subject.height)
    size = (
        max(1, round(subject.width * scale)),
        max(1, round(subject.height * scale)),
    )
    subject = subject.resize(size, Image.Resampling.NEAREST)
    subject_mask = subject_mask.resize(size, Image.Resampling.NEAREST)
    subject.putalpha(subject_mask)
    return subject


def place_bottom_centered(
    canvas: Image.Image,
    subject: Image.Image,
    box: tuple[int, int, int, int],
) -> None:
    left, top, width, height = box
    x = left + (width - subject.width) // 2
    y = top + height - subject.height
    canvas.alpha_composite(subject, (x, y))


def build_character(source: Path, target: Path) -> None:
    with Image.open(source) as raw:
        image = raw.convert("RGBA")
    mask = chroma_mask(image)
    sheet = Image.new("RGBA", (96, 192), (0, 0, 0, 0))
    for row in range(4):
        for column in range(3):
            cell, cell_mask = grid_cell(image, mask, 3, 4, column, row)
            subject = isolated_subject(cell, cell_mask, (30, 46))
            place_bottom_centered(
                sheet,
                subject,
                (column * 32, row * 48, 32, 48),
            )
    target.parent.mkdir(parents=True, exist_ok=True)
    quantize_rgba(sheet).save(target, optimize=True)


def build_flat_atlas(
    source: Path,
    target: Path,
    source_grid: tuple[int, int],
    frame: tuple[int, int],
    max_subject: tuple[int, int],
) -> None:
    columns, rows = source_grid
    with Image.open(source) as raw:
        image = raw.convert("RGBA")
    mask = chroma_mask(image)
    frame_count = columns * rows
    atlas = Image.new(
        "RGBA",
        (frame[0] * frame_count, frame[1]),
        (0, 0, 0, 0),
    )
    index = 0
    for row in range(rows):
        for column in range(columns):
            cell, cell_mask = grid_cell(
                image, mask, columns, rows, column, row
            )
            subject = isolated_subject(cell, cell_mask, max_subject)
            place_bottom_centered(
                atlas,
                subject,
                (index * frame[0], 0, frame[0], frame[1]),
            )
            index += 1
    target.parent.mkdir(parents=True, exist_ok=True)
    quantize_rgba(atlas).save(target, optimize=True)


def main() -> None:
    write_palette()
    for source_name, target_name in CHARACTERS.items():
        build_character(
            SOURCE_ROOT / source_name,
            ASSET_ROOT / "sprites" / target_name,
        )
    build_flat_atlas(
        SOURCE_ROOT / "gameplay_objects_source.png",
        ASSET_ROOT / "objects/obj_longjing_gameplay_384x32.png",
        source_grid=(4, 3),
        frame=(32, 32),
        max_subject=(30, 29),
    )
    build_flat_atlas(
        SOURCE_ROOT / "leaf_states_source.png",
        ASSET_ROOT / "items/it_longjing_leaf_states_160x32.png",
        source_grid=(5, 1),
        frame=(32, 32),
        max_subject=(28, 28),
    )
    build_flat_atlas(
        SOURCE_ROOT / "firing_states_source.png",
        ASSET_ROOT / "fx/fx_longjing_firing_states_192x64.png",
        source_grid=(3, 1),
        frame=(64, 64),
        max_subject=(60, 60),
    )


if __name__ == "__main__":
    main()
