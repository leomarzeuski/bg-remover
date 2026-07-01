# Refino com pincel, tema claro/escuro, nova UI e spinner de IA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um editor de refino por pincel (restaurar/apagar) sobre o recorte automático, além de tema claro/escuro, nova interface e um spinner de IA, mantendo tudo 100% no navegador.

**Architecture:** O refino trabalha sobre uma máscara de alpha (`Uint8ClampedArray`) aplicada à imagem original; a lógica de pixels fica em funções puras testáveis (`lib/refine.ts`) e o `RefineEditor` faz o wiring de canvas/ponteiro. O tema usa tokens semânticos em CSS variables mapeados no `@theme inline` do Tailwind v4, com a classe `.dark` controlada por `useTheme`. O `AiLoader` substitui a barra de progresso crua.

**Tech Stack:** Vite + React 19 + TypeScript (strict) + Tailwind CSS 4 + Vitest + Testing Library. Biblioteca de IA: `@imgly/background-removal` (já instalada).

## Global Constraints

- 100% client-side: nenhuma chamada de rede/backend; a imagem nunca sai do navegador.
- **Nenhuma dependência nova** (nem de runtime nem de dev).
- Ao fim de cada tarefa: `npm test` passa e `npm run build` (`tsc --noEmit && vite build`) compila sem erros.
- TypeScript strict; sem `any` desnecessário.
- Textos em pt-BR.
- **Rótulos estáveis** (não quebrar testes existentes): botão "Baixar PNG", "Tentar de novo", "Nova imagem"; aria-label "Enviar imagem"; presets "Transparente"/"Branco"/"Preto"; `data-testid="file-input"`; mensagem de erro de upload contém "não suportado".
- Editor: resolução de trabalho ≤ **2048px** no maior lado; PNG final exportado na **resolução cheia**.
- Cores sempre via tokens (`bg-surface`, `text-foreground`, `border-border`, `bg-accent`, `text-accent-foreground`, `text-muted`, `bg-surface-2`, `from-accent-2`, `to-accent`) — nunca cores fixas tipo `text-gray-500`.

---

### Task 1: Fundação do tema (tokens CSS + anti-flash)

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: nada.
- Produces: classes utilitárias de tokens (`bg-surface`, `text-foreground`, `border-border`, `bg-accent`, `text-accent-foreground`, `text-muted`, `bg-surface-2`, `from-accent-2`, `to-accent`); a variante `dark` via classe `.dark` no `<html>`; a classe `.ai-pulse`; `.checkerboard` por tema. Script anti-flash lê `localStorage['theme']`.

- [ ] **Step 1: Substituir `src/index.css` pelo conteúdo com tokens**

Não há teste unitário para CSS; a verificação é build + suíte existente + checagem manual.

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --surface: #ffffff;
  --surface-2: #f6f7f9;
  --foreground: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --accent: #6366f1;
  --accent-2: #8b5cf6;
  --accent-foreground: #ffffff;
  --checker-a: #e5e7eb;
  --checker-b: #ffffff;
}

.dark {
  --surface: #0b0f19;
  --surface-2: #131a2a;
  --foreground: #e5e7eb;
  --muted: #94a3b8;
  --border: #24304a;
  --accent: #818cf8;
  --accent-2: #a78bfa;
  --accent-foreground: #0b0f19;
  --checker-a: #1e293b;
  --checker-b: #0f172a;
}

@theme inline {
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-2: var(--accent-2);
  --color-accent-foreground: var(--accent-foreground);
}

body {
  background-color: var(--surface);
  color: var(--foreground);
}

.checkerboard {
  background-image:
    linear-gradient(45deg, var(--checker-a) 25%, transparent 25%),
    linear-gradient(-45deg, var(--checker-a) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--checker-a) 75%),
    linear-gradient(-45deg, transparent 75%, var(--checker-a) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
  background-color: var(--checker-b);
}

@keyframes ai-pulse {
  0%, 100% { opacity: 0.55; transform: scale(0.94); }
  50% { opacity: 1; transform: scale(1.06); }
}
.ai-pulse { animation: ai-pulse 1.8s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .ai-pulse { animation: none; }
}
```

- [ ] **Step 2: Adicionar o script anti-flash no `index.html`**

Substituir o `<head>` atual por este (mantém charset/viewport/title e adiciona o script antes do body):

```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>bg-remover</title>
    <script>
      (function () {
        try {
          var t = localStorage.getItem('theme');
          var dark =
            t === 'dark' ||
            ((!t || t === 'system') &&
              window.matchMedia('(prefers-color-scheme: dark)').matches);
          if (dark) document.documentElement.classList.add('dark');
        } catch (e) {}
      })();
    </script>
  </head>
