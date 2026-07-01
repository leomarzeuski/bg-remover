import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingContent } from './LandingContent';
import { LocaleProvider } from '../i18n/locale';

describe('LandingContent', () => {
  it('renderiza seções e 6 FAQs em pt', () => {
    render(<LandingContent />);
    expect(screen.getByRole('heading', { name: 'Como funciona' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Privacidade de verdade' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Perguntas frequentes' })).toBeInTheDocument();
    expect(screen.getAllByRole('group')).toHaveLength(6); // <details> tem role group
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/leomarzeuski/bg-remover',
    );
  });

  it('renderiza em inglês', () => {
    render(
      <LocaleProvider locale="en">
        <LandingContent />
      </LocaleProvider>,
    );
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByText('Is SemFundo really free?')).toBeInTheDocument();
  });
});
