import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { detectLocale, LocaleProvider, useLocale } from './locale';

function Probe() {
  const { locale, t } = useLocale();
  return <p>{locale}:{t('downloadPng')}</p>;
}

describe('detectLocale', () => {
  it('/ é pt', () => expect(detectLocale('/')).toBe('pt'));
  it('/en e /en/ são en', () => {
    expect(detectLocale('/en')).toBe('en');
    expect(detectLocale('/en/')).toBe('en');
    expect(detectLocale('/en/index.html')).toBe('en');
  });
  it('/ennn não é en', () => expect(detectLocale('/ennn')).toBe('pt'));
});

describe('useLocale', () => {
  it('default sem provider é pt', () => {
    render(<Probe />);
    expect(screen.getByText('pt:Baixar PNG')).toBeInTheDocument();
  });
  it('provider en traduz', () => {
    render(<LocaleProvider locale="en"><Probe /></LocaleProvider>);
    expect(screen.getByText('en:Download PNG')).toBeInTheDocument();
  });
});
