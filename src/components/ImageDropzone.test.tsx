import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageDropzone } from './ImageDropzone';

vi.mock('../lib/track', () => ({ track: vi.fn() }));

describe('ImageDropzone', () => {
  it('chama onImage com um PNG válido', () => {
    const onImage = vi.fn();
    render(<ImageDropzone onImage={onImage} />);
    const input = screen.getByTestId('file-input');
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onImage).toHaveBeenCalledWith(file);
  });

  it('mostra erro e não chama onImage com tipo inválido', () => {
    const onImage = vi.fn();
    render(<ImageDropzone onImage={onImage} />);
    const input = screen.getByTestId('file-input');
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onImage).not.toHaveBeenCalled();
    expect(screen.getByText(/não suportado/i)).toBeInTheDocument();
  });

  it('chama onImage quando um arquivo é solto na zona de drop', () => {
    const onImage = vi.fn();
    render(<ImageDropzone onImage={onImage} />);
    const dropzone = screen.getByRole('button', { name: /enviar imagem/i });
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(onImage).toHaveBeenCalledWith(file);
  });

  it('botão de exemplo busca /exemplo.jpg e chama onImage', async () => {
    const onImage = vi.fn();
    const blob = new Blob(['fake-jpg'], { type: 'image/jpeg' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(blob, { status: 200 })),
    );
    render(<ImageDropzone onImage={onImage} />);
    fireEvent.click(screen.getByRole('button', { name: /imagem de exemplo/i }));
    await waitFor(() => expect(onImage).toHaveBeenCalled());
    const file = onImage.mock.calls[0][0] as File;
    expect(file.name).toBe('exemplo.jpg');
    expect(file.type).toBe('image/jpeg');
    vi.unstubAllGlobals();
  });
});
