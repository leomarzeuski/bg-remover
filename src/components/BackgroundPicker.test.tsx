import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackgroundPicker } from './BackgroundPicker';

describe('BackgroundPicker', () => {
  it('chama onChange com null ao clicar em Transparente', () => {
    const onChange = vi.fn();
    render(<BackgroundPicker value="#000000" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /transparente/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('chama onChange com preto ao clicar em Preto', () => {
    const onChange = vi.fn();
    render(<BackgroundPicker value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /preto/i }));
    expect(onChange).toHaveBeenCalledWith('#000000');
  });
});
