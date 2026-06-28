# bg-remover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um app web que remove o fundo de uma imagem no navegador e permite baixá-la como PNG transparente ou com uma cor de fundo sólida.

**Architecture:** App estático React (Vite). O processamento de imagem roda 100% no navegador via `@imgly/background-removal` (modelo de IA em WASM). A lógica é dividida em funções puras testáveis (`validateImage`, `composeBackground`), um wrapper da lib de IA (`removeBackground`) e componentes React de responsabilidade única, orquestrados por uma máquina de estados em `App.tsx`.

**Tech Stack:** Vite 7, React 19, TypeScript 5.8, Tailwind CSS 4, `@imgly/background-removal`, Vitest 3 + Testing Library (jsdom).

## Global Constraints

- **Sem backend:** todo o processamento acontece no navegador. Nenhuma imagem é enviada para servidor.
- **React:** `^19.2.0`. **Vite:** `^7.0.0`. **Tailwind CSS:** `^4.1.0` (plugin `@tailwindcss/vite`, sem `tailwind.config.js`, CSS via `@import "tailwindcss";`).
- **TypeScript estrito:** `strict: true`, `noUnusedLocals`, `noUnusedParameters`.
- **Idioma da UI:** todo texto visível ao usuário em português (pt-BR).
- **Formatos de imagem aceitos:** `image/png`, `image/jpeg`, `image/webp`.
- **Testes:** Vitest em modo `run` (não-interativo) para CI; ambiente `jsdom`.

---

### Task 1: Scaffold do projeto (Vite + React + TS + Tailwind + Vitest)

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: nada (primeira task).
- Produces: projeto que builda e roda testes. `App` (default export) renderizando o título.

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "bg-remover",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@imgly/background-removal": "^1.7.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Criar `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>bg-remover</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Criar `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 4: Criar `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 5: Criar `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 6: Criar `src/index.css` (Tailwind + classe checkerboard)**

```css
@import "tailwindcss";

.checkerboard {
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
  background-color: #fff;
}
```

- [ ] **Step 7: Criar `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 8: Criar `src/App.tsx` (mínimo, será expandido na Task 7)**

```tsx
export default function App() {
  return <h1>bg-remover</h1>;
}
```

- [ ] **Step 9: Criar `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 10: Escrever o smoke test `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renderiza o título', () => {
  render(<App />);
  expect(screen.getByText('bg-remover')).toBeInTheDocument();
});
```

- [ ] **Step 11: Instalar dependências**

Run: `npm install`
Expected: instala sem erros; cria `node_modules/` e `package-lock.json`.

- [ ] **Step 12: Rodar o smoke test**

Run: `npm test`
Expected: PASS — 1 teste passando (`renderiza o título`).

- [ ] **Step 13: Verificar o build**

Run: `npm run build`
Expected: build conclui sem erros; gera `dist/`.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

### Task 2: `validateImage` — validação de arquivo (função pura, TDD)

**Files:**
- Create: `src/lib/validateImage.ts`
- Test: `src/lib/validateImage.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type ValidationResult = { ok: true } | { ok: false; message: string }`
  - `function validateImage(file: File): ValidationResult`

- [ ] **Step 1: Escrever o teste que falha `src/lib/validateImage.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { validateImage } from './validateImage';

describe('validateImage', () => {
  it('aceita PNG, JPG e WebP', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      const file = new File(['conteudo'], 'img', { type });
      expect(validateImage(file)).toEqual({ ok: true });
    }
  });

  it('rejeita tipos não suportados com mensagem', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    const result = validateImage(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/não suportado/i);
    }
  });

  it('rejeita arquivo vazio', () => {
    const file = new File([], 'vazio.png', { type: 'image/png' });
    const result = validateImage(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/vazio/i);
    }
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run src/lib/validateImage.test.ts`
Expected: FAIL — "Failed to resolve import './validateImage'" / módulo não existe.

- [ ] **Step 3: Implementar `src/lib/validateImage.ts`**

```ts
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateImage(file: File): ValidationResult {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { ok: false, message: 'Formato não suportado. Use PNG, JPG ou WebP.' };
  }
  if (file.size === 0) {
    return { ok: false, message: 'Arquivo vazio. Escolha outra imagem.' };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npx vitest run src/lib/validateImage.test.ts`
