export function extractAlpha(rgba: Uint8ClampedArray): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(rgba.length / 4);
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = rgba[i * 4 + 3];
  }
  return alpha;
}

export function paintCircle(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  value: number,
): void {
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(width - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(height - 1, Math.ceil(cy + radius));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        alpha[y * width + x] = value;
      }
    }
  }
}

export function paintStroke(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  value: number,
): void {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / Math.max(1, radius / 2)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    paintCircle(
      alpha,
      width,
      height,
      x0 + (x1 - x0) * t,
      y0 + (y1 - y0) * t,
      radius,
      value,
    );
  }
}

export function composite(
  rgba: Uint8ClampedArray,
  alpha: Uint8ClampedArray,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length);
  for (let i = 0; i < alpha.length; i++) {
    out[i * 4] = rgba[i * 4];
    out[i * 4 + 1] = rgba[i * 4 + 1];
    out[i * 4 + 2] = rgba[i * 4 + 2];
    out[i * 4 + 3] = alpha[i];
  }
  return out;
}
