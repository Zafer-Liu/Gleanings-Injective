import { describe, expect, it } from "vitest";
import { chapterInventoryEntries } from "./ChapterInventoryPanel";

describe("ChapterInventoryPanel", () => {
  it("maps the act-three inventory to visible material entries", () => {
    expect(
      chapterInventoryEntries([
        "ingredient_bowl",
        "ingredient_noodles",
        "ingredient_laojiu",
        "unknown_item"
      ])
    ).toEqual([
      {
        id: "ingredient_bowl",
        title: "瓷碗",
        description: "盛放月子酒面线的瓷碗。",
        texture: "obj-bowl"
      },
      {
        id: "ingredient_noodles",
        title: "面线",
        description: "细长柔韧的福建面线。",
        texture: "obj-noodles"
      },
      {
        id: "ingredient_laojiu",
        title: "福建老酒",
        description: "烹制月子酒面线要用的老酒。",
        texture: "obj-laojiu-scoop"
      }
    ]);
  });

  it("shows the cooked dish after the ingredients are consumed", () => {
    expect(chapterInventoryEntries(["item_cooked_noodles"])).toEqual([
      {
        id: "item_cooked_noodles",
        title: "老酒面线",
        description: "刚刚煮好的月子酒面线，应该趁热送给阿珍。",
        texture: "obj-cooked-noodles"
      }
    ]);
  });
});
