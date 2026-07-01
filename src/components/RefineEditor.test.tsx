import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RefineEditor } from './RefineEditor';

function makeBlob() {
  return new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
}

describe('RefineEditor', () => {
  it('renderiza os controles do pincel', () => {
    render(
      <RefineEditor
        originalUrl="blob:x"
        cutoutBlob={makeBlob()}
        bgColor={null}
        onApply={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Restaurar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apagar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument();
    expect(
      screen.getByRole('slider', { name: 'Tamanho do pincel' }),
    ).toBeInTheDocument();
  });

  it('chama onCancel ao clicar em Cancelar', async () => {
    const onCancel = vi.fn();
    render(
      <RefineEditor
        originalUrl="blob:x"
        cutoutBlob={makeBlob()}
        bgColor={null}
        onApply={() => {}}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
