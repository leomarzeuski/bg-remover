interface Props {
  progress: number; // 0..1
  label: string;
}

const R = 52;
const CIRC = 2 * Math.PI * R;

export function AiLoader({ progress, label }: Props) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const pct = Math.round(clamped * 100);
  const dashoffset = CIRC * (1 - clamped);
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="relative h-32 w-32">
        <div
          className="ai-pulse absolute inset-4 rounded-full blur-md"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, var(--accent-2), var(--accent))',
          }}
          aria-hidden
        />
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-foreground"
        >
          {pct}%
        </div>
      </div>
      <p className="max-w-xs text-center text-sm text-muted">{label}</p>
    </div>
  );
}
