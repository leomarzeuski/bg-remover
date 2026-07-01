import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('ThemeToggle', () => {
  it('renderiza as três opções de tema', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Tema claro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tema escuro' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Tema do sistema' }),
    ).toBeInTheDocument();
  });

  it('aplica o tema escuro ao clicar na opção escura', async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: 'Tema escuro' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
