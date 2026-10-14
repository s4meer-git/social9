import { coverRect, type Rect } from "./geometry";

/** Tile shapes Instagram accepts. 3:4 matches how the profile grid shows posts. */
export const GRID_SHAPES = {
  "3:4": { width: 1080, height: 1440 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
} as const;
export type GridShape = keyof typeof GRID_SHAPES;

export interface GridTile {
  row: number;
  col: number;
  /** 1 = post this one first. The last one posted ends up top left on your profile. */
  order: number;
  /** the part of the photo this tile shows */
  src: Rect;
}

export interface GridPlan {
  cols: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
  /** the part of the photo the whole grid shows */
  crop: Rect;
  /** in reading order: top left first */
  tiles: GridTile[];
}

/**
 * Split a photo into a grid of tiles for an Instagram profile. The photo is cropped to the
 * grid's shape around (focusX, focusY), zoomed in by `zoom` (1 = as large as fits).
 */
export function planGrid(srcW: number, srcH: number, rows: number, shape: GridShape, focusX = 0.5, focusY = 0.5, zoom = 1, cols = 3): GridPlan {
  const { width: tileWidth, height: tileHeight } = GRID_SHAPES[shape];
  const crop = coverRect(srcW, srcH, cols * tileWidth, rows * tileHeight, focusX, focusY, zoom);
  const tw = crop.w / cols;
  const th = crop.h / rows;
  const tiles: GridTile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      tiles.push({ row, col, order: rows * cols - index, src: { x: crop.x + col * tw, y: crop.y + row * th, w: tw, h: th } });
    }
  }
  return { cols, rows, tileWidth, tileHeight, crop, tiles };
}

/** File name for a tile, so sorting by name gives the posting order. */
export const tileName = (base: string, order: number, total: number) => `${base}-post-${String(order).padStart(String(total).length, "0")}-of-${total}.jpg`;
