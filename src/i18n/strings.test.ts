import { describe, it, expect } from 'vitest';
import { strings } from './strings';

describe('strings', () => {
  it('pt e en têm exatamente as mesmas chaves', () => {
    expect(Object.keys(strings.en).sort()).toEqual(Object.keys(strings.pt).sort());
  });

  it('nenhuma string é vazia', () => {
    for (const locale of ['pt', 'en'] as const) {
      for (const [key, value] of Object.entries(strings[locale])) {
        expect(value, `${locale}.${key}`).not.toBe('');
      }
    }
  });
});
