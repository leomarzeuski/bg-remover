interface Props {
  className?: string;
}

/**
 * Marca do bg-remover: uma silhueta (assunto) em gradiente sobre o xadrez de
 * transparência — o símbolo de "fundo removido". O xadrez usa tokens de tema
 * (`--logo-bg` / `--logo-checker`), então se adapta a claro/escuro.
 */
export function Logo({ className }: Props) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <pattern
          id="logoChk"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <rect width="16" height="16" style={{ fill: 'var(--logo-bg)' }} />
          <rect width="8" height="8" style={{ fill: 'var(--logo-checker)' }} />
          <rect
            x="8"
            y="8"
            width="8"
            height="8"
            style={{ fill: 'var(--logo-checker)' }}
          />
        </pattern>
        <clipPath id="logoClip">
          <rect x="2" y="2" width="60" height="60" rx="17" />
        </clipPath>
      </defs>
      <g clipPath="url(#logoClip)">
        <rect x="2" y="2" width="60" height="60" fill="url(#logoChk)" />
        <circle cx="32" cy="27" r="8.5" fill="url(#logoGrad)" />
        <path d="M14 56 c0-11 8-17 18-17 s18 6 18 17 z" fill="url(#logoGrad)" />
      </g>
      <path
        d="M47 14 l1.8 4.4 4.4 1.8 -4.4 1.8 -1.8 4.4 -1.8 -4.4 -4.4 -1.8 4.4 -1.8 z"
        fill="#ffffff"
        stroke="#6366f1"
        strokeWidth="0.5"
      />
      <rect
        x="2.5"
        y="2.5"
        width="59"
        height="59"
        rx="16.5"
        fill="none"
        style={{ stroke: 'var(--border)' }}
      />
    </svg>
  );
}
