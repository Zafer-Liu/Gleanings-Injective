import Phaser from "phaser";
import { LONGJING_MAPS } from "../../content/longjing/content";

export type LongjingMapKey = keyof typeof LONGJING_MAPS;

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

  graphics.fillStyle(0x514137);
  graphics.fillRect(128, 128, 320, 64);
  graphics.fillRect(864, 160, 256, 96);
  graphics.fillStyle(0x91ab73);
  for (let x = 150; x < 430; x += 32) {
    graphics.fillRect(x, 144, 20, 8);
  }

  const stoveX = present ? 416 : 544;
  const stoveY = 384;
  graphics.fillStyle(0x262223);
  graphics.fillRect(stoveX, stoveY, 224, 128);
  graphics.fillStyle(0x171516);
  graphics.fillCircle(stoveX + 112, stoveY + 48, 78);
  graphics.lineStyle(7, 0xa68a68, 1);
  graphics.strokeCircle(stoveX + 112, stoveY + 48, 78);
  if (!present) {
    graphics.fillStyle(COLOR.ember);
    graphics.fillRect(stoveX + 90, stoveY + 108, 44, 12);
  } else {
    graphics.fillStyle(0x514137);
    graphics.fillRect(stoveX + 24, stoveY + 20, 176, 32);
  }

  graphics.fillStyle(0x514137);
  graphics.fillRect(416, 512, 256, 96);
  graphics.fillStyle(0xded0b3);
  graphics.fillRect(446, 532, 196, 42);
  graphics.fillStyle(0x7f3029);
  graphics.fillRect(602, 540, 20, 20);

  if (present) {
    graphics.fillStyle(0x262223);
    graphics.fillRect(128, 480, 160, 96);
    graphics.fillStyle(0xa68a68);
    graphics.fillRect(150, 502, 116, 16);
    textLabel(scene, 528, 500, "旧账 · 留底 · 来源声明");
    textLabel(scene, 528, 284, "封存十二年的锅");
  } else {
    textLabel(scene, 656, 380, "青锅 · 回潮 · 辉锅");
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
  active: boolean
): Phaser.GameObjects.Graphics {
  const leaf = scene.add.graphics().setPosition(x, y).setDepth(y);
  leaf.fillStyle(active ? COLOR.teaPale : COLOR.teaMid, 1);
  leaf.fillTriangle(-9, 4, 0, -10, 1, 5);
  leaf.fillTriangle(0, 5, 9, -7, 9, 7);
  leaf.lineStyle(2, COLOR.teaDark, 1);
  leaf.lineBetween(0, 7, 0, -8);
  return leaf;
}
