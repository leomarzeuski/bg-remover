import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageDropzone } from './ImageDropzone';

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
});
