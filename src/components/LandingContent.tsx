import { useLocale } from '../i18n/locale';
import type { StringKey } from '../i18n/strings';

const REPO_URL = 'https://github.com/leomarzeuski/bg-remover';

const STEPS: { title: StringKey; text: StringKey }[] = [
  { title: 'how1Title', text: 'how1Text' },
  { title: 'how2Title', text: 'how2Text' },
  { title: 'how3Title', text: 'how3Text' },
];

const FAQS: { q: StringKey; a: StringKey }[] = [
  { q: 'faq1q', a: 'faq1a' },
  { q: 'faq2q', a: 'faq2a' },
  { q: 'faq3q', a: 'faq3a' },
  { q: 'faq4q', a: 'faq4a' },
  { q: 'faq5q', a: 'faq5a' },
  { q: 'faq6q', a: 'faq6a' },
];

export function LandingContent() {
  const { t } = useLocale();
  return (
    <div className="mt-16 space-y-12 border-t border-border pt-10">
      <section>
        <h2 className="mb-4 text-lg font-semibold">{t('howTitle')}</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-surface-2 p-4">
              <p className="mb-1 font-medium">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-sm text-accent-foreground">
                  {i + 1}
                </span>
                {t(step.title)}
              </p>
              <p className="text-sm text-muted">{t(step.text)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('privacyTitle')}</h2>
        <p className="max-w-2xl text-sm text-muted">
          {t('privacyText')}{' '}
          <a href={REPO_URL} className="underline hover:text-foreground">
            {t('privacyLink')}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t('faqTitle')}</h2>
        <div className="space-y-2">
          {FAQS.map((faq) => (
            <details key={faq.q} className="rounded-2xl border border-border bg-surface-2 p-4">
              <summary className="cursor-pointer font-medium">{t(faq.q)}</summary>
              <p className="mt-2 text-sm text-muted">{t(faq.a)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
