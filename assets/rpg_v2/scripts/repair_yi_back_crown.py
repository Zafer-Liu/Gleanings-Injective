"""Restore the missing crown row in Lin Nian'an's three back-facing frames."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


REPO_ROOT = Path(__file__).resolve().parents[3]
SPRITE_PATH = REPO_ROOT / "assets/rpg_v2/sprites/spr_yi_walk_96x192.png"

OUTLINE = (33, 26, 23, 255)
HAIR = (48, 35, 29, 255)
HIGHLIGHT = (70, 49, 39, 255)
CROWN_ROW = (OUTLINE, HAIR, HIGHLIGHT, HAIR, OUTLINE)


def repair_back_crowns(image: Image.Image) -> Image.Image:
    repaired = image.convert("RGBA")
    for frame in range(9, 12):
        column = frame % 3
        frame_left = column * 32
        frame_top = (frame // 3) * 48
        alpha = repaired.getchannel("A")
        first_visible_y = next(
            y
            for y in range(frame_top, frame_top + 48)
            if any(
                alpha.getpixel((x, y)) > 0
                for x in range(frame_left, frame_left + 32)
            )
        )
        visible_x = [
            x
            for x in range(frame_left, frame_left + 32)
            if alpha.getpixel((x, first_visible_y)) > 0
        ]
        center_x = (visible_x[0] + visible_x[-1]) // 2
        for offset, color in enumerate(CROWN_ROW, start=-2):
            repaired.putpixel((center_x + offset, frame_top), color)
    return repaired


def main() -> None:
    with Image.open(SPRITE_PATH) as source:
        repaired = repair_back_crowns(source)
    repaired.save(SPRITE_PATH, optimize=True)
    print("Lin Nian'an back-facing crown restored.")


if __name__ == "__main__":
    main()
