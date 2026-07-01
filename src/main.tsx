import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { detectLocale, LocaleProvider } from './i18n/locale';

const locale = detectLocale(window.location.pathname);
document.documentElement.lang = locale === 'en' ? 'en' : 'pt-BR';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider locale={locale}>
      <App />
    </LocaleProvider>
  </StrictMode>,
);
