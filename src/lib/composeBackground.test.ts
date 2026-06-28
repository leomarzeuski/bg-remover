import { describe, it, expect, vi, afterEach } from 'vitest';
import { composeBackground } from './composeBackground';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('composeBackground', () => {
  it('devolve o blob original quando a cor é null (transparente)', async () => {
    const cutout = new Blob(['x'], { type: 'image/png' });
    const result = await composeBackground(cutout, null);
    expect(result).toBe(cutout);
  });

  it('preenche a cor escolhida atrás do recorte e exporta PNG', async () => {
    const cutout = new Blob(['x'], { type: 'image/png' });
    const outBlob = new Blob(['y'], { type: 'image/png' });

    const ctx = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(outBlob)),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(
      canvas as unknown as HTMLCanvasElement,
    );
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 10, height: 20, close: vi.fn() })),
    );

    const result = await composeBackground(cutout, '#ff0000');

    expect(canvas.width).toBe(10);
    expect(canvas.height).toBe(20);
    expect(ctx.fillStyle).toBe('#ff0000');
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 10, 20);
    expect(ctx.drawImage).toHaveBeenCalled();
    expect(result).toBe(outBlob);
  });
});
