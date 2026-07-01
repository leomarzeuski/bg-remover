import { useTheme, type Theme } from '../hooks/useTheme';
import { useLocale } from '../i18n/locale';
import type { StringKey } from '../i18n/strings';

const OPTIONS: { value: Theme; key: StringKey; icon: string }[] = [
  { value: 'light', key: 'themeLight', icon: '☀️' },
  { value: 'dark', key: 'themeDark', icon: '🌙' },
  { value: 'system', key: 'themeSystem', icon: '🖥️' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  return (
    <div
      role="group"
      aria-label={t('themeGroup')}
      className="inline-flex items-center gap-0.5 rounded-lg border border-border p-0.5"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setTheme(opt.value)}
          aria-label={t(opt.key)}
          aria-pressed={theme === opt.value}
          className={`rounded-md px-2 py-1 text-sm transition-colors ${
            theme === opt.value
              ? 'bg-accent text-accent-foreground'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <span aria-hidden>{opt.icon}</span>
        </button>
      ))}
    </div>
  );
}
