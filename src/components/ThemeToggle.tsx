import { useTheme, type Theme } from '../hooks/useTheme';

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Tema claro', icon: '☀️' },
  { value: 'dark', label: 'Tema escuro', icon: '🌙' },
  { value: 'system', label: 'Tema do sistema', icon: '🖥️' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label="Tema"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border p-0.5"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setTheme(opt.value)}
          aria-label={opt.label}
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
