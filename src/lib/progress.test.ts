import { describe, it, expect } from 'vitest';
import { createProgressTracker } from './progress';

describe('createProgressTracker', () => {
  it('mapeia o download para no máximo 70% (sem falso 100%)', () => {
    const t = createProgressTracker();
    const a = t('fetch:/model', 50, 100);
    expect(a.phase).toBe('download');
    expect(a.progress).toBeCloseTo(0.35); // 0.5 * 0.7
    const b = t('fetch:/model', 100, 100); // arquivo completo
    expect(b.progress).toBeCloseTo(0.7); // teto do download, não 1.0
  });

  it('é monotônico mesmo quando a fração do arquivo reseta', () => {
    const t = createProgressTracker();
    const seq = [
      t('fetch:/a', 100, 100).progress, // a completo
      t('fetch:/b', 20, 200).progress, // b começa (fração reseta no imgly)
      t('fetch:/b', 200, 200).progress, // b completo
    ];
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i]).toBeGreaterThanOrEqual(seq[i - 1] - 1e-9);
    }
    expect(Math.max(...seq)).toBeLessThanOrEqual(0.7 + 1e-9);
  });

  it('compute após download vai de 70% até 100%', () => {
    const t = createProgressTracker();
    t('fetch:/model', 100, 100); // download completo -> 0.7
    expect(t('compute:decode', 0, 4).progress).toBeCloseTo(0.7);
    expect(t('compute:inference', 1, 4).progress).toBeCloseTo(0.775);
    expect(t('compute:mask', 2, 4).progress).toBeCloseTo(0.85);
    expect(t('compute:encode', 3, 4).progress).toBeCloseTo(0.925);
    const end = t('compute:encode', 4, 4);
    expect(end.progress).toBeCloseTo(1);
    expect(end.phase).toBe('compute');
  });

  it('sem download (cache), o compute mapeia de 0% a 100%', () => {
    const t = createProgressTracker();
    expect(t('compute:decode', 0, 4).progress).toBeCloseTo(0);
    expect(t('compute:inference', 1, 4).progress).toBeCloseTo(0.25);
    expect(t('compute:encode', 4, 4).progress).toBeCloseTo(1);
  });
});