```

- [ ] **Step 3: Verificar build e suíte existente**

Run: `npm run build && npm test`
Expected: build compila; todos os testes existentes continuam passando (nenhuma asserção depende de cores fixas).

- [ ] **Step 4: Commit**

```bash
git add src/index.css index.html
git commit -m "feat: tokens de tema claro/escuro e script anti-flash"
```

---

### Task 2: Hook `useTheme` (+ mock de matchMedia no setup)

**Files:**
- Create: `src/hooks/useTheme.ts`
- Test: `src/hooks/useTheme.test.ts`
- Modify: `src/test/setup.ts`

**Interfaces:**
- Consumes: classe `.dark` (Task 1).
- Produces: `type Theme = 'light' | 'dark' | 'system'` e `useTheme(): { theme: Theme; setTheme: (t: Theme) => void; resolved: 'light' | 'dark' }`. Chave de storage: `'theme'`.

- [ ] **Step 1: Adicionar mock default de `matchMedia` ao `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
```

- [ ] **Step 2: Escrever o teste que falha (`src/hooks/useTheme.test.ts`)**

```ts
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from './useTheme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('useTheme', () => {
  it('usa "system" por padrão (resolvido como light no mock)', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('system');
    expect(result.current.resolved).toBe('light');
  });

  it('setTheme("dark") aplica .dark e persiste', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(result.current.resolved).toBe('dark');
  });

  it('setTheme("light") remove .dark', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('dark'));
    act(() => result.current.setTheme('light'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(result.current.resolved).toBe('light');
  });

  it('reage à mudança do sistema quando o tema é "system"', () => {
    let listener: ((e: { matches: boolean }) => void) | null = null;
    let matches = false;
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches,
      media: q,
      onchange: null,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        listener = cb;
      },
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useTheme());
    expect(result.current.resolved).toBe('light');
    act(() => {
      matches = true;
      listener?.({ matches: true });
    });
    expect(result.current.resolved).toBe('dark');
  });
});
```

- [ ] **Step 3: Rodar o teste e ver falhar**

Run: `npx vitest run src/hooks/useTheme.test.ts`
Expected: FAIL — `Failed to resolve import './useTheme'`.

- [ ] **Step 4: Implementar `src/hooks/useTheme.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function applyTheme(theme: Theme): 'light' | 'dark' {
  const resolved =
    theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  return resolved;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    applyTheme(readStoredTheme()),
  );

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    setResolved(applyTheme(next));
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolved(applyTheme('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return { theme, setTheme, resolved };
}
```

- [ ] **Step 5: Rodar o teste e ver passar**

Run: `npx vitest run src/hooks/useTheme.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useTheme.ts src/hooks/useTheme.test.ts src/test/setup.ts
git commit -m "feat: hook useTheme (claro/escuro/sistema) + mock de matchMedia"
```

---

### Task 3: Componente `ThemeToggle`

**Files:**
- Create: `src/components/ThemeToggle.tsx`
- Test: `src/components/ThemeToggle.test.tsx`

**Interfaces:**
- Consumes: `useTheme` (Task 2).
- Produces: `ThemeToggle` (sem props). Botões com `aria-label` "Tema claro" / "Tema escuro" / "Tema do sistema".

- [ ] **Step 1: Escrever o teste que falha (`src/components/ThemeToggle.test.tsx`)**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('ThemeToggle', () => {
  it('renderiza as três opções de tema', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Tema claro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tema escuro' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Tema do sistema' }),
    ).toBeInTheDocument();
  });

  it('aplica o tema escuro ao clicar na opção escura', async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: 'Tema escuro' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/components/ThemeToggle.test.tsx`
Expected: FAIL — `Failed to resolve import './ThemeToggle'`.

- [ ] **Step 3: Implementar `src/components/ThemeToggle.tsx`**

```tsx
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
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/components/ThemeToggle.test.tsx`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/components/ThemeToggle.tsx src/components/ThemeToggle.test.tsx
git commit -m "feat: componente ThemeToggle"
```

---

### Task 4: `removeBackground` repassa o "stage" do progresso

**Files:**
- Modify: `src/lib/removeBackground.ts`
- Test: `src/lib/removeBackground.test.ts`

**Interfaces:**
- Consumes: `@imgly/background-removal`.
- Produces: `type ProgressCallback = (progress: number, stage?: string) => void;` e `removeBackground(file: File, onProgress?: ProgressCallback): Promise<Blob>`.

- [ ] **Step 1: Atualizar o teste `src/lib/removeBackground.test.ts`**

Trocar apenas a asserção do teste "normaliza o progresso" para incluir o `stage`:

```ts
    expect(onProgress).toHaveBeenCalledWith(0.5, 'fetch:model');
```

(As demais asserções do arquivo permanecem iguais.)

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/lib/removeBackground.test.ts`
Expected: FAIL — recebido `(0.5)` mas esperado `(0.5, 'fetch:model')`.

- [ ] **Step 3: Implementar `src/lib/removeBackground.ts`**

```ts
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

export type ProgressCallback = (progress: number, stage?: string) => void;

export async function removeBackground(
  file: File,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  return imglyRemoveBackground(file, {
    progress: (key, current, total) => {
      if (onProgress && total > 0) {
        onProgress(current / total, key);
      }
    },
  });
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/lib/removeBackground.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/removeBackground.ts src/lib/removeBackground.test.ts
git commit -m "feat: removeBackground repassa o stage do progresso"
```

---

### Task 5: Componente `AiLoader` (spinner de IA)

**Files:**
- Create: `src/components/AiLoader.tsx`
- Test: `src/components/AiLoader.test.tsx`

**Interfaces:**
- Consumes: token `.ai-pulse` e cores (Task 1).
- Produces: `AiLoader({ progress: number, label: string })`. Expõe `role="progressbar"` com `aria-valuenow` (0..100 arredondado) e mostra o `%` e o `label`.

- [ ] **Step 1: Escrever o teste que falha (`src/components/AiLoader.test.tsx`)**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AiLoader } from './AiLoader';

