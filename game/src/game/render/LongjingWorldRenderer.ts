import Phaser from "phaser";
import {
  LONGJING_MAPS,
  LONGJING_OBJECT_LAYOUT,
  type LongjingPickingLeaf
} from "../../content/longjing/content";

export type LongjingMapKey = keyof typeof LONGJING_MAPS;
export type LeafVisualPolicy = {
  silhouette: "bud" | "standard" | "wide";
  dew: boolean;
  damaged: boolean;
};

const COLOR = {
  ink: 0x171516,
  dark: 0x262223,
  brown: 0x514137,
  wood: 0x6d5846,
  warm: 0xa68a68,
  paper: 0xf0e4ca,
  seal: 0x7f3029,
  ember: 0xc7653d,
  teaDark: 0x1f352b,
  tea: 0x3e6345,
  teaMid: 0x567a51,
  teaLight: 0x91ab73,
  teaPale: 0xb2c58a,
  rain: 0x647b82,
  rainLight: 0xafc3bd,
  mist: 0xd6e1d5
} as const;

function drawPixelGrid(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  tileSize: number,
  lineColor: number,
  alpha = 0.16
): void {
  graphics.lineStyle(1, lineColor, alpha);
  for (let x = 0; x <= width; x += tileSize) {
    graphics.lineBetween(x, 0, x, height);
  }
  for (let y = 0; y <= height; y += tileSize) {
    graphics.lineBetween(0, y, width, y);
  }
}

function textLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color = "#F0E4CA"
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "11px",
      color,
      backgroundColor: "#262223",
      padding: { x: 7, y: 4 }
    })
    .setOrigin(0.5, 1)
    .setDepth(y);
}

function renderMarket(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number
): void {
  graphics.fillStyle(0x8b7055).fillRect(0, 0, width, height);
  drawPixelGrid(graphics, width, height, 32, COLOR.dark, 0.22);

  graphics.fillStyle(0x6d5846);
  graphics.fillRect(64, 320, width - 128, 64);
  graphics.fillRect(544, 64, 64, height - 128);
  graphics.fillStyle(0xa68a68);
  for (let x = 80; x < width - 80; x += 64) {
    graphics.fillRect(x, 340, 32, 5);
  }
  for (let y = 80; y < height - 80; y += 64) {
    graphics.fillRect(573, y, 5, 32);
  }

  const buildings = [
    { x: 128, y: 128, w: 288, h: 160, sign: "春 和 茶 行" },
    { x: 480, y: 96, w: 256, h: 160, sign: "旧 货 与 茶" },
    { x: 896, y: 96, w: 256, h: 224, sign: "守 一 茶 坊" }
  ];
  buildings.forEach((building, index) => {
    graphics.fillStyle(index === 2 ? 0x3a302b : COLOR.brown);
    graphics.fillRect(building.x, building.y, building.w, building.h);
    graphics.lineStyle(4, COLOR.dark, 1);
    graphics.strokeRect(
      building.x,
      building.y,
      building.w,
      building.h
    );
    graphics.fillStyle(0x262223);
    graphics.fillRect(
      building.x + 18,
      building.y + 48,
      building.w - 36,
      80
    );
    textLabel(
      scene,
      building.x + building.w / 2,
      building.y + 44,
      building.sign,
      index === 2 ? "#A68A68" : "#F0E4CA"
    );
  });

  graphics.fillStyle(0x514137);
  graphics.fillRect(448, 448, 192, 64);
  graphics.fillRect(704, 448, 160, 64);
  graphics.fillStyle(0x71915f);
  graphics.fillRect(476, 428, 22, 28);
  graphics.fillStyle(0x7f3029);
  graphics.fillRect(548, 424, 22, 32);
  graphics.fillStyle(0xded0b3);
  graphics.fillRect(748, 428, 64, 28);
  textLabel(scene, 544, 518, "两罐同号茶");
  textLabel(scene, 784, 518, "票据与旧账");

  graphics.fillStyle(0x3a302b);
  graphics.fillRect(984, 344, 28, 44);
  graphics.fillStyle(0xa68a68);
  graphics.fillRect(990, 350, 16, 20);
}