Expected: PASS — 3 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validateImage.ts src/lib/validateImage.test.ts
git commit -m "feat: validateImage util"
```

---

### Task 3: `composeBackground` — compor cor de fundo no canvas (função pura, TDD)

**Files:**
- Create: `src/lib/composeBackground.ts`
- Test: `src/lib/composeBackground.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `function composeBackground(cutout: Blob, color: string | null): Promise<Blob>`
  - Contrato: `color === null` → devolve o `cutout` original (transparente). Caso contrário, desenha o recorte sobre a cor escolhida e devolve um PNG.

- [ ] **Step 1: Escrever o teste que falha `src/lib/composeBackground.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { composeBackground } from './composeBackground';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('composeBackground', () => {
  it('devolve o blob original quando a cor é null (transparente)', async () => {
    const cutout = new Blob(['x'], { type: 'image/png' });
    const result = await composeBackground(cutout, null);
    expect(result).toBe(cutout);
  });

  it('preenche a cor escolhida atrás do recorte e exporta PNG', async () => {
    const cutout = new Blob(['x'], { type: 'image/png' });
    const outBlob = new Blob(['y'], { type: 'image/png' });

    const ctx = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(outBlob)),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(
      canvas as unknown as HTMLCanvasElement,
    );
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 10, height: 20, close: vi.fn() })),
    );

    const result = await composeBackground(cutout, '#ff0000');

    expect(canvas.width).toBe(10);
    expect(canvas.height).toBe(20);
    expect(ctx.fillStyle).toBe('#ff0000');
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 10, 20);
    expect(ctx.drawImage).toHaveBeenCalled();
    expect(result).toBe(outBlob);
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run src/lib/composeBackground.test.ts`
Expected: FAIL — módulo `./composeBackground` não existe.

- [ ] **Step 3: Implementar `src/lib/composeBackground.ts`**

```ts
export async function composeBackground(
  cutout: Blob,
  color: string | null,
): Promise<Blob> {
  if (color === null) {
    return cutout;
  }

  const bitmap = await createImageBitmap(cutout);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D não disponível neste navegador.');
  }

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao exportar o PNG.'));
    }, 'image/png');
  });
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npx vitest run src/lib/composeBackground.test.ts`
Expected: PASS — 2 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/lib/composeBackground.ts src/lib/composeBackground.test.ts
git commit -m "feat: composeBackground util"
```

---

### Task 4: `removeBackground` — wrapper da lib de IA (TDD com lib mockada)

**Files:**
- Create: `src/lib/removeBackground.ts`
- Test: `src/lib/removeBackground.test.ts`

**Interfaces:**
- Consumes: `@imgly/background-removal` → `removeBackground(image, config?)` onde `config.progress?: (key: string, current: number, total: number) => void`, retorna `Promise<Blob>`.
- Produces:
  - `function removeBackground(file: File, onProgress?: (progress: number) => void): Promise<Blob>`
  - `onProgress` recebe um número de `0` a `1`.

- [ ] **Step 1: Escrever o teste que falha `src/lib/removeBackground.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeBackground } from './removeBackground';
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

vi.mock('@imgly/background-removal', () => ({
  removeBackground: vi.fn(),
}));