describe('AiLoader', () => {
  it('expõe progressbar com a porcentagem arredondada', () => {
    render(<AiLoader progress={0.42} label="Removendo o fundo…" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveTextContent('42%');
  });

  it('mostra o label', () => {
    render(<AiLoader progress={0} label="Baixando modelo de IA…" />);
    expect(screen.getByText('Baixando modelo de IA…')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/components/AiLoader.test.tsx`
Expected: FAIL — `Failed to resolve import './AiLoader'`.

- [ ] **Step 3: Implementar `src/components/AiLoader.tsx`**

```tsx
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
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/components/AiLoader.test.tsx`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/components/AiLoader.tsx src/components/AiLoader.test.tsx
git commit -m "feat: componente AiLoader (spinner de IA com anel de progresso)"
```

---

### Task 6: Funções puras do refino (`lib/refine.ts`)

**Files:**
- Create: `src/lib/refine.ts`
- Test: `src/lib/refine.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `extractAlpha(rgba: Uint8ClampedArray): Uint8ClampedArray`
  - `paintCircle(alpha: Uint8ClampedArray, width: number, height: number, cx: number, cy: number, radius: number, value: number): void`
  - `paintStroke(alpha: Uint8ClampedArray, width: number, height: number, x0: number, y0: number, x1: number, y1: number, radius: number, value: number): void`
  - `composite(rgba: Uint8ClampedArray, alpha: Uint8ClampedArray): Uint8ClampedArray`

- [ ] **Step 1: Escrever os testes que falham (`src/lib/refine.test.ts`)**

```ts
import { describe, expect, it } from 'vitest';
import { composite, extractAlpha, paintCircle, paintStroke } from './refine';

describe('extractAlpha', () => {
  it('copia o canal alpha', () => {
    const rgba = new Uint8ClampedArray([10, 20, 30, 40, 50, 60, 70, 80]);
    expect(Array.from(extractAlpha(rgba))).toEqual([40, 80]);
  });
});

describe('paintCircle', () => {
  it('altera só os pixels dentro do raio', () => {
    const w = 5;
    const h = 5;
    const alpha = new Uint8ClampedArray(w * h); // tudo 0
    paintCircle(alpha, w, h, 2, 2, 1, 255);
    expect(alpha[2 * w + 2]).toBe(255); // centro
    expect(alpha[2 * w + 1]).toBe(255); // esquerda
    expect(alpha[1 * w + 2]).toBe(255); // cima
    expect(alpha[0]).toBe(0); // canto: intocado
  });

  it('aplica o valor informado (apagar)', () => {
    const w = 3;
    const h = 3;
    const alpha = new Uint8ClampedArray(w * h).fill(255);
    paintCircle(alpha, w, h, 1, 1, 1, 0);
    expect(alpha[1 * w + 1]).toBe(0);
    expect(alpha[0]).toBe(255);
  });
});

describe('paintStroke', () => {
  it('cobre os pixels ao longo da linha', () => {
    const w = 10;
    const h = 3;
    const alpha = new Uint8ClampedArray(w * h);
    paintStroke(alpha, w, h, 1, 1, 8, 1, 1, 255);
    expect(alpha[1 * w + 1]).toBe(255); // início
    expect(alpha[1 * w + 4]).toBe(255); // meio
    expect(alpha[1 * w + 8]).toBe(255); // fim
  });
});

describe('composite', () => {
  it('mantém o RGB e aplica o alpha da máscara', () => {
    const rgba = new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]);
    const alpha = new Uint8ClampedArray([128, 0]);
    const out = composite(rgba, alpha);
    expect(Array.from(out)).toEqual([1, 2, 3, 128, 4, 5, 6, 0]);
  });
});
```

- [ ] **Step 2: Rodar os testes e ver falhar**

Run: `npx vitest run src/lib/refine.test.ts`
Expected: FAIL — `Failed to resolve import './refine'`.

- [ ] **Step 3: Implementar `src/lib/refine.ts`**

```ts
export function extractAlpha(rgba: Uint8ClampedArray): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(rgba.length / 4);
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = rgba[i * 4 + 3];
  }
  return alpha;
}

export function paintCircle(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  value: number,
): void {
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(width - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(height - 1, Math.ceil(cy + radius));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        alpha[y * width + x] = value;
      }
    }
  }
}

