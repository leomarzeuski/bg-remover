import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangHint } from './LangHint';
import { LocaleProvider } from '../i18n/locale';

function mockLanguage(value: string) {
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(value);
}

describe('LangHint', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('na página pt com navegador en, sugere a versão em inglês', () => {
    mockLanguage('en-US');
    render(<LangHint />);
    const link = screen.getByRole('link', { name: /available in english/i });
    expect(link).toHaveAttribute('href', '/en/');
  });

  it('na página pt com navegador pt, não mostra nada', () => {
    mockLanguage('pt-BR');
    const { container } = render(<LangHint />);
    expect(container).toBeEmptyDOMElement();
  });

  it('na página en com navegador pt, sugere a versão em português', () => {
    mockLanguage('pt-BR');
    render(
      <LocaleProvider locale="en">
        <LangHint />
      </LocaleProvider>,
    );
    expect(
      screen.getByRole('link', { name: /existe em português/i }),
    ).toHaveAttribute('href', '/');
  });

  it('dispensar persiste e esconde', () => {
    mockLanguage('en-US');
    render(<LangHint />);
    fireEvent.click(screen.getByRole('button'));
    expect(localStorage.getItem('langHintDismissed')).toBe('1');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
