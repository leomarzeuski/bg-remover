import { describe, expect, it } from 'vitest';
import { composite, extractAlpha, paintCircle, paintStroke } from './refine';

describe('extractAlpha', () => {
  it('copia o canal alpha', () => {
    const rgba = new Uint8ClampedArray([10, 20, 30, 40, 50, 60, 70, 80]);
    expect(Array.from(extractAlpha(rgba))).toEqual([40, 80]);
  });
});

describe('paintCircle', () => {
  it('altera só os pixels dentro do raio', () => {
    const w = 5;
    const h = 5;
    const alpha = new Uint8ClampedArray(w * h); // tudo 0
    paintCircle(alpha, w, h, 2, 2, 1, 255);
    expect(alpha[2 * w + 2]).toBe(255); // centro
    expect(alpha[2 * w + 1]).toBe(255); // esquerda
    expect(alpha[1 * w + 2]).toBe(255); // cima
    expect(alpha[0]).toBe(0); // canto: intocado
  });

  it('aplica o valor informado (apagar)', () => {
    const w = 3;
    const h = 3;
    const alpha = new Uint8ClampedArray(w * h).fill(255);
    paintCircle(alpha, w, h, 1, 1, 1, 0);
    expect(alpha[1 * w + 1]).toBe(0);
    expect(alpha[0]).toBe(255);
  });
});

describe('paintStroke', () => {
  it('cobre os pixels ao longo da linha', () => {
    const w = 10;
    const h = 3;
    const alpha = new Uint8ClampedArray(w * h);
    paintStroke(alpha, w, h, 1, 1, 8, 1, 1, 255);
    expect(alpha[1 * w + 1]).toBe(255); // início
    expect(alpha[1 * w + 4]).toBe(255); // meio
    expect(alpha[1 * w + 8]).toBe(255); // fim
  });
});

describe('composite', () => {
  it('mantém o RGB e aplica o alpha da máscara', () => {
    const rgba = new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]);
    const alpha = new Uint8ClampedArray([128, 0]);
    const out = composite(rgba, alpha);
    expect(Array.from(out)).toEqual([1, 2, 3, 128, 4, 5, 6, 0]);
  });
});