export function paintStroke(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  value: number,
): void {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / Math.max(1, radius / 2)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    paintCircle(
      alpha,
      width,
      height,
      x0 + (x1 - x0) * t,
      y0 + (y1 - y0) * t,
      radius,
      value,
    );
  }
}

export function composite(
  rgba: Uint8ClampedArray,
  alpha: Uint8ClampedArray,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length);
  for (let i = 0; i < alpha.length; i++) {
    out[i * 4] = rgba[i * 4];
    out[i * 4 + 1] = rgba[i * 4 + 1];
    out[i * 4 + 2] = rgba[i * 4 + 2];
    out[i * 4 + 3] = alpha[i];
  }
  return out;
}
```

- [ ] **Step 4: Rodar os testes e ver passar**

Run: `npx vitest run src/lib/refine.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/refine.ts src/lib/refine.test.ts
git commit -m "feat: funções puras do refino (máscara de alpha)"
```

---

### Task 7: Componente `RefineEditor`

**Files:**
- Create: `src/components/RefineEditor.tsx`
- Test: `src/components/RefineEditor.test.tsx`

**Interfaces:**
- Consumes: `extractAlpha`, `paintStroke`, `composite` (Task 6); tokens/`.checkerboard` (Task 1).
- Produces: `RefineEditor({ originalUrl: string, cutoutBlob: Blob, bgColor: string | null, onApply: (blob: Blob) => void, onCancel: () => void })`. Botões: "Restaurar", "Apagar", "Desfazer", "Reverter para IA", "Aplicar", "Cancelar"; slider `aria-label="Tamanho do pincel"`.

**Nota de teste:** o canvas 2D não é implementado no jsdom e imagens não disparam `load`, então a carga fica pendente e os controles renderizam sem erro. O teste cobre a renderização dos controles e o wiring de "Cancelar". A correção de pixels já está coberta por `lib/refine` (Task 6).

- [ ] **Step 1: Escrever o teste que falha (`src/components/RefineEditor.test.tsx`)**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RefineEditor } from './RefineEditor';

function makeBlob() {
  return new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
}

describe('RefineEditor', () => {
  it('renderiza os controles do pincel', () => {
    render(
      <RefineEditor
        originalUrl="blob:x"
        cutoutBlob={makeBlob()}
        bgColor={null}
        onApply={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Restaurar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apagar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument();
    expect(
      screen.getByRole('slider', { name: 'Tamanho do pincel' }),
    ).toBeInTheDocument();
  });

  it('chama onCancel ao clicar em Cancelar', async () => {
    const onCancel = vi.fn();
    render(
      <RefineEditor
        originalUrl="blob:x"
        cutoutBlob={makeBlob()}
        bgColor={null}
        onApply={() => {}}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npx vitest run src/components/RefineEditor.test.tsx`
Expected: FAIL — `Failed to resolve import './RefineEditor'`.

- [ ] **Step 3: Implementar `src/components/RefineEditor.tsx`**

