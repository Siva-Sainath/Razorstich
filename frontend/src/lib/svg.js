// Shared SVG helpers for custom charts (no chart libraries).

/** Catmull-Rom → cubic bezier smooth path through points [{x, y}] */
export const smoothPath = (pts) => {
  if (!pts || pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
};

/** Map {t, p} domain points into pixel space */
export const projectPoints = (points, { padL, padR, padT, padB, width, height }) => {
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  return points.map((pt) => ({
    x: padL + pt.t * plotW,
    y: padT + (1 - pt.p) * plotH,
  }));
};
