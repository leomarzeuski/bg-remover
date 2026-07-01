import { useState } from 'react';
import { useLocale } from '../i18n/locale';

const DISMISS_KEY = 'langHintDismissed';

/**
 * Sugestão cruzada de idioma: o texto é sempre no idioma da página de destino
 * (por isso não passa pelo t() da página atual). Sem redirect automático.
 */
export function LangHint() {
  const { locale } = useLocale();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  );
  const browserIsPt = navigator.language.toLowerCase().startsWith('pt');
  const show = !dismissed && (locale === 'pt' ? !browserIsPt : browserIsPt);
  if (!show) return null;

  const href = locale === 'pt' ? '/en/' : '/';
  const text =
    locale === 'pt'
      ? 'This page is also available in English'
      : 'Esta página também existe em português';
  const dismissLabel = locale === 'pt' ? 'Dismiss' : 'Dispensar';

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
      <a href={href} className="underline hover:text-foreground">
        {text} →
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label={dismissLabel}
        className="text-muted hover:text-foreground"
      >
        ×
      </button>
    </div>
  );
}
