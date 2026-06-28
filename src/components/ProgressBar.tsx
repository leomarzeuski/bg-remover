interface Props {
  value: number; // 0..1
  label?: string;
}

export function ProgressBar({ value, label }: Props) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div>
      {label && <p className="mb-2 text-sm text-gray-600">{label}</p>}
      <div className="h-3 w-full overflow-hidden rounded bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