```tsx
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { composite, extractAlpha, paintStroke } from '../lib/refine';

interface Props {
  originalUrl: string;
  cutoutBlob: Blob;
  bgColor: string | null;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
}

type Mode = 'restore' | 'erase';
const MAX_WORK = 2048;
const UNDO_LIMIT = 12;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar a imagem.'));
    img.src = url;
  });
}

function toImageData(
  source: CanvasImageSource,
  w: number,
  h: number,
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D não disponível neste navegador.');
  ctx.drawImage(source, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function maskToCanvas(
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D não disponível neste navegador.');
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < alpha.length; i++) {
    img.data[i * 4] = 255;
    img.data[i * 4 + 1] = 255;
    img.data[i * 4 + 2] = 255;
    img.data[i * 4 + 3] = alpha[i];
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

async function exportMasked(
  originalUrl: string,
  alpha: Uint8ClampedArray,
  workW: number,
  workH: number,
): Promise<Blob> {
  const img = await loadImage(originalUrl);
  const fw = img.naturalWidth || img.width;
  const fh = img.naturalHeight || img.height;
  const originalData = toImageData(img, fw, fh);

  const maskC = maskToCanvas(alpha, workW, workH);
  const maskFull = document.createElement('canvas');
  maskFull.width = fw;
  maskFull.height = fh;
  const mctx = maskFull.getContext('2d');
  if (!mctx) throw new Error('Canvas 2D não disponível neste navegador.');
  mctx.drawImage(maskC, 0, 0, fw, fh);
  const fullAlpha = extractAlpha(mctx.getImageData(0, 0, fw, fh).data);

  const out = composite(originalData.data, fullAlpha);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = fw;
  outCanvas.height = fh;
  const octx = outCanvas.getContext('2d');
  if (!octx) throw new Error('Canvas 2D não disponível neste navegador.');
  octx.putImageData(new ImageData(out, fw, fh), 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao exportar o PNG.'))),
      'image/png',
    );
  });
}

export function RefineEditor({
  originalUrl,
  cutoutBlob,
  bgColor,
  onApply,
  onCancel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alphaRef = useRef<Uint8ClampedArray | null>(null);
  const originalRef = useRef<ImageData | null>(null);
  const dimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const undoRef = useRef<Uint8ClampedArray[]>([]);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const dirtyRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [mode, setMode] = useState<Mode>('restore');
  const [brushSize, setBrushSize] = useState(28);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const modeRef = useRef(mode);
  const brushRef = useRef(brushSize);
  modeRef.current = mode;
  brushRef.current = brushSize;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const original = originalRef.current;
    const alpha = alphaRef.current;
    if (!canvas || !original || !alpha) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h } = dimsRef.current;
    const out = composite(original.data, alpha);
    ctx.putImageData(new ImageData(out, w, h), 0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const img = await loadImage(originalUrl);
        const scale = Math.min(
          1,
          MAX_WORK / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height),
        );
        const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
        const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
        const originalData = toImageData(img, w, h);
        const cutoutBitmap = await createImageBitmap(cutoutBlob);
        const cutoutData = toImageData(cutoutBitmap, w, h);
        cutoutBitmap.close();
        if (cancelled) return;
        originalRef.current = originalData;
        alphaRef.current = extractAlpha(cutoutData.data);
        dimsRef.current = { w, h };
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = w;
          canvas.height = h;
        }
        setReady(true);
        render();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Falha ao preparar o editor.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [originalUrl, cutoutBlob, render]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const scheduleRender = useCallback(() => {
    dirtyRef.current = true;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (dirtyRef.current) {
        dirtyRef.current = false;
        render();
      }
    });
  }, [render]);

  const eventToCanvas = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const { w, h } = dimsRef.current;
    return {
      x: ((e.clientX - rect.left) / rect.width) * w,
      y: ((e.clientY - rect.top) / rect.height) * h,
    };
  };

  const paintAt = (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => {
    const alpha = alphaRef.current;
    if (!alpha) return;
    const { w, h } = dimsRef.current;
    const value = modeRef.current === 'restore' ? 255 : 0;
    paintStroke(alpha, w, h, from.x, from.y, to.x, to.y, brushRef.current / 2, value);
    scheduleRender();
  };

  const pushUndo = () => {
    const alpha = alphaRef.current;
    if (!alpha) return;
    undoRef.current.push(new Uint8ClampedArray(alpha));
    if (undoRef.current.length > UNDO_LIMIT) undoRef.current.shift();
    setCanUndo(true);
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pushUndo();
    drawingRef.current = true;
    const p = eventToCanvas(e);
    lastRef.current = p;
    paintAt(p, p);
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const p = eventToCanvas(e);
    const last = lastRef.current ?? p;
    paintAt(last, p);
    lastRef.current = p;
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastRef.current = null;
  };

  const handleUndo = () => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    alphaRef.current = prev;
    setCanUndo(undoRef.current.length > 0);
    render();
  };

  const handleRevert = async () => {
    try {
      const { w, h } = dimsRef.current;
      const cutoutBitmap = await createImageBitmap(cutoutBlob);
      const cutoutData = toImageData(cutoutBitmap, w, h);
      cutoutBitmap.close();
      alphaRef.current = extractAlpha(cutoutData.data);
      undoRef.current = [];
      setCanUndo(false);
      render();
    } catch {
      setError('Falha ao reverter para o recorte da IA.');
    }
  };

  const handleApply = async () => {
    const alpha = alphaRef.current;
    if (!alpha) return;
    setError(null);
    try {
      const blob = await exportMasked(
        originalUrl,
        alpha,
        dimsRef.current.w,
        dimsRef.current.h,
      );
      onApply(blob);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erro ao gerar o PNG. Tente novamente.',
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => setMode('restore')}
            aria-pressed={mode === 'restore'}
            className={`rounded-md px-3 py-1 text-sm ${
              mode === 'restore'
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground'
            }`}
          >
            Restaurar
          </button>
          <button
            type="button"
            onClick={() => setMode('erase')}
            aria-pressed={mode === 'erase'}
            className={`rounded-md px-3 py-1 text-sm ${
              mode === 'erase'
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground'
            }`}
          >
            Apagar
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Pincel
          <input
            type="range"
            min={4}
            max={80}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            aria-label="Tamanho do pincel"
          />
        </label>
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-40"
        >
          Desfazer
        </button>
        <button
          type="button"
          onClick={handleRevert}
          className="rounded-lg border border-border px-3 py-1 text-sm"
        >
          Reverter para IA
        </button>
      </div>

      <p className="text-xs text-muted">
        Pinte sobre a imagem para restaurar ou apagar partes do recorte.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div
        className={`overflow-hidden rounded-2xl border border-border ${
          bgColor === null ? 'checkerboard' : ''
        }`}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="block w-full touch-none [image-rendering:pixelated]"
          style={{ cursor: 'crosshair' }}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleApply}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground"
        >
          Aplicar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npx vitest run src/components/RefineEditor.test.tsx`
