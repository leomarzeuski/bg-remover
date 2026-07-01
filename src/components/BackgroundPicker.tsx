import { useLocale } from '../i18n/locale';
import type { StringKey } from '../i18n/strings';

interface Props {
  value: string | null;
  onChange: (color: string | null) => void;
}

const PRESETS: { key: StringKey; color: string | null }[] = [
  { key: 'bgTransparent', color: null },
  { key: 'bgWhite', color: '#ffffff' },
  { key: 'bgBlack', color: '#000000' },
];

export function BackgroundPicker({ value, onChange }: Props) {
  const { t } = useLocale();
  const isCustom = value !== null && value !== '#ffffff' && value !== '#000000';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">{t('bgLabel')}</span>
      {PRESETS.map((preset) => (
        <button
          key={preset.key}
          onClick={() => onChange(preset.color)}
          className={`rounded-lg border px-3 py-1 text-sm transition-colors ${
            value === preset.color
              ? 'border-accent ring-2 ring-accent/30'
              : 'border-border'
          }`}
        >
          {t(preset.key)}
        </button>
      ))}
      <label className="flex items-center gap-1 text-sm text-muted">
        {t('bgCustom')}
        <input
          type="color"
          value={isCustom ? (value as string) : '#3b82f6'}
          onChange={(e) => onChange(e.target.value)}
          aria-label={t('bgCustomAria')}
          className="h-7 w-9 cursor-pointer rounded border border-border"
        />
      </label>
    </div>
  );
}
