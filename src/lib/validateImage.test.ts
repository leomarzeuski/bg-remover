import { describe, it, expect } from 'vitest';
import { validateImage } from './validateImage';

describe('validateImage', () => {
  it('aceita PNG, JPG e WebP', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      const file = new File(['conteudo'], 'img', { type });
      expect(validateImage(file)).toEqual({ ok: true });
    }
  });

  it('rejeita tipos não suportados com código', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateImage(file)).toEqual({ ok: false, code: 'unsupported-type' });
  });

  it('rejeita arquivo vazio com código', () => {
    const file = new File([], 'vazio.png', { type: 'image/png' });
    expect(validateImage(file)).toEqual({ ok: false, code: 'empty-file' });
  });
});
