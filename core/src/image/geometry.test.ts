import { describe, expect, it } from "vitest";
import { containRect, coverRect, faceFocus, fitRect, formatBytes, panFit, panFocus, ratioLabel, toSource } from "./geometry";

describe("coverRect", () => {
  it("crops a landscape photo to a square from the center", () => {
    expect(coverRect(4000, 3000, 1080, 1080)).toEqual({ x: 500, y: 0, w: 3000, h: 3000 });
  });

  it("respects focus at the edges", () => {
    expect(coverRect(4000, 3000, 1080, 1080, 0, 0.5).x).toBe(0);
    expect(coverRect(4000, 3000, 1080, 1080, 1, 0.5).x).toBe(1000);
  });

  it("keeps the output ratio when cropping square → 9:16", () => {
    const r = coverRect(2000, 2000, 1080, 1920);
    expect(r.w / r.h).toBeCloseTo(1080 / 1920);
    expect(r.h).toBe(2000);
  });

  it("zoom crops tighter but stays inside the source", () => {
    const r = coverRect(4000, 3000, 1080, 1080, 0.5, 0.5, 2);
    expect(r.w).toBe(1500);
    expect(r.x).toBe(1250);
    expect(r.y).toBe(750);
  });
});

describe("containRect", () => {
  it("letterboxes a square into 16:9, centered", () => {
    expect(containRect(1000, 1000, 1600, 900)).toEqual({ x: 350, y: 0, w: 900, h: 900 });
  });
});

describe("panFocus", () => {
  it("dragging right reveals the left side (focus decreases)", () => {
    const crop = coverRect(4000, 3000, 1080, 1080);
    const next = panFocus(crop, 4000, 3000, 1080, 1080, 0.5, 0.5, 100, 0, 0.5);
    expect(next.focusX).toBeLessThan(0.5);
    expect(next.focusY).toBe(0.5); // no vertical slack
  });

  it("clamps to the edges", () => {
    const crop = coverRect(4000, 3000, 1080, 1080);
    expect(panFocus(crop, 4000, 3000, 1080, 1080, 0.5, 0.5, -99999, 0, 1).focusX).toBe(1);
  });
});

describe("labels", () => {
  it("formats common ratios", () => {
    expect(ratioLabel(1080, 1350)).toBe("4:5");
    expect(ratioLabel(1080, 1920)).toBe("9:16");
    expect(ratioLabel(1584, 396)).toBe("4:1");
  });

  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(150 * 1024)).toBe("150 KB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});

describe("faceFocus", () => {
  it("zooms so the face fills the target share of a square frame", () => {
    const face = { x: 1800, y: 900, w: 400, h: 500 };
    const f = faceFocus(face, 4000, 3000, 1080, 1080, 0.4, 0.46);
    const crop = coverRect(4000, 3000, 1080, 1080, f.focusX, f.focusY, f.zoom);
    expect(face.h / crop.h).toBeCloseTo(0.4, 2);
    // face center lands at ~46% from the top and centered horizontally
    expect((face.y + face.h / 2 - crop.y) / crop.h).toBeCloseTo(0.46, 2);
    expect((face.x + face.w / 2 - crop.x) / crop.w).toBeCloseTo(0.5, 2);
  });

  it("never zooms out past the full photo", () => {
    expect(faceFocus({ x: 0, y: 0, w: 2000, h: 2900 }, 2000, 3000, 1080, 1080).zoom).toBe(1);
  });
});

describe("toSource", () => {
  it("inverts the crop mapping", () => {
    const r = coverRect(4000, 3000, 1080, 1080, 0.3, 0.5, 1.5);
    const p = toSource(540, 540, "crop", 4000, 3000, 1080, 1080, 0.3, 0.5, 1.5);
    expect(p.x).toBeCloseTo(r.x + r.w / 2);
    expect(p.y).toBeCloseTo(r.y + r.h / 2);
  });

  it("inverts the fit mapping", () => {
    expect(toSource(800, 450, "fit", 1000, 1000, 1600, 900, 0.5, 0.5, 1)).toEqual({ x: 500, y: 500 });
  });
});

describe("fitRect", () => {
  it("matches contain when centered at full size", () => {
    expect(fitRect(1000, 1000, 1600, 900)).toEqual(containRect(1000, 1000, 1600, 900));
  });
  it("places a shrunken photo by focus", () => {
    // 1600x900 landscape into a 1000x1000 square at 50%: 500x281.25, pushed to the bottom-right
    const r = fitRect(1600, 900, 1000, 1000, 1, 1, 0.5);
    expect(r.w).toBeCloseTo(500);
    expect(r.h).toBeCloseTo(281.25);
    expect(r.x).toBeCloseTo(500);
    expect(r.y).toBeCloseTo(718.75);
  });
});

describe("panFit", () => {
  it("follows the pointer and clamps to the frame", () => {
    const fit = fitRect(1600, 900, 1000, 1000); // full width, 437.5px of vertical slack
    const moved = panFit(fit, 1000, 1000, 0.5, 0.5, 300, 100);
    expect(moved.focusX).toBe(0.5); // no horizontal room
    expect(moved.focusY).toBeCloseTo(0.5 + 100 / 437.5);
    expect(panFit(fit, 1000, 1000, 0.5, 0.5, 0, 5000).focusY).toBe(1);
  });
  it("maps output points back through a moved fit", () => {
    const p = toSource(500, 1000 - 1, "fit", 1600, 900, 1000, 1000, 0.5, 1, 1);
    expect(p.y).toBeCloseTo(900 - 900 / 562.5, 1);
  });
});
