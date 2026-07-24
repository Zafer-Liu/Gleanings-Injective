import type Phaser from "phaser";

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

export function advancedWrap(
  width: number
): Pick<TextStyle, "wordWrap"> {
  return {
    wordWrap: {
      width,
      useAdvancedWrap: true
    }
  };
}