Expected: PASS (2 testes).

- [ ] **Step 5: Verificar o build (garante que compila com TS strict)**

Run: `npm run build`
Expected: compila sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/components/RefineEditor.tsx src/components/RefineEditor.test.tsx
git commit -m "feat: RefineEditor (pincel de restaurar/apagar sobre a máscara)"
```

---

### Task 8: Reestilo dos componentes de apresentação

**Files:**
- Modify: `src/components/ImageDropzone.tsx`
- Modify: `src/components/BeforeAfter.tsx`
- Modify: `src/components/BackgroundPicker.tsx`
- Modify: `src/components/DownloadButton.tsx`

**Interfaces:**
- Consumes: tokens (Task 1).
- Produces: mesma API pública dos componentes (nenhuma mudança de props/rótulos). Apenas classes trocadas para tokens.

**Nota:** os testes existentes (`ImageDropzone.test.tsx`, `BackgroundPicker.test.tsx`) são baseados em rótulos/comportamento e devem continuar passando sem alteração.

- [ ] **Step 1: Reestilizar `src/components/ImageDropzone.tsx`**

Trocar as classes de cor fixas por tokens. Substituir o `className` do `div` interativo e os textos:

```tsx
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          dragging ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/60'
        }`}
```

E os parágrafos internos e o erro:

```tsx
        <p className="text-muted">
          Arraste uma imagem aqui ou clique para escolher
        </p>
        <p className="mt-1 text-sm text-muted/70">PNG, JPG ou WebP</p>
```

```tsx
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
```

(O restante do arquivo — refs, handlers, `data-testid`, aria-label — permanece igual.)

- [ ] **Step 2: Reestilizar `src/components/BeforeAfter.tsx`**

