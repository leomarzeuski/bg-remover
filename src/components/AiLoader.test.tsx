import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AiLoader } from './AiLoader';

describe('AiLoader', () => {
  it('expõe progressbar com a porcentagem arredondada', () => {
    render(<AiLoader progress={0.42} label="Removendo o fundo…" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveTextContent('42%');
  });

  it('mostra o label', () => {
    render(<AiLoader progress={0} label="Baixando modelo de IA…" />);
    expect(screen.getByText('Baixando modelo de IA…')).toBeInTheDocument();
  });
});
