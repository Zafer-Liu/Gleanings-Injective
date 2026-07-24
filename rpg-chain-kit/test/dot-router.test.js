import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  artPath,
  renderCard
} from "../src/dot-router.js";

const BADGES = [
  [
    "badge_ch1_winter_brew_seal",
    "winter-brew-seal.svg"
  ],
  [
    "badge_ch1_red_koji_trace",
    "red-koji-trace.svg"
  ],
  [
    "badge_ch1_warm_wine_cup",
    "warm-wine-cup.svg"
  ],
  [
    "badge_ch1_fujian_aged_rice_wine",
    "fujian-aged-rice-wine.svg"
  ],
  [
    "badge_ch2_old_tea_scoop",
    "old-tea-scoop.svg"
  ],
  [
    "badge_ch2_qingming_bud",
    "qingming-bud.svg"
  ],
  [
    "badge_ch2_hand_fire_mark",
    "hand-fire-mark.svg"
  ],
  [
    "badge_ch2_west_lake_longjing",
    "west-lake-longjing-tea.svg"
  ]
];

describe("Dot e-ink badge cards", () => {
  it("maps all canonical badge IDs to dedicated SVG art", () => {
    for (const [id, filename] of BADGES) {
      const source = artPath({
        collectible_id: id,
        category: "badge"
      });
      assert.equal(path.basename(source), filename);
      assert.equal(fs.existsSync(source), true);
    }
  });

  it("keeps legacy reward IDs compatible", () => {
    const aliases = {
      "act1-winter-brewing": "winter-brew-seal.svg",
      relic_dongniang_rare: "red-koji-trace.svg",
      relic_blue_white_cup_remember: "warm-wine-cup.svg",
      relic_one_jar_echo: "fujian-aged-rice-wine.svg",
      relic_old_tea_scoop: "old-tea-scoop.svg",
      relic_qingming_bud: "qingming-bud.svg",
      relic_palm_fire: "hand-fire-mark.svg",
      relic_one_leaf_origin: "west-lake-longjing-tea.svg"
    };

    for (const [id, filename] of Object.entries(aliases)) {
      assert.equal(
        path.basename(artPath({ collectible_id: id })),
        filename
      );
    }
  });

  it("renders every badge with white space instead of a black block", async () => {
    const signatures = new Set();
    for (const [id] of BADGES) {
      const card = await renderCard(
        {
          wallet: "0x1234567890123456789012345678901234567890",
          tokenId: "18",
          item: {
            collectible_id: id,
            category: "badge",
            name: id
          }
        },
        "https://example.test/share/18"
      );
      const metadata = await sharp(card).metadata();
      assert.equal(metadata.width, 296);
      assert.equal(metadata.height, 152);

      const pixels = await sharp(card)
        .extract({ left: 9, top: 10, width: 132, height: 132 })
        .grayscale()
        .raw()
        .toBuffer();
      const black = pixels.filter((value) => value < 64).length;
      const white = pixels.filter((value) => value > 240).length;
      const blackCoverage = black / pixels.length;
      const whiteCoverage = white / pixels.length;

      assert.ok(
        blackCoverage > 0.025,
        `${id} has too little visible ink`
      );
      assert.ok(
        blackCoverage < 0.45,
        `${id} collapses into a black block`
      );
      assert.ok(
        whiteCoverage > 0.45,
        `${id} lacks readable negative space`
      );
      signatures.add(
        await sharp(card)
          .extract({ left: 9, top: 10, width: 132, height: 132 })
          .grayscale()
          .resize(16, 16)
          .raw()
          .toBuffer()
          .then((value) => value.toString("hex"))
      );
    }
    assert.equal(signatures.size, BADGES.length);
  });
});