```tsx
interface Props {
  originalUrl: string;
  cutoutUrl: string;
  bgColor: string | null;
}

export function BeforeAfter({ originalUrl, cutoutUrl, bgColor }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <figure>
        <figcaption className="mb-1 text-sm text-muted">Original</figcaption>
        <img
          src={originalUrl}
          alt="Original"
          className="w-full rounded-2xl border border-border"
        />
      </figure>
      <figure>
        <figcaption className="mb-1 text-sm text-muted">Sem fundo</figcaption>
        <div
          className={`overflow-hidden rounded-2xl border border-border ${
            bgColor === null ? 'checkerboard' : ''
          }`}
          style={bgColor ? { backgroundColor: bgColor } : undefined}
        >
          <img src={cutoutUrl} alt="Sem fundo" className="w-full" />
        </div>
      </figure>
    </div>
  );
}
```

- [ ] **Step 3: Reestilizar `src/components/BackgroundPicker.tsx`**

Manter os presets e a lógica; trocar só as classes de cor:

```tsx
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
```

(As linhas de `interface Props`, `PRESETS` e `isCustom` permanecem iguais.)

- [ ] **Step 4: Reestilizar `src/components/DownloadButton.tsx`**

Trocar apenas as classes do botão e da mensagem de erro (lógica intacta):

```tsx
      <button
        onClick={handleDownload}
        className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Baixar PNG
      </button>
      {downloadError && (
        <p className="mt-1 text-sm text-red-500">{downloadError}</p>
      )}
```

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm test && npm run build`
Expected: todos os testes passam; build compila. (Rótulos preservados → testes de `ImageDropzone` e `BackgroundPicker` seguem verdes.)

- [ ] **Step 6: Commit**

```bash
git add src/components/ImageDropzone.tsx src/components/BeforeAfter.tsx src/components/BackgroundPicker.tsx src/components/DownloadButton.tsx
git commit -m "feat: reestilo dos componentes com tokens de tema"
```

---

### Task 9: Integração no `App` (shell, tema, spinner, fluxo de refino) + remover `ProgressBar`

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/ProgressBar.tsx`
- Test: `src/App.test.tsx` (permanece; deve continuar passando)

**Interfaces:**
- Consumes: `ImageDropzone`, `AiLoader` (Task 5), `BeforeAfter`, `BackgroundPicker`, `DownloadButton` (Task 8), `RefineEditor` (Task 7), `ThemeToggle` (Task 3), `removeBackground` com `ProgressCallback` (Task 4).
- Produces: app completo. Estado: `aiBlob`/`aiUrl`, `refinedBlob`/`refinedUrl`, `editing`; recorte ativo = `refinedBlob ?? aiBlob`.

- [ ] **Step 1: Confirmar que o teste atual expressa o comportamento esperado**

O `src/App.test.tsx` já valida (a) fluxo até o botão "Baixar" e (b) erro → "Tentar de novo". Ele será a rede de segurança da reescrita. Não alterar o arquivo de teste.

- [ ] **Step 2: Reescrever `src/App.tsx`**

