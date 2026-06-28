import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { removeBackground } from './lib/removeBackground';

vi.mock('./lib/removeBackground', () => ({
  removeBackground: vi.fn(async () => new Blob(['cut'], { type: 'image/png' })),
}));

beforeEach(() => {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake');
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe('App', () => {
  it('processa a imagem e mostra o botão de baixar', async () => {
    render(<App />);
    const input = screen.getByTestId('file-input');
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /baixar/i }),
      ).toBeInTheDocument();
    });
  });

  it('mostra o botão "Tentar de novo" quando removeBackground rejeita', async () => {
    vi.mocked(removeBackground).mockRejectedValueOnce(new Error('falhou'));
    render(<App />);
    const input = screen.getByTestId('file-input');
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /tentar de novo/i }),
      ).toBeInTheDocument();
    });
  });
});