function renderTerrace(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number
): void {
  graphics.fillStyle(0x71915f).fillRect(0, 0, width, height);
  drawPixelGrid(graphics, width, height, 32, COLOR.teaDark, 0.12);

  graphics.fillStyle(0x839ca0);
  graphics.fillRect(64, 64, width - 128, 32);
  graphics.fillStyle(0xafc3bd);
  for (let x = 96; x < width - 96; x += 96) {
    graphics.fillRect(x, 72, 48, 3);
  }

  [5, 11, 17].forEach((row) => {
    [4, 15, 26, 37].forEach((column, index) => {
      const w = index === 3 ? 7 : 8;
      graphics.fillStyle(COLOR.teaDark);
      graphics.fillRect(column * 32, row * 32, w * 32, 64);
      graphics.fillStyle(COLOR.tea);
      for (let x = column * 32 + 8; x < (column + w) * 32; x += 24) {
        graphics.fillRect(x, row * 32 + 8, 14, 10);
        graphics.fillRect(x + 4, row * 32 + 26, 18, 12);
        graphics.fillStyle(COLOR.teaMid);
        graphics.fillRect(x + 8, row * 32 + 12, 5, 25);
        graphics.fillStyle(COLOR.tea);
      }
      graphics.fillStyle(COLOR.teaLight);
      graphics.fillRect(
        column * 32,
        row * 32 + 58,
        w * 32,
        4
      );
    });
  });

  graphics.fillStyle(0xc4a883);
  graphics.fillRect(64, 736, width - 128, 112);
  graphics.fillStyle(0xa68a68);
  for (let x = 96; x < width - 96; x += 64) {
    graphics.fillRect(x, 760, 36, 5);
    graphics.fillRect(x + 20, 808, 36, 5);
  }

  graphics.fillStyle(0x514137);
  graphics.fillRect(1248, 736, 160, 128);
  graphics.fillStyle(0xded0b3);
  graphics.fillRect(1272, 752, 112, 12);
  textLabel(scene, 1328, 730, "收叶亭");
  textLabel(scene, 768, 892, "清明之前 · 先看叶，再动手");
}