```tsx
import { useState } from 'react';
import { ImageDropzone } from './components/ImageDropzone';
import { AiLoader } from './components/AiLoader';
import { BeforeAfter } from './components/BeforeAfter';
import { BackgroundPicker } from './components/BackgroundPicker';
import { DownloadButton } from './components/DownloadButton';
import { RefineEditor } from './components/RefineEditor';
import { ThemeToggle } from './components/ThemeToggle';
import { removeBackground } from './lib/removeBackground';

type Status = 'idle' | 'processing' | 'done' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState('Preparando…');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [aiBlob, setAiBlob] = useState<Blob | null>(null);
  const [aiUrl, setAiUrl] = useState<string | null>(null);
  const [refinedBlob, setRefinedBlob] = useState<Blob | null>(null);
  const [refinedUrl, setRefinedUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeBlob = refinedBlob ?? aiBlob;
  const activeUrl = refinedUrl ?? aiUrl;

  async function handleImage(file: File) {
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAiUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRefinedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRefinedBlob(null);
    setStatus('processing');
    setProgress(0);
    setLoadingLabel('Preparando…');
    setError(null);
    setBgColor(null);
    setEditing(false);
    try {
      const blob = await removeBackground(file, (p, stage) => {
        setProgress(p);
        setLoadingLabel(
          stage && stage.startsWith('fetch')
            ? 'Baixando modelo de IA… (só na primeira vez)'
            : 'Removendo o fundo…',
        );
      });
      setAiBlob(blob);
      setAiUrl(URL.createObjectURL(blob));
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover o fundo.');
      setStatus('error');
    }
  }

  function reset() {
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setAiUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRefinedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setStatus('idle');
    setAiBlob(null);
    setRefinedBlob(null);
    setError(null);
    setBgColor(null);
    setEditing(false);
  }

  function applyRefine(blob: Blob) {
    setRefinedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    setRefinedBlob(blob);
    setEditing(false);
  }

  function revertRefine() {
    setRefinedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRefinedBlob(null);
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span
              className="h-6 w-6 rounded-md bg-linear-to-br from-accent-2 to-accent"
              aria-hidden
            />
            <span className="font-semibold">bg-remover</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <p className="mb-6 text-sm text-muted">
          Remova o fundo das suas imagens direto no navegador. Nada é enviado
          para servidor.
        </p>

        {status === 'idle' && <ImageDropzone onImage={handleImage} />}

        {status === 'processing' && (
          <AiLoader progress={progress} label={loadingLabel} />
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4">
            <p className="mb-3 text-red-500">{error}</p>
            <button
              className="rounded-lg bg-accent px-4 py-2 text-accent-foreground"
              onClick={reset}
            >
              Tentar de novo
            </button>
          </div>
        )}

        {status === 'done' && originalUrl && activeUrl && activeBlob && aiBlob && (
          <div className="space-y-6">
            {editing ? (
              <RefineEditor
                originalUrl={originalUrl}
                cutoutBlob={aiBlob}
                bgColor={bgColor}
                onApply={applyRefine}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <BeforeAfter
                  originalUrl={originalUrl}
                  cutoutUrl={activeUrl}
                  bgColor={bgColor}
                />
                <BackgroundPicker value={bgColor} onChange={setBgColor} />
                <div className="flex flex-wrap gap-3">
                  <DownloadButton
                    cutout={activeBlob}
                    bgColor={bgColor}
                    fileName="sem-fundo.png"
                  />
                  <button
                    className="rounded-lg border border-border px-4 py-2"
                    onClick={() => setEditing(true)}
                  >
                    Refinar recorte
                  </button>
                  {refinedBlob && (
                    <button
                      className="rounded-lg border border-border px-4 py-2"
                      onClick={revertRefine}
                    >
                      Reverter para IA
                    </button>
                  )}
                  <button
                    className="rounded-lg border border-border px-4 py-2"
                    onClick={reset}
                  >
                    Nova imagem
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-4xl p-6 text-center text-xs text-muted">
        100% no navegador · nada é enviado para servidor
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Remover o `ProgressBar` (agora sem uso)**

```bash
git rm src/components/ProgressBar.tsx
```

- [ ] **Step 4: Rodar a suíte completa e o build**

Run: `npm test && npm run build`
Expected: todos os testes passam (incl. `App.test.tsx`) e o build compila. Se algum import de `ProgressBar` restar, o build acusa — não deve haver nenhum.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: shell com tema, spinner de IA e fluxo de refino no App; remove ProgressBar"
```

---

## Self-Review

**1. Spec coverage:**
- Pincel de refino (restaurar/apagar, tamanho, desfazer, reverter, aplicar/cancelar, máscara, resolução de trabalho, export full-res) → Tasks 6 + 7 + 9. ✓
- Nova interface (shell, cartões, acento, estados) → Tasks 8 + 9. ✓
- Tema claro/escuro/sistema (tokens, hook, toggle, anti-flash, xadrez por tema) → Tasks 1 + 2 + 3 + 9. ✓
- Spinner de IA (anel de progresso, %, label por fase, reduced-motion, a11y) → Tasks 5 + 4 (stage) + 9 (label). ✓
- Remover `ProgressBar` → Task 9. ✓
- Ciclo de object-URLs estendido (`refinedUrl`) → Task 9. ✓

**2. Placeholder scan:** Sem "TBD/TODO"; todo passo tem código/comando concretos. ✓

**3. Type consistency:**
- `ProgressCallback = (progress, stage?) => void` (Task 4) é o que o `App` consome no callback de `removeBackground` (Task 9). ✓
- `extractAlpha`/`paintStroke`/`composite` (Task 6) são exatamente os importados por `RefineEditor` (Task 7). ✓
- `useTheme` retorna `{ theme, setTheme, resolved }` (Task 2), consumido por `ThemeToggle` (Task 3). ✓
- `RefineEditor` recebe `cutoutBlob={aiBlob}` (Task 9) — sempre parte do recorte da IA, coerente com o "reverter". ✓
- `AiLoader({ progress, label })` (Task 5) = props passadas pelo `App` (Task 9). ✓

Sem lacunas encontradas.
