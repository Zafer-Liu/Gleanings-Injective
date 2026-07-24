"""Verify dimensions, palette, alpha, grid alignment, and manifest paths."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


REPO_ROOT = Path(__file__).resolve().parents[3]
MANIFEST_PATH = REPO_ROOT / "assets/rpg_v2/manifest/assets.manifest.json"
YI_WALK_PATH = REPO_ROOT / "assets/rpg_v2/sprites/spr_yi_walk_96x192.png"


def visible_colors(image: Image.Image) -> int:
    rgba = image.convert("RGBA")
    pixels = (
        rgba.get_flattened_data()
        if hasattr(rgba, "get_flattened_data")
        else rgba.getdata()
    )
    return len(
        {
            (red, green, blue)
            for red, green, blue, alpha in pixels
            if alpha > 0
        }
    )


def verify_yi_back_crown() -> list[str]:
    failures: list[str] = []
    with Image.open(YI_WALK_PATH) as image:
        rgba = image.convert("RGBA")
        for frame in range(9, 12):
            column = frame % 3
            row = frame // 3
            cell = rgba.crop(
                (
                    column * 32,
                    row * 48,
                    (column + 1) * 32,
                    (row + 1) * 48,
                )
            )
            alpha = cell.getchannel("A")
            visible_rows = []
            for y in range(cell.height):
                visible_x = [
                    x for x in range(cell.width) if alpha.getpixel((x, y)) > 0
                ]
                if visible_x:
                    visible_rows.append((y, len(visible_x)))
            if not visible_rows:
                failures.append(f"spr_yi frame {frame}: empty back frame")
                continue
            crown_y, crown_width = visible_rows[0]
            next_width = visible_rows[1][1]
            if crown_y < 2:
                failures.append(
                    f"spr_yi frame {frame}: back crown has only "
                    f"{crown_y}px top padding, expected at least 2px"
                )
            if crown_width > 6 or next_width <= crown_width:
                failures.append(
                    f"spr_yi frame {frame}: back crown is flat "
                    f"({crown_width}px then {next_width}px)"
                )
    return failures


def verify() -> list[str]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    failures: list[str] = []
    palette_limit = int(manifest["palette_limit"])

    for asset in manifest["assets"]:
        asset_id = asset["asset_id"]
        path = REPO_ROOT / asset["file"]
        if not path.is_file():
            failures.append(f"{asset_id}: missing {path}")
            continue

        with Image.open(path) as image:
            expected_size = (int(asset["width"]), int(asset["height"]))
            if image.size != expected_size:
                failures.append(
                    f"{asset_id}: size {image.size}, expected {expected_size}"
                )

            cell = asset.get("cell")
            if cell and (
                image.width % int(cell[0]) != 0
                or image.height % int(cell[1]) != 0
            ):
                failures.append(
                    f"{asset_id}: dimensions are not aligned to cell {cell}"
                )

            alpha_rule = asset.get("alpha")
            if alpha_rule == "hard_0_255":
                alpha_channel = image.convert("RGBA").getchannel("A")
                alpha_values = set(
                    alpha_channel.get_flattened_data()
                    if hasattr(alpha_channel, "get_flattened_data")
                    else alpha_channel.getdata()
                )
                if not alpha_values.issubset({0, 255}):
                    failures.append(
                        f"{asset_id}: alpha contains non-hard values"
                    )

            if asset.get("palette") in {"project_24", "longjing_24"} or asset_id.startswith(
                (
                    "map_apartment",
                    "tileset_apartment",
                    "spr_mia",
                    "obj_cardboard",
                    "obj_laojiu",
                    "it_taipo",
                    "preview_apartment",
                )
            ):
                color_count = visible_colors(image)
                if color_count > palette_limit:
                    failures.append(
                        f"{asset_id}: {color_count} colors exceed {palette_limit}"
                    )

    failures.extend(verify_yi_back_crown())
    return failures


if __name__ == "__main__":
    errors = verify()
    if errors:
        print("RPG asset verification failed:")
        for error in errors:
            print(f"- {error}")
        sys.exit(1)
    print("RPG asset verification passed.")
