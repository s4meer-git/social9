import { describe, expect, it } from "vitest";
import { planGrid, tileName } from "./grid";

describe("instagram grid", () => {
  it("numbers tiles so the bottom right is posted first and the top left last", () => {
    const g = planGrid(3000, 3000, 2, "1:1");
    expect(g.tiles).toHaveLength(6);
    expect(g.tiles[0]).toMatchObject({ row: 0, col: 0, order: 6 });
    expect(g.tiles[5]).toMatchObject({ row: 1, col: 2, order: 1 });
  });

  it("crops the photo to the grid's shape and splits it evenly", () => {
    const g = planGrid(4000, 3000, 1, "3:4");
    // one row of three 3:4 tiles is a 9:4 grid
    expect(g.crop.w / g.crop.h).toBeCloseTo(9 / 4, 3);
    expect(g.tiles[1].src.x - g.tiles[0].src.x).toBeCloseTo(g.crop.w / 3, 6);
    expect(g.tiles[2].src.x + g.tiles[2].src.w).toBeCloseTo(g.crop.x + g.crop.w, 6);
  });

  it("names files so they sort in posting order", () => {
    expect(tileName("beach", 3, 12)).toBe("beach-post-03-of-12.jpg");
    expect(tileName("beach", 12, 12) > tileName("beach", 3, 12)).toBe(true);
  });
});