function renderWorkshop(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  present: boolean
): void {
  graphics
    .fillStyle(present ? 0x6d5846 : 0x8b7055)
    .fillRect(0, 0, width, height);
  drawPixelGrid(graphics, width, height, 32, COLOR.dark, 0.24);
  graphics.fillStyle(0x3a302b);
  graphics.fillRect(0, 0, width, 96);
  graphics.fillRect(0, 0, 64, height);
  graphics.fillRect(width - 64, 0, 64, height);

  const rect = (item: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => ({
    x: item.x * 32,
    y: item.y * 32,
    width: item.width * 32,
    height: item.height * 32
  });

  const leftStorage = rect(
    present
      ? LONGJING_OBJECT_LAYOUT.truth.oldCabinet
      : LONGJING_OBJECT_LAYOUT.workshop.northShelf
  );
  const rightStorage = rect(
    present
      ? LONGJING_OBJECT_LAYOUT.truth.signatureCabinet
      : LONGJING_OBJECT_LAYOUT.workshop.dryingRack
  );
  graphics.fillStyle(0x514137);
  graphics.fillRect(
    leftStorage.x,
    leftStorage.y,
    leftStorage.width,
    leftStorage.height
  );
  graphics.fillRect(
    rightStorage.x,
    rightStorage.y,
    rightStorage.width,
    rightStorage.height
  );
  graphics.fillStyle(0x91ab73);
  for (
    let x = leftStorage.x + 22;
    x < leftStorage.x + leftStorage.width - 18;
    x += 32
  ) {
    graphics.fillRect(x, leftStorage.y + 16, 20, 8);
  }

  const stove = rect(
    present
      ? LONGJING_OBJECT_LAYOUT.truth.sealedStove
      : LONGJING_OBJECT_LAYOUT.workshop.stove
  );
  const stoveX = stove.x;
  const stoveY = stove.y;
  graphics.fillStyle(0x514137);
  graphics.fillRect(stoveX, stoveY, stove.width, stove.height);
  graphics.fillStyle(0x262223);
  graphics.fillRect(stoveX + 18, stoveY + 14, stove.width - 36, 82);
  graphics.fillStyle(0x171516);
  graphics.fillCircle(stoveX + 112, stoveY + 48, 54);
  graphics.lineStyle(5, 0xa68a68, 1);
  graphics.strokeCircle(stoveX + 112, stoveY + 48, 54);
  if (!present) {
    graphics.fillStyle(COLOR.ember);
    graphics.fillRect(stoveX + 90, stoveY + 108, 44, 12);
  } else {
    graphics.fillStyle(0x514137);
    graphics.fillRect(stoveX + 24, stoveY + 20, 176, 32);
  }

  const workTable = rect(
    present
      ? LONGJING_OBJECT_LAYOUT.truth.teaTable
      : LONGJING_OBJECT_LAYOUT.workshop.ledgerTable
  );
  graphics.fillStyle(0x514137);
  graphics.fillRect(
    workTable.x,
    workTable.y,
    workTable.width,
    workTable.height
  );
  graphics.fillStyle(0xded0b3);
  graphics.fillRect(
    workTable.x + 30,
    workTable.y + 20,
    workTable.width - 60,
    42
  );
  graphics.fillStyle(0x7f3029);
  graphics.fillRect(
    workTable.x + workTable.width - 70,
    workTable.y + 28,
    20,
    20
  );

  if (present) {
    const signboard = rect(LONGJING_OBJECT_LAYOUT.truth.signboard);
    graphics.fillStyle(0x262223);
    graphics.fillRect(
      signboard.x,
      signboard.y,
      signboard.width,
      signboard.height
    );
    graphics.fillStyle(0xa68a68);
    graphics.fillRect(
      signboard.x + 22,
      signboard.y + 22,
      signboard.width - 44,
      16
    );
    textLabel(
      scene,
      workTable.x + workTable.width / 2,
      workTable.y - 12,
      "旧账 · 留底 · 来源声明"
    );
    textLabel(
      scene,
      stoveX + stove.width / 2,
      stoveY - 4,
      "封存十二年的锅"
    );
  } else {
    const baskets = rect(
      LONGJING_OBJECT_LAYOUT.workshop.basketStack
    );
    graphics.fillStyle(0x514137);
    graphics.fillRect(
      baskets.x,
      baskets.y,
      baskets.width,
      baskets.height
    );
    graphics.fillStyle(0xc4a883);
    for (let x = baskets.x + 18; x < baskets.x + baskets.width; x += 46) {
      graphics.fillRect(x, baskets.y + 18, 30, 48);
      graphics.lineStyle(2, 0x262223, 1);
      graphics.strokeRect(x, baskets.y + 18, 30, 48);
    }
    textLabel(
      scene,
      stoveX + stove.width / 2,
      stoveY - 4,
      "青锅 · 回潮 · 辉锅"
    );
    textLabel(
      scene,
      workTable.x + workTable.width / 2,
      workTable.y - 4,
      "旧签样与账桌"
    );
    textLabel(
      scene,
      640,
      682,
      "抖  带  挤  甩  挺  拓  扣  抓  压  磨"
    );
  }
}

export function renderLongjingWorld(
  scene: Phaser.Scene,
  key: LongjingMapKey
): { width: number; height: number } {
  const map = LONGJING_MAPS[key];
  const width = map.size.width * map.tileSize;
  const height = map.size.height * map.tileSize;
  const graphics = scene.add.graphics().setDepth(0);

  if (key === "market") {
    renderMarket(scene, graphics, width, height);
  } else if (key === "terrace") {
    renderTerrace(scene, graphics, width, height);
  } else {
    renderWorkshop(scene, graphics, width, height, key === "truth");
  }
  return { width, height };
}

export function createLeafMarker(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: LongjingPickingLeaf["kind"],
  active: boolean
): Phaser.GameObjects.Graphics {
  const leaf = scene.add.graphics().setPosition(x, y).setDepth(y);
  const policy = leafVisualPolicy(kind);
  const fill = active ? COLOR.teaPale : COLOR.teaMid;
  leaf.fillStyle(fill, 1);
  if (policy.silhouette === "bud") {
    leaf.fillTriangle(-4, 4, 0, -9, 2, 5);
    leaf.fillRect(3, -2, 3, 8);
  } else if (policy.silhouette === "wide") {
    leaf.fillTriangle(-13, 6, -2, -12, 0, 7);
    leaf.fillTriangle(0, 7, 13, -9, 12, 9);
  } else {
    leaf.fillTriangle(-9, 4, 0, -10, 1, 5);
    leaf.fillTriangle(0, 5, 9, -7, 9, 7);
  }
  if (policy.dew) {
    leaf.fillStyle(COLOR.rainLight, 1);
    leaf.fillRect(-6, -1, 3, 3);
    leaf.fillRect(5, 2, 3, 4);
  }
  if (policy.damaged) {
    leaf.fillStyle(COLOR.ink, 1);
    leaf.fillTriangle(5, -4, 10, -1, 6, 2);
  }
  leaf.lineStyle(2, COLOR.teaDark, 1);
  leaf.lineBetween(0, 7, 0, -8);
  return leaf;
}

export function leafVisualPolicy(
  kind: LongjingPickingLeaf["kind"]
): LeafVisualPolicy {
  return {
    silhouette:
      kind === "too_young"
        ? "bud"
        : kind === "mature"
          ? "wide"
          : "standard",
    dew: kind === "wet",
    damaged: kind === "damaged"
  };
}
