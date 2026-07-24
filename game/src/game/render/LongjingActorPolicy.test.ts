import { describe, expect, it } from "vitest";
import { longjingActorTexture } from "./LongjingActorPolicy";

describe("Longjing actor texture policy", () => {
  it("uses dedicated chapter-two art for every new role", () => {
    expect(longjingActorTexture("chen_old")).toBe("actor-chen-old");
    expect(longjingActorTexture("chen_young")).toBe("actor-chen-young");
    expect(longjingActorTexture("master_he")).toBe("actor-master-he");
    expect(longjingActorTexture("market_vendor")).toBe(
      "actor-market-vendor"
    );
    expect(longjingActorTexture("tea_merchant")).toBe(
      "actor-tea-merchant"
    );
  });

  it("keeps recurring leads on their established sheets", () => {
    expect(longjingActorTexture("lin_nianan")).toBe("actor-yi");
    expect(longjingActorTexture("mia")).toBe("actor-mia");
  });
});
