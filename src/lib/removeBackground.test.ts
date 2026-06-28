import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeBackground } from './removeBackground';
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

vi.mock('@imgly/background-removal', () => ({
  removeBackground: vi.fn(),
}));

describe('removeBackground', () => {
  beforeEach(() => {
    vi.mocked(imglyRemoveBackground).mockReset();
  });

  it('chama a lib com o arquivo e devolve o blob', async () => {
    const blob = new Blob(['cut'], { type: 'image/png' });
    vi.mocked(imglyRemoveBackground).mockResolvedValue(blob);

    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const result = await removeBackground(file);

    expect(imglyRemoveBackground).toHaveBeenCalledWith(file, expect.any(Object));
    expect(result).toBe(blob);
  });

  it('normaliza o progresso para 0..1', async () => {
    const blob = new Blob(['cut'], { type: 'image/png' });
    vi.mocked(imglyRemoveBackground).mockImplementation(
      async (_img: unknown, config?: { progress?: (k: string, c: number, t: number) => void }) => {
        config?.progress?.('fetch:model', 50, 100);
        return blob;
      },
    );

    const onProgress = vi.fn();
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    await removeBackground(file, onProgress);

    expect(onProgress).toHaveBeenCalledWith(0.5);
  });

  it('propaga erros da lib', async () => {
    vi.mocked(imglyRemoveBackground).mockRejectedValue(new Error('boom'));
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    await expect(removeBackground(file)).rejects.toThrow('boom');
  });
});
