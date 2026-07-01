interface Props {
  value: string | null;
  onChange: (color: string | null) => void;
}

const PRESETS: { label: string; color: string | null }[] = [
  { label: 'Transparente', color: null },
  { label: 'Branco', color: '#ffffff' },
  { label: 'Preto', color: '#000000' },
];

export function BackgroundPicker({ value, onChange }: Props) {
  const isCustom = value !== null && value !== '#ffffff' && value !== '#000000';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">Fundo:</span>
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => onChange(preset.color)}
          className={`rounded-lg border px-3 py-1 text-sm transition-colors ${
            value === preset.color
              ? 'border-accent ring-2 ring-accent/30'
              : 'border-border'
          }`}
        >
          {preset.label}
        </button>
      ))}
      <label className="flex items-center gap-1 text-sm text-muted">
        Cor:
        <input
          type="color"
          value={isCustom ? (value as string) : '#3b82f6'}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Cor personalizada"
          className="h-7 w-9 cursor-pointer rounded border border-border"
        />
      </label>
    </div>
  );
}
