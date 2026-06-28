import { describe, it, expect } from 'vitest';
import { validateImage } from './validateImage';

describe('validateImage', () => {
  it('aceita PNG, JPG e WebP', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      const file = new File(['conteudo'], 'img', { type });
      expect(validateImage(file)).toEqual({ ok: true });
    }
  });

  it('rejeita tipos não suportados com mensagem', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    const result = validateImage(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/não suportado/i);
    }
  });

  it('rejeita arquivo vazio', () => {
    const file = new File([], 'vazio.png', { type: 'image/png' });
    const result = validateImage(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/vazio/i);
    }
  });
});