describe('removeBackground', () => {
  beforeEach(() => {
    vi.mocked(imglyRemoveBackground).mockReset();
  });

  it('chama a lib com o arquivo e devolve o blob', async () => {
    const blob = new Blob(['cut'], { type: 'image/png' });
    vi.mocked(imglyRemoveBackground).mockResolvedValue(blob);

    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const result = await removeBackground(file);

    expect(imglyRemoveBackground).toHaveBeenCalledWith(file, expect.any(Object));
    expect(result).toBe(blob);
  });

  it('normaliza o progresso para 0..1', async () => {
    const blob = new Blob(['cut'], { type: 'image/png' });
    vi.mocked(imglyRemoveBackground).mockImplementation(
      async (_img: unknown, config?: { progress?: (k: string, c: number, t: number) => void }) => {
        config?.progress?.('fetch:model', 50, 100);
        return blob;
      },
    );

    const onProgress = vi.fn();
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    await removeBackground(file, onProgress);

    expect(onProgress).toHaveBeenCalledWith(0.5);
  });

  it('propaga erros da lib', async () => {
    vi.mocked(imglyRemoveBackground).mockRejectedValue(new Error('boom'));
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    await expect(removeBackground(file)).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run src/lib/removeBackground.test.ts`
Expected: FAIL — módulo `./removeBackground` não existe.

- [ ] **Step 3: Implementar `src/lib/removeBackground.ts`**

```ts
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

export async function removeBackground(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  return imglyRemoveBackground(file, {
    progress: (_key, current, total) => {
      if (onProgress && total > 0) {
        onProgress(current / total);
      }
    },
  });
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npx vitest run src/lib/removeBackground.test.ts`
Expected: PASS — 3 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/lib/removeBackground.ts src/lib/removeBackground.test.ts
git commit -m "feat: removeBackground wrapper"
```

---

### Task 5: `ImageDropzone` — área de upload (TDD com Testing Library)

**Files:**
- Create: `src/components/ImageDropzone.tsx`
- Test: `src/components/ImageDropzone.test.tsx`

**Interfaces:**
- Consumes: `validateImage` (Task 2).
- Produces: `function ImageDropzone(props: { onImage: (file: File) => void }): JSX.Element`. Possui um `<input type="file" data-testid="file-input">`.

- [ ] **Step 1: Escrever o teste que falha `src/components/ImageDropzone.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageDropzone } from './ImageDropzone';

describe('ImageDropzone', () => {
  it('chama onImage com um PNG válido', () => {
    const onImage = vi.fn();
    render(<ImageDropzone onImage={onImage} />);
    const input = screen.getByTestId('file-input');
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onImage).toHaveBeenCalledWith(file);
  });

  it('mostra erro e não chama onImage com tipo inválido', () => {
    const onImage = vi.fn();
    render(<ImageDropzone onImage={onImage} />);
    const input = screen.getByTestId('file-input');
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onImage).not.toHaveBeenCalled();
    expect(screen.getByText(/não suportado/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run src/components/ImageDropzone.test.tsx`
Expected: FAIL — módulo `./ImageDropzone` não existe.

- [ ] **Step 3: Implementar `src/components/ImageDropzone.tsx`**

```tsx
import { useRef, useState } from 'react';
import { validateImage } from '../lib/validateImage';

interface Props {
  onImage: (file: File) => void;
}

export function ImageDropzone({ onImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const result = validateImage(file);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    onImage(file);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          dragging ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <p className="text-gray-600">
          Arraste uma imagem aqui ou clique para escolher
        </p>
        <p className="mt-1 text-sm text-gray-400">PNG, JPG ou WebP</p>
        <input
          ref={inputRef}
          data-testid="file-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npx vitest run src/components/ImageDropzone.test.tsx`
Expected: PASS — 2 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/components/ImageDropzone.tsx src/components/ImageDropzone.test.tsx
git commit -m "feat: ImageDropzone component"
```

---

### Task 6: Componentes de apresentação (`ProgressBar`, `BeforeAfter`, `BackgroundPicker`, `DownloadButton`)

**Files:**
- Create: `src/components/ProgressBar.tsx`
- Create: `src/components/BeforeAfter.tsx`
- Create: `src/components/BackgroundPicker.tsx`
- Create: `src/components/DownloadButton.tsx`
- Test: `src/components/BackgroundPicker.test.tsx`

**Interfaces:**
- Consumes: `composeBackground` (Task 3).
- Produces:
  - `function ProgressBar(props: { value: number; label?: string }): JSX.Element`
  - `function BeforeAfter(props: { originalUrl: string; cutoutUrl: string; bgColor: string | null }): JSX.Element`
  - `function BackgroundPicker(props: { value: string | null; onChange: (color: string | null) => void }): JSX.Element`
  - `function DownloadButton(props: { cutout: Blob; bgColor: string | null; fileName: string }): JSX.Element` (rótulo do botão contém "Baixar")

- [ ] **Step 1: Criar `src/components/ProgressBar.tsx`**

```tsx
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
```

- [ ] **Step 2: Criar `src/components/BeforeAfter.tsx`**

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
        <figcaption className="mb-1 text-sm text-gray-600">Original</figcaption>
        <img src={originalUrl} alt="Original" className="w-full rounded border" />
      </figure>
      <figure>
        <figcaption className="mb-1 text-sm text-gray-600">Sem fundo</figcaption>
        <div
          className={`overflow-hidden rounded border ${
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

- [ ] **Step 3: Criar `src/components/DownloadButton.tsx`**

```tsx
import { composeBackground } from '../lib/composeBackground';

interface Props {
  cutout: Blob;
  bgColor: string | null;
  fileName: string;
}

export function DownloadButton({ cutout, bgColor, fileName }: Props) {
  async function handleDownload() {
    const blob = await composeBackground(cutout, bgColor);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleDownload}
      className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
    >
      Baixar PNG
    </button>
  );
}
```

- [ ] **Step 4: Escrever o teste que falha `src/components/BackgroundPicker.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackgroundPicker } from './BackgroundPicker';

describe('BackgroundPicker', () => {
  it('chama onChange com null ao clicar em Transparente', () => {
    const onChange = vi.fn();
    render(<BackgroundPicker value="#000000" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /transparente/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('chama onChange com preto ao clicar em Preto', () => {
    const onChange = vi.fn();
    render(<BackgroundPicker value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /preto/i }));
    expect(onChange).toHaveBeenCalledWith('#000000');
  });
});
```

- [ ] **Step 5: Rodar o teste para confirmar que falha**

Run: `npx vitest run src/components/BackgroundPicker.test.tsx`
Expected: FAIL — módulo `./BackgroundPicker` não existe.

- [ ] **Step 6: Implementar `src/components/BackgroundPicker.tsx`**

```tsx
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
      <span className="text-sm text-gray-600">Fundo:</span>
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => onChange(preset.color)}
          className={`rounded border px-3 py-1 text-sm ${
            value === preset.color
              ? 'border-blue-600 ring-2 ring-blue-200'
              : 'border-gray-300'
          }`}
        >
          {preset.label}
        </button>
      ))}
      <label className="flex items-center gap-1 text-sm text-gray-600">
        Cor:
        <input
          type="color"
          value={isCustom ? (value as string) : '#3b82f6'}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Cor personalizada"
          className="h-7 w-9 cursor-pointer rounded border border-gray-300"
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 7: Rodar o teste para confirmar que passa**

Run: `npx vitest run src/components/BackgroundPicker.test.tsx`
Expected: PASS — 2 testes passando.

- [ ] **Step 8: Commit**

```bash
git add src/components/ProgressBar.tsx src/components/BeforeAfter.tsx src/components/BackgroundPicker.tsx src/components/BackgroundPicker.test.tsx src/components/DownloadButton.tsx
git commit -m "feat: presentational components"
```

---

### Task 7: `App` — orquestração da máquina de estados (TDD de integração)

**Files:**
- Modify: `src/App.tsx` (substitui o conteúdo mínimo da Task 1)
- Modify: `src/App.test.tsx` (substitui o smoke test da Task 1)

**Interfaces:**
- Consumes: `ImageDropzone`, `ProgressBar`, `BeforeAfter`, `BackgroundPicker`, `DownloadButton`, `removeBackground`.
- Produces: `App` default export com a máquina de estados `idle → processing → done | error`.

- [ ] **Step 1: Reescrever o teste de integração `src/App.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

vi.mock('./lib/removeBackground', () => ({
  removeBackground: vi.fn(async () => new Blob(['cut'], { type: 'image/png' })),
}));

beforeEach(() => {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake');
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe('App', () => {
  it('processa a imagem e mostra o botão de baixar', async () => {
    render(<App />);
    const input = screen.getByTestId('file-input');
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /baixar/i }),
      ).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — não existe `file-input` / botão "Baixar" ainda (App mínimo só renderiza o título).

- [ ] **Step 3: Reescrever `src/App.tsx`**

```tsx
import { useState } from 'react';
import { ImageDropzone } from './components/ImageDropzone';
import { ProgressBar } from './components/ProgressBar';
import { BeforeAfter } from './components/BeforeAfter';
import { BackgroundPicker } from './components/BackgroundPicker';
import { DownloadButton } from './components/DownloadButton';
import { removeBackground } from './lib/removeBackground';

type Status = 'idle' | 'processing' | 'done' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [cutoutBlob, setCutoutBlob] = useState<Blob | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImage(file: File) {
    setStatus('processing');
    setProgress(0);
    setError(null);
    setBgColor(null);
    setOriginalUrl(URL.createObjectURL(file));
    try {
      const blob = await removeBackground(file, setProgress);
      setCutoutBlob(blob);
      setCutoutUrl(URL.createObjectURL(blob));
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover o fundo.');
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setOriginalUrl(null);
    setCutoutBlob(null);
    setCutoutUrl(null);
    setError(null);
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-3xl font-bold">bg-remover</h1>
      <p className="mb-6 text-sm text-gray-500">
        Remova o fundo das suas imagens direto no navegador. Nada é enviado para
        servidor.
      </p>

      {status === 'idle' && <ImageDropzone onImage={handleImage} />}

      {status === 'processing' && (
        <ProgressBar
          value={progress}
          label="Removendo o fundo… (na primeira vez, baixa o modelo de IA — pode levar um pouco)"
        />
      )}

      {status === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="mb-3 text-red-700">{error}</p>
          <button
            className="rounded bg-red-600 px-4 py-2 text-white"
            onClick={reset}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {status === 'done' && originalUrl && cutoutUrl && cutoutBlob && (
        <div className="space-y-6">
          <BeforeAfter
            originalUrl={originalUrl}
            cutoutUrl={cutoutUrl}
            bgColor={bgColor}
          />
          <BackgroundPicker value={bgColor} onChange={setBgColor} />
          <div className="flex gap-3">
            <DownloadButton
              cutout={cutoutBlob}
              bgColor={bgColor}
              fileName="sem-fundo.png"
            />
            <button className="rounded border px-4 py-2" onClick={reset}>
              Nova imagem
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Rodar o teste de integração para confirmar que passa**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS — 1 teste passando.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS — todos os testes (validateImage, composeBackground, removeBackground, ImageDropzone, BackgroundPicker, App).

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: App state machine wiring"
```

---

### Task 8: README, verificação de build e prontidão para deploy

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: tudo das tasks anteriores.
- Produces: documentação e confirmação de que `npm run build` gera `dist/` para deploy estático.

- [ ] **Step 1: Criar `README.md`**

```markdown
# bg-remover

App web para remover o fundo de imagens (ex.: logos) direto no navegador.
Todo o processamento roda localmente com `@imgly/background-removal` — nenhuma
imagem é enviada para servidor.

## Recursos

- Upload por arrastar-e-soltar ou seletor de arquivo (PNG, JPG, WebP)
- Remoção de fundo com IA no navegador
- Comparação antes/depois com fundo quadriculado
- Trocar o fundo por uma cor sólida (ou manter transparente)
- Baixar o resultado como PNG

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # roda os testes
npm run build    # gera dist/ para deploy estático
```

> Na primeira remoção, o modelo de IA (~40MB) é baixado e fica em cache do
> navegador. As próximas execuções são rápidas.

## Deploy

É um site estático. Após `npm run build`, faça deploy da pasta `dist/` em
Vercel, Netlify ou GitHub Pages.
```

- [ ] **Step 2: Rodar a suíte completa de testes**

Run: `npm test`
Expected: PASS — todos os testes passando.

- [ ] **Step 3: Verificar o build de produção**

Run: `npm run build`
Expected: typecheck (`tsc --noEmit`) sem erros e build do Vite concluído gerando `dist/`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README e prontidão para deploy"
```

---

## Notas de execução

- O modelo da `@imgly/background-removal` é baixado em runtime no navegador; não é necessário configurar nada no build.
- Os testes nunca executam o modelo de IA de verdade — `removeBackground` é mockado nos testes de `App` e a lib é mockada no teste do wrapper. Isso mantém a suíte rápida e determinística.
- Verificação manual sugerida ao final: `npm run dev`, subir uma logo com fundo, conferir o recorte, alternar transparente/branco/preto/cor custom e baixar o PNG.
