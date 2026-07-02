import { createContext, useContext, type ReactNode } from 'react';
import { strings, type Locale, type StringKey } from './strings';

export function detectLocale(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pt';
}

const LocaleContext = createContext<Locale>('pt');

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const locale = useContext(LocaleContext);
  const t = (key: StringKey) => strings[locale][key];
  return { locale, t };
}
