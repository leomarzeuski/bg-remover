# SemFundo Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lançar o bg-remover como produto "SemFundo" em semfundo.app: bilíngue PT/EN, SEO completo, imagem de exemplo, analytics sem cookies, compliance AGPL e kit de divulgação.

**Architecture:** App continua 100% client-side (Vite + React 19 + Tailwind 4, estático na Vercel). Duas páginas HTML (`/` PT, `/en/` EN) compartilham o mesmo bundle React; um dicionário tipado próprio (sem lib de i18n) fornece as strings via contexto. A lib de IA passa a ser importada dinamicamente para a landing carregar leve.

**Tech Stack:** Vite 7 (build multi-página), React 19, Tailwind 4, Vitest + Testing Library, `@imgly/background-removal` (AGPL), `@vercel/analytics`.

**Spec:** `docs/superpowers/specs/2026-07-01-semfundo-launch-design.md`

## Global Constraints

- 100% client-side: nenhum backend, nenhuma env var nova.
- Rotas: `/` = PT-BR (default), `/en/` = inglês. Sem redirect automático por idioma.
- Sem biblioteca de i18n — dicionário próprio tipado em `src/i18n/strings.ts`.
- Marca na UI: **SemFundo**. Domínio canônico: `https://semfundo.app`.
- Repo público: `https://github.com/leomarzeuski/bg-remover`. Licença do projeto: **AGPL-3.0-only**.
- `npm test` verde ao fim de CADA task (35 testes existentes + novos).
- Branch de trabalho: `feat/lancamento-semfundo` (já existe). Commits em PT no padrão do repo (`feat:`/`fix:`/`docs:`), terminando com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Testes existentes assumem PT como default (jsdom usa pathname `/`) — nunca quebrar isso.

---

### Task 1: Fundação i18n — dicionário tipado e contexto de locale

**Files:**
- Create: `src/i18n/strings.ts`
- Create: `src/i18n/locale.tsx`
- Test: `src/i18n/strings.test.ts`, `src/i18n/locale.test.tsx`

**Interfaces:**
- Consumes: nada (task inicial).
- Produces (usado por TODAS as tasks seguintes):
  - `type Locale = 'pt' | 'en'`
  - `type StringKey` (união das chaves do dicionário)
  - `strings: Record<Locale, Record<StringKey, string>>`
  - `detectLocale(pathname: string): Locale`
  - `LocaleProvider({ locale, children }): JSX` (contexto; default sem provider = `'pt'`)
  - `useLocale(): { locale: Locale; t: (key: StringKey) => string }`

- [ ] **Step 1: Escrever os testes que falham**

`src/i18n/strings.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { strings } from './strings';

describe('strings', () => {
  it('pt e en têm exatamente as mesmas chaves', () => {
    expect(Object.keys(strings.en).sort()).toEqual(Object.keys(strings.pt).sort());
  });

  it('nenhuma string é vazia', () => {
    for (const locale of ['pt', 'en'] as const) {
      for (const [key, value] of Object.entries(strings[locale])) {
        expect(value, `${locale}.${key}`).not.toBe('');
      }
    }
  });
});
```

`src/i18n/locale.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { detectLocale, LocaleProvider, useLocale } from './locale';

function Probe() {
  const { locale, t } = useLocale();
  return <p>{locale}:{t('downloadPng')}</p>;
}

describe('detectLocale', () => {
  it('/ é pt', () => expect(detectLocale('/')).toBe('pt'));
  it('/en e /en/ são en', () => {
    expect(detectLocale('/en')).toBe('en');
    expect(detectLocale('/en/')).toBe('en');
    expect(detectLocale('/en/index.html')).toBe('en');
  });
  it('/ennn não é en', () => expect(detectLocale('/ennn')).toBe('pt'));
});

describe('useLocale', () => {
  it('default sem provider é pt', () => {
    render(<Probe />);
    expect(screen.getByText('pt:Baixar PNG')).toBeInTheDocument();
  });
  it('provider en traduz', () => {
    render(<LocaleProvider locale="en"><Probe /></LocaleProvider>);
    expect(screen.getByText('en:Download PNG')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/i18n`
Expected: FAIL — `Cannot find module './strings'` / `'./locale'`.

- [ ] **Step 3: Implementar `src/i18n/strings.ts` (dicionário COMPLETO)**

```ts
export type Locale = 'pt' | 'en';

const pt = {
  appName: 'SemFundo',
  h1: 'Remova o fundo de imagens grátis — direto no navegador',
  intro: 'Sem cadastro, sem marca d’água. A IA roda no seu dispositivo: nada é enviado para servidor.',
  loadingPreparing: 'Preparando…',
  loadingDownloading: 'Baixando modelo de IA… (só na primeira vez)',
  loadingRemoving: 'Removendo o fundo…',
  loadingDone: 'Pronto!',
  errorGeneric: 'Erro ao remover o fundo.',
  tryAgain: 'Tentar de novo',
  refineCutout: 'Refinar recorte',
  revertToAi: 'Reverter para IA',
  newImage: 'Nova imagem',
  downloadFileName: 'sem-fundo.png',
  footerTagline: '100% no navegador · nada é enviado para servidor',
  footerOpenSource: 'Código aberto no GitHub',
  footerAnalytics: 'métricas sem cookies',
  madeBy: 'feito por Leo Marzeuski',
  dropzoneAria: 'Enviar imagem',
  dropzonePrompt: 'Arraste, cole (Ctrl/Cmd+V) ou clique para escolher',
  dropzoneFormats: 'PNG, JPG ou WebP',
  sampleButton: 'Experimentar com uma imagem de exemplo',
  sampleLoading: 'Carregando exemplo…',
  sampleError: 'Não foi possível carregar o exemplo. Tente enviar uma imagem.',
  errorUnsupportedType: 'Formato não suportado. Use PNG, JPG ou WebP.',
  errorEmptyFile: 'Arquivo vazio. Escolha outra imagem.',
  original: 'Original',
  cutout: 'Sem fundo',
  bgLabel: 'Fundo:',
  bgTransparent: 'Transparente',
  bgWhite: 'Branco',
  bgBlack: 'Preto',
  bgCustom: 'Cor:',
  bgCustomAria: 'Cor personalizada',
  downloadPng: 'Baixar PNG',
  downloadError: 'Erro ao gerar o arquivo para download. Tente novamente.',
  refineRestore: 'Restaurar',
  refineErase: 'Apagar',
  refineBrush: 'Pincel',
  refineBrushAria: 'Tamanho do pincel',
  refineUndo: 'Desfazer',
  refineRedo: 'Refazer',
  refineHint: 'Pinte sobre a imagem para restaurar ou apagar partes do recorte.',
  refineApply: 'Aplicar',
  refineCancel: 'Cancelar',
  refinePrepareError: 'Falha ao preparar o editor.',
  refineRevertError: 'Falha ao reverter para o recorte da IA.',
  refineExportError: 'Erro ao gerar o PNG. Tente novamente.',
  themeGroup: 'Tema',
  themeLight: 'Tema claro',
  themeDark: 'Tema escuro',
  themeSystem: 'Tema do sistema',
  howTitle: 'Como funciona',
  how1Title: 'Envie uma imagem',
  how1Text: 'Arraste, cole ou escolha um arquivo PNG, JPG ou WebP.',
  how2Title: 'A IA remove o fundo',
  how2Text: 'Tudo acontece no seu navegador, em segundos.',
  how3Title: 'Baixe o PNG',
  how3Text: 'Com fundo transparente ou uma cor à sua escolha. Dá para refinar com pincel.',
  privacyTitle: 'Privacidade de verdade',
  privacyText: 'A maioria dos removedores de fundo envia sua foto para um servidor. Aqui não: o modelo de IA é baixado uma única vez e processa tudo localmente, no seu dispositivo. Nenhuma imagem sai do navegador.',
  privacyLink: 'Confira o código no GitHub',
  faqTitle: 'Perguntas frequentes',
  faq1q: 'O SemFundo é grátis mesmo?',
  faq1a: 'Sim. Sem cadastro, sem marca d’água e sem limite de resolução. O projeto é de código aberto e custa quase nada para operar — por isso consegue ser grátis.',
  faq2q: 'Minhas imagens são enviadas para algum servidor?',
  faq2a: 'Não. A inteligência artificial roda dentro do seu navegador, no seu dispositivo. A imagem nunca sai do seu computador ou celular — você pode conferir no código, que é aberto.',
  faq3q: 'Por que a primeira remoção demora mais?',
  faq3a: 'Na primeira vez, o navegador baixa o modelo de IA (~40 MB) e o guarda em cache. Das próximas vezes, o processo começa na hora.',
  faq4q: 'Quais formatos são aceitos?',
  faq4a: 'PNG, JPG e WebP. O resultado é baixado como PNG com fundo transparente — ou com a cor sólida que você escolher.',
  faq5q: 'Funciona no celular?',
  faq5a: 'Sim. Dá para enviar fotos da galeria, refinar o recorte com o dedo e baixar o resultado.',
  faq6q: 'Posso usar o resultado comercialmente?',
  faq6a: 'Sim, a imagem gerada é sua. (O código do app é licenciado sob AGPL-3.0, mas isso não afeta as suas imagens.)',
};

export type StringKey = keyof typeof pt;

const en: Record<StringKey, string> = {
  appName: 'SemFundo',
  h1: 'Remove image backgrounds free — right in your browser',
  intro: 'No signup, no watermark. The AI runs on your device: nothing is uploaded to a server.',
  loadingPreparing: 'Preparing…',
  loadingDownloading: 'Downloading AI model… (first time only)',
  loadingRemoving: 'Removing the background…',
  loadingDone: 'Done!',
  errorGeneric: 'Failed to remove the background.',
  tryAgain: 'Try again',
  refineCutout: 'Refine cutout',
  revertToAi: 'Revert to AI',
  newImage: 'New image',
  downloadFileName: 'no-background.png',
  footerTagline: '100% in your browser · nothing is uploaded',
  footerOpenSource: 'Open source on GitHub',
  footerAnalytics: 'cookie-free analytics',
  madeBy: 'made by Leo Marzeuski',
  dropzoneAria: 'Upload image',
  dropzonePrompt: 'Drag & drop, paste (Ctrl/Cmd+V) or click to choose',
  dropzoneFormats: 'PNG, JPG or WebP',
  sampleButton: 'Try with a sample image',
  sampleLoading: 'Loading sample…',
  sampleError: 'Could not load the sample. Try uploading an image.',
  errorUnsupportedType: 'Unsupported format. Use PNG, JPG or WebP.',
  errorEmptyFile: 'Empty file. Choose another image.',
  original: 'Original',
  cutout: 'No background',
  bgLabel: 'Background:',
  bgTransparent: 'Transparent',
  bgWhite: 'White',
  bgBlack: 'Black',
  bgCustom: 'Color:',
  bgCustomAria: 'Custom color',
  downloadPng: 'Download PNG',
  downloadError: 'Error generating the download file. Please try again.',
  refineRestore: 'Restore',
  refineErase: 'Erase',
  refineBrush: 'Brush',
  refineBrushAria: 'Brush size',
  refineUndo: 'Undo',
  refineRedo: 'Redo',
  refineHint: 'Paint over the image to restore or erase parts of the cutout.',
  refineApply: 'Apply',
  refineCancel: 'Cancel',
  refinePrepareError: 'Failed to prepare the editor.',
  refineRevertError: 'Failed to revert to the AI cutout.',
  refineExportError: 'Error generating the PNG. Please try again.',
  themeGroup: 'Theme',
  themeLight: 'Light theme',
  themeDark: 'Dark theme',
  themeSystem: 'System theme',
  howTitle: 'How it works',
  how1Title: 'Upload an image',
  how1Text: 'Drag & drop, paste or choose a PNG, JPG or WebP file.',
  how2Title: 'The AI removes the background',
  how2Text: 'Everything happens in your browser, in seconds.',
  how3Title: 'Download the PNG',
  how3Text: 'With a transparent background or any color you like. You can refine it with a brush.',
  privacyTitle: 'Real privacy',
  privacyText: 'Most background removers upload your photo to a server. Not here: the AI model is downloaded once and processes everything locally, on your device. No image ever leaves your browser.',
  privacyLink: 'Check the code on GitHub',
  faqTitle: 'Frequently asked questions',
  faq1q: 'Is SemFundo really free?',
  faq1a: 'Yes. No signup, no watermark, no resolution limits. The project is open source and costs almost nothing to run — that’s how it stays free.',
  faq2q: 'Are my images uploaded to a server?',
  faq2a: 'No. The AI runs inside your browser, on your device. Your image never leaves your computer or phone — and you can verify that in the open source code.',
  faq3q: 'Why is the first removal slower?',
  faq3a: 'On first use, your browser downloads the AI model (~40 MB) and caches it. After that, processing starts right away.',
  faq4q: 'Which formats are supported?',
  faq4a: 'PNG, JPG and WebP. The result downloads as a PNG with a transparent background — or any solid color you pick.',
  faq5q: 'Does it work on mobile?',
  faq5a: 'Yes. You can upload photos from your gallery, refine the cutout with your finger and download the result.',
  faq6q: 'Can I use the result commercially?',
  faq6a: 'Yes, the generated image is yours. (The app code is licensed under AGPL-3.0, which does not affect your images.)',
};

export const strings: Record<Locale, Record<StringKey, string>> = { pt, en };
```

- [ ] **Step 4: Implementar `src/i18n/locale.tsx`**

```tsx
import { createContext, useContext, type ReactNode } from 'react';
import { strings, type Locale, type StringKey } from './strings';

export function detectLocale(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pt';
}

const LocaleContext = createContext<Locale>('pt');

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const locale = useContext(LocaleContext);
  const t = (key: StringKey) => strings[locale][key];
  return { locale, t };
}
```

- [ ] **Step 5: Rodar os testes**

Run: `npx vitest run src/i18n`
Expected: PASS (5+ testes).

- [ ] **Step 6: Ligar o provider no `src/main.tsx`**

Substituir o conteúdo por:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { detectLocale, LocaleProvider } from './i18n/locale';

const locale = detectLocale(window.location.pathname);
document.documentElement.lang = locale === 'en' ? 'en' : 'pt-BR';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider locale={locale}>
      <App />
    </LocaleProvider>
  </StrictMode>,
);
```

- [ ] **Step 7: Suíte inteira + commit**

Run: `npm test` — Expected: 35 antigos + novos PASS.

```bash
git add src/i18n src/main.tsx
git commit -m "feat: fundação i18n (dicionário pt/en tipado + LocaleProvider)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: validateImage retorna códigos; ImageDropzone traduz

**Files:**
- Modify: `src/lib/validateImage.ts`
- Modify: `src/components/ImageDropzone.tsx`
- Test: `src/lib/validateImage.test.ts` (reescrever asserts), `src/components/ImageDropzone.test.tsx` (mantém)

**Interfaces:**
- Consumes: `useLocale()` da Task 1.
- Produces: `validateImage(file: File): { ok: true } | { ok: false; code: ValidationErrorCode }` com `export type ValidationErrorCode = 'unsupported-type' | 'empty-file'`. **Atenção:** `App.tsx` usa `validateImage(file).ok` no handler de paste — a propriedade `ok` continua existindo, nada muda lá.

- [ ] **Step 1: Reescrever o teste de validateImage (falhando)**

Substituir `src/lib/validateImage.test.ts` por:

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

  it('rejeita tipos não suportados com código', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateImage(file)).toEqual({ ok: false, code: 'unsupported-type' });
  });

  it('rejeita arquivo vazio com código', () => {
    const file = new File([], 'vazio.png', { type: 'image/png' });
    expect(validateImage(file)).toEqual({ ok: false, code: 'empty-file' });
  });
});
```

Run: `npx vitest run src/lib/validateImage.test.ts` — Expected: FAIL (retorna `message`).

- [ ] **Step 2: Implementar códigos**

Substituir `src/lib/validateImage.ts` por:

```ts
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export type ValidationErrorCode = 'unsupported-type' | 'empty-file';

export type ValidationResult =
  | { ok: true }
  | { ok: false; code: ValidationErrorCode };

export function validateImage(file: File): ValidationResult {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { ok: false, code: 'unsupported-type' };
  }
  if (file.size === 0) {
    return { ok: false, code: 'empty-file' };
  }
  return { ok: true };
}
```

- [ ] **Step 3: ImageDropzone mapeia código → t() e traduz as strings fixas**

Em `src/components/ImageDropzone.tsx`:

```tsx
import { useRef, useState } from 'react';
import { validateImage, type ValidationErrorCode } from '../lib/validateImage';
import { useLocale } from '../i18n/locale';
import type { StringKey } from '../i18n/strings';

interface Props {
  onImage: (file: File) => void;
}

const ERROR_KEY: Record<ValidationErrorCode, StringKey> = {
  'unsupported-type': 'errorUnsupportedType',
  'empty-file': 'errorEmptyFile',
};

export function ImageDropzone({ onImage }: Props) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorKey, setErrorKey] = useState<StringKey | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const result = validateImage(file);
    if (!result.ok) {
      setErrorKey(ERROR_KEY[result.code]);
      return;
    }
    setErrorKey(null);
    onImage(file);
  }
  // ... JSX igual ao atual, trocando:
  //   aria-label="Enviar imagem"        → aria-label={t('dropzoneAria')}
  //   "Arraste, cole (Ctrl/Cmd+V)..."   → {t('dropzonePrompt')}
  //   "PNG, JPG ou WebP"                → {t('dropzoneFormats')}
  //   {error && <p ...>{error}</p>}     → {errorKey && <p className="mt-2 text-sm text-red-500">{t(errorKey)}</p>}
}
```

(O restante do JSX — div com role="button", input file, classes — permanece byte a byte como está hoje.)

- [ ] **Step 4: Rodar tudo**

Run: `npm test`
Expected: PASS — os testes do Dropzone continuam válidos porque o texto PT renderizado é o mesmo.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validateImage.ts src/lib/validateImage.test.ts src/components/ImageDropzone.tsx
git commit -m "feat: validateImage com códigos de erro; Dropzone traduzido via t()

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: App shell — marca SemFundo, h1, toggle PT|EN e strings via t()

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx` (adicionar teste EN)

**Interfaces:**
- Consumes: `useLocale`, `LocaleProvider`, `StringKey` (Task 1).
- Produces: App renderiza `<h1>` com `t('h1')`; header com `t('appName')` e link de idioma (`<a href="/en/">EN</a>` na página PT, `<a href="/">PT</a>` na EN). Estados de loading/erro guardam **chaves** (`StringKey`), não texto.

- [ ] **Step 1: Adicionar teste EN (falhando)**

Em `src/App.test.tsx`, adicionar import e teste:

```tsx
import { LocaleProvider } from './i18n/locale';

it('renderiza em inglês dentro de LocaleProvider en', () => {
  render(
    <LocaleProvider locale="en">
      <App />
    </LocaleProvider>,
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    /remove image backgrounds/i,
  );
  expect(screen.getByRole('link', { name: 'PT' })).toHaveAttribute('href', '/');
});
```

Run: `npx vitest run src/App.test.tsx` — Expected: FAIL (não há h1 nem link PT).

- [ ] **Step 2: Reescrever o App com i18n**

Mudanças em `src/App.tsx` (o fluxo/estado de blobs e URLs permanece idêntico):

1. Imports novos:

```tsx
import { useLocale } from './i18n/locale';
import type { StringKey } from './i18n/strings';
```

2. Dentro de `App()`, primeira linha: `const { locale, t } = useLocale();`

3. Estados de texto viram chaves:

```tsx
const [loadingKey, setLoadingKey] = useState<StringKey>('loadingPreparing');
const [errorKey, setErrorKey] = useState<StringKey | null>(null);
```

(remover `loadingLabel` e `error` antigos; atualizar todos os set correspondentes)

4. Em `handleImage`, o callback de progresso e o catch:

```tsx
setLoadingKey('loadingPreparing');
setErrorKey(null);
// ...
const blob = await removeBackground(file, (p, phase) => {
  setProgress(p);
  setLoadingKey(phase === 'download' ? 'loadingDownloading' : 'loadingRemoving');
});
setProgress(1);
setLoadingKey('loadingDone');
// ...
} catch (e) {
  console.error(e);
  setErrorKey('errorGeneric');
  setStatus('error');
}
```

5. Header (marca + idioma + tema):

```tsx
<header className="border-b border-border">
  <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
    <div className="flex items-center gap-2">
      <Logo className="h-7 w-7" />
      <span className="font-semibold">{t('appName')}</span>
    </div>
    <div className="flex items-center gap-3">
      {locale === 'pt' ? (
        <a
          href="/en/"
          aria-label="Read this page in English"
          className="text-sm text-muted hover:text-foreground"
        >
          EN
        </a>
      ) : (
        <a
          href="/"
          aria-label="Ler esta página em português"
          className="text-sm text-muted hover:text-foreground"
        >
          PT
        </a>
      )}
      <ThemeToggle />
    </div>
  </div>
</header>
```

6. O parágrafo introdutório vira h1 + subtítulo:

```tsx
<h1 className="mb-1 text-xl font-semibold">{t('h1')}</h1>
<p className="mb-6 text-sm text-muted">{t('intro')}</p>
```

7. Demais textos: `<AiLoader progress={progress} label={t(loadingKey)} />`;
   erro `<p className="mb-3 text-red-500">{errorKey && t(errorKey)}</p>`; botões
   `{t('tryAgain')}`, `{t('refineCutout')}`, `{t('revertToAi')}`, `{t('newImage')}`;
   download `fileName={t('downloadFileName')}`; footer `{t('footerTagline')}`.

- [ ] **Step 3: Rodar tudo**

Run: `npm test`
Expected: PASS — testes PT antigos continuam (default é pt) + teste EN novo.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: shell SemFundo com h1, toggle PT|EN e strings via t()

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Componentes restantes via t()

**Files:**
- Modify: `src/components/BeforeAfter.tsx`, `src/components/BackgroundPicker.tsx`, `src/components/DownloadButton.tsx`, `src/components/ThemeToggle.tsx`, `src/components/RefineEditor.tsx`
- Test: os existentes continuam passando sem alteração (strings PT idênticas).

**Interfaces:**
- Consumes: `useLocale()` (Task 1).
- Produces: nenhum contrato novo — mesmas props em todos os componentes.

- [ ] **Step 1: BeforeAfter** — `const { t } = useLocale();`; `Original` → `{t('original')}` (figcaption e `alt`), `Sem fundo` → `{t('cutout')}` (figcaption e `alt`).

- [ ] **Step 2: BackgroundPicker** — presets deixam de ter label fixo:

```tsx
import { useLocale } from '../i18n/locale';
import type { StringKey } from '../i18n/strings';

const PRESETS: { key: StringKey; color: string | null }[] = [
  { key: 'bgTransparent', color: null },
  { key: 'bgWhite', color: '#ffffff' },
  { key: 'bgBlack', color: '#000000' },
];
```

No JSX: `key={preset.key}`, texto `{t(preset.key)}`; `Fundo:` → `{t('bgLabel')}`;
`Cor:` → `{t('bgCustom')}`; `aria-label="Cor personalizada"` → `aria-label={t('bgCustomAria')}`.

- [ ] **Step 3: DownloadButton** — erro vira chave:

```tsx
const { t } = useLocale();
const [failed, setFailed] = useState(false);
// no catch: console.error(e); setFailed(true);
// botão: {t('downloadPng')}
// {failed && <p className="mt-1 text-sm text-red-500">{t('downloadError')}</p>}
```

- [ ] **Step 4: ThemeToggle** — opções com chave:

```tsx
const OPTIONS: { value: Theme; key: StringKey; icon: string }[] = [
  { value: 'light', key: 'themeLight', icon: '☀️' },
  { value: 'dark', key: 'themeDark', icon: '🌙' },
  { value: 'system', key: 'themeSystem', icon: '🖥️' },
];
// aria-label={t('themeGroup')} no group; aria-label={t(opt.key)} nos botões
```

- [ ] **Step 5: RefineEditor** — botões/labels via t() (`refineRestore`, `refineErase`, `refineBrush`, `refineBrushAria`, `refineUndo`, `refineRedo`, `revertToAi`, `refineHint`, `refineApply`, `refineCancel`). Erros de tela viram chaves fixas nos catch (os `throw new Error(...)` internos dos helpers ficam como estão, só para console):

```tsx
const [errorKey, setErrorKey] = useState<StringKey | null>(null);
// init catch:        console.error(e); setErrorKey('refinePrepareError');
// handleRevert catch: setErrorKey('refineRevertError');
// handleApply catch:  console.error(e); setErrorKey('refineExportError');
// render: {errorKey && <p className="text-sm text-red-500">{t(errorKey)}</p>}
// handleApply começa com setErrorKey(null);
```

- [ ] **Step 6: Rodar tudo**

Run: `npm test`
Expected: PASS — todos os textos PT renderizados são idênticos aos de hoje.

- [ ] **Step 7: Commit**

```bash
git add src/components
git commit -m "feat: componentes restantes traduzidos via t()

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: LangHint — aviso discreto de idioma alternativo

**Files:**
- Create: `src/components/LangHint.tsx`
- Modify: `src/App.tsx` (renderizar logo acima do `<h1>`)
- Test: `src/components/LangHint.test.tsx`

**Interfaces:**
- Consumes: `useLocale()` (Task 1).
- Produces: `<LangHint />` sem props. Persistência: `localStorage['langHintDismissed'] = '1'`.

- [ ] **Step 1: Teste (falhando)**

```tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangHint } from './LangHint';
import { LocaleProvider } from '../i18n/locale';

function mockLanguage(value: string) {
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(value);
}

describe('LangHint', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('na página pt com navegador en, sugere a versão em inglês', () => {
    mockLanguage('en-US');
    render(<LangHint />);
    const link = screen.getByRole('link', { name: /available in english/i });
    expect(link).toHaveAttribute('href', '/en/');
  });

  it('na página pt com navegador pt, não mostra nada', () => {
    mockLanguage('pt-BR');
    const { container } = render(<LangHint />);
    expect(container).toBeEmptyDOMElement();
  });

  it('na página en com navegador pt, sugere a versão em português', () => {
    mockLanguage('pt-BR');
    render(
      <LocaleProvider locale="en">
        <LangHint />
      </LocaleProvider>,
    );
    expect(
      screen.getByRole('link', { name: /existe em português/i }),
    ).toHaveAttribute('href', '/');
  });

  it('dispensar persiste e esconde', () => {
    mockLanguage('en-US');
    render(<LangHint />);
    fireEvent.click(screen.getByRole('button'));
    expect(localStorage.getItem('langHintDismissed')).toBe('1');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/components/LangHint.test.tsx` — Expected: FAIL (módulo não existe).

- [ ] **Step 2: Implementar**

```tsx
import { useState } from 'react';
import { useLocale } from '../i18n/locale';

const DISMISS_KEY = 'langHintDismissed';

/**
 * Sugestão cruzada de idioma: o texto é sempre no idioma da página de destino
 * (por isso não passa pelo t() da página atual). Sem redirect automático.
 */
export function LangHint() {
  const { locale } = useLocale();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  );
  const browserIsPt = navigator.language.toLowerCase().startsWith('pt');
  const show = !dismissed && (locale === 'pt' ? !browserIsPt : browserIsPt);
  if (!show) return null;

  const href = locale === 'pt' ? '/en/' : '/';
  const text =
    locale === 'pt'
      ? 'This page is also available in English'
      : 'Esta página também existe em português';
  const dismissLabel = locale === 'pt' ? 'Dismiss' : 'Dispensar';

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
      <a href={href} className="underline hover:text-foreground">
        {text} →
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label={dismissLabel}
        className="text-muted hover:text-foreground"
      >
        ×
      </button>
    </div>
  );
}
```

No `src/App.tsx`, dentro de `<main>`, antes do `<h1>`: `<LangHint />` (+ import).

- [ ] **Step 3: Rodar tudo + commit**

Run: `npm test` — Expected: PASS.

```bash
git add src/components/LangHint.tsx src/components/LangHint.test.tsx src/App.tsx
git commit -m "feat: aviso discreto de idioma alternativo (LangHint)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Build multi-página + heads SEO completos + robots/sitemap

**Files:**
- Modify: `index.html` (head PT completo), `vite.config.ts`
- Create: `en/index.html`, `public/robots.txt`, `public/sitemap.xml`
- Test: verificação pós-build (comandos abaixo).

**Interfaces:**
- Consumes: `detectLocale` já lê o pathname (Task 1) — a página `/en/` ativa o EN sozinha.
- Produces: `dist/index.html` e `dist/en/index.html`; URLs canônicas `https://semfundo.app/` e `https://semfundo.app/en/`; `public/og.png` é REFERENCIADO aqui e criado na Task 11.

- [ ] **Step 1: `vite.config.ts` multi-página**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  appType: 'mpa',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        en: 'en/index.html',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 2: Head PT completo em `index.html`**

Substituir o `<head>` atual por (mantendo o script anti-flash exatamente como está):

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Remover Fundo de Imagem Grátis e Privado | SemFundo</title>
  <meta name="description" content="Remova o fundo de qualquer imagem em segundos, grátis e sem enviar nada para servidores: a IA roda 100% no seu navegador. Sem cadastro, sem marca d'água." />
  <link rel="canonical" href="https://semfundo.app/" />
  <link rel="alternate" hreflang="pt-BR" href="https://semfundo.app/" />
  <link rel="alternate" hreflang="en" href="https://semfundo.app/en/" />
  <link rel="alternate" hreflang="x-default" href="https://semfundo.app/en/" />
  <link rel="icon" type="image/svg+xml" href="/logo.svg" />
  <meta name="theme-color" content="#6366f1" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="SemFundo" />
  <meta property="og:url" content="https://semfundo.app/" />
  <meta property="og:title" content="SemFundo — Remova o fundo de imagens grátis, direto no navegador" />
  <meta property="og:description" content="Grátis, sem cadastro e privado: a IA roda 100% no seu navegador. Nada é enviado para servidor." />
  <meta property="og:image" content="https://semfundo.app/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SemFundo — Remova o fundo de imagens grátis, direto no navegador" />
  <meta name="twitter:description" content="Grátis, sem cadastro e privado: a IA roda 100% no seu navegador." />
  <meta name="twitter:image" content="https://semfundo.app/og.png" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "SemFundo",
    "url": "https://semfundo.app/",
    "description": "Removedor de fundo de imagens grátis e privado: a IA roda 100% no seu navegador.",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Any (web browser)",
    "inLanguage": "pt-BR",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "O SemFundo é grátis mesmo?", "acceptedAnswer": { "@type": "Answer", "text": "Sim. Sem cadastro, sem marca d'água e sem limite de resolução. O projeto é de código aberto e custa quase nada para operar — por isso consegue ser grátis." } },
      { "@type": "Question", "name": "Minhas imagens são enviadas para algum servidor?", "acceptedAnswer": { "@type": "Answer", "text": "Não. A inteligência artificial roda dentro do seu navegador, no seu dispositivo. A imagem nunca sai do seu computador ou celular — você pode conferir no código, que é aberto." } },
      { "@type": "Question", "name": "Por que a primeira remoção demora mais?", "acceptedAnswer": { "@type": "Answer", "text": "Na primeira vez, o navegador baixa o modelo de IA (~40 MB) e o guarda em cache. Das próximas vezes, o processo começa na hora." } },
      { "@type": "Question", "name": "Quais formatos são aceitos?", "acceptedAnswer": { "@type": "Answer", "text": "PNG, JPG e WebP. O resultado é baixado como PNG com fundo transparente — ou com a cor sólida que você escolher." } },
      { "@type": "Question", "name": "Funciona no celular?", "acceptedAnswer": { "@type": "Answer", "text": "Sim. Dá para enviar fotos da galeria, refinar o recorte com o dedo e baixar o resultado." } },
      { "@type": "Question", "name": "Posso usar o resultado comercialmente?", "acceptedAnswer": { "@type": "Answer", "text": "Sim, a imagem gerada é sua. (O código do app é licenciado sob AGPL-3.0, mas isso não afeta as suas imagens.)" } }
    ]
  }
  </script>
  <script>
    /* script anti-flash do tema: manter o existente byte a byte */
  </script>
</head>
```

- [ ] **Step 3: Criar `en/index.html`**

Cópia estrutural do `index.html` (mesmo `<body>`, mesmo `<script type="module" src="/src/main.tsx">`, mesmo script anti-flash), com `<html lang="en">` e head EN:

```html
<title>Remove Image Background Free & Private | SemFundo</title>
<meta name="description" content="Remove the background from any image in seconds — free, no signup, no watermark. The AI runs 100% in your browser, so your photos never leave your device." />
<link rel="canonical" href="https://semfundo.app/en/" />
<!-- mesmos 3 hreflang da página PT -->
<meta property="og:url" content="https://semfundo.app/en/" />
<meta property="og:title" content="SemFundo — Remove image backgrounds free, right in your browser" />
<meta property="og:description" content="Free, private, no signup: the AI runs 100% in your browser. Nothing is uploaded." />
<meta property="og:locale" content="en_US" />
<!-- twitter:* em inglês; og:image e dimensões iguais -->
```

JSON-LD completos da página EN:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "SemFundo",
  "url": "https://semfundo.app/en/",
  "description": "Free, private background remover: the AI runs 100% in your browser.",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Any (web browser)",
  "inLanguage": "en",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Is SemFundo really free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. No signup, no watermark, no resolution limits. The project is open source and costs almost nothing to run — that's how it stays free." } },
    { "@type": "Question", "name": "Are my images uploaded to a server?", "acceptedAnswer": { "@type": "Answer", "text": "No. The AI runs inside your browser, on your device. Your image never leaves your computer or phone — and you can verify that in the open source code." } },
    { "@type": "Question", "name": "Why is the first removal slower?", "acceptedAnswer": { "@type": "Answer", "text": "On first use, your browser downloads the AI model (~40 MB) and caches it. After that, processing starts right away." } },
    { "@type": "Question", "name": "Which formats are supported?", "acceptedAnswer": { "@type": "Answer", "text": "PNG, JPG and WebP. The result downloads as a PNG with a transparent background — or any solid color you pick." } },
    { "@type": "Question", "name": "Does it work on mobile?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. You can upload photos from your gallery, refine the cutout with your finger and download the result." } },
    { "@type": "Question", "name": "Can I use the result commercially?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, the generated image is yours. (The app code is licensed under AGPL-3.0, which does not affect your images.)" } }
  ]
}
</script>
```

(As respostas são as mesmas strings EN `faq1a`–`faq6a` do dicionário — manter os dois em sincronia se o texto mudar.)

**Atenção:** `src="/src/main.tsx"` com barra inicial (absoluto) — obrigatório para funcionar dentro de `/en/`.

- [ ] **Step 4: `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://semfundo.app/sitemap.xml
```

- [ ] **Step 5: `public/sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://semfundo.app/</loc>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="https://semfundo.app/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://semfundo.app/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://semfundo.app/en/"/>
  </url>
  <url>
    <loc>https://semfundo.app/en/</loc>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="https://semfundo.app/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://semfundo.app/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://semfundo.app/en/"/>
  </url>
</urlset>
```

- [ ] **Step 6: Verificar build e preview**

```bash
npm run build
test -f dist/en/index.html && grep -q 'lang="en"' dist/en/index.html && echo "EN OK"
grep -q 'hreflang="pt-BR"' dist/index.html && echo "HREFLANG OK"
test -f dist/robots.txt && test -f dist/sitemap.xml && echo "SEO FILES OK"
```

Expected: `EN OK`, `HREFLANG OK`, `SEO FILES OK`.

Depois: `npm run preview` e conferir com curl que `/en/` responde 200 com `lang="en"`:

```bash
curl -s http://localhost:4173/en/ | head -3
```

- [ ] **Step 7: `npm test` + commit**

```bash
git add index.html en/index.html vite.config.ts public/robots.txt public/sitemap.xml
git commit -m "feat: build multi-página (/, /en/), meta SEO completa, robots e sitemap

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: LandingContent (como funciona, privacidade, FAQ) + rodapé completo

**Files:**
- Create: `src/components/LandingContent.tsx`
- Modify: `src/App.tsx` (renderizar após o bloco de status; rodapé novo)
- Test: `src/components/LandingContent.test.tsx`

**Interfaces:**
- Consumes: `useLocale()`; chaves `howTitle`…`faq6a` (Task 1).
- Produces: `<LandingContent />` sem props. O conteúdo do FAQ DEVE bater com o JSON-LD `FAQPage` das páginas HTML (Task 6) — mesma fonte: dicionário.

- [ ] **Step 1: Teste (falhando)**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingContent } from './LandingContent';
import { LocaleProvider } from '../i18n/locale';

describe('LandingContent', () => {
  it('renderiza seções e 6 FAQs em pt', () => {
    render(<LandingContent />);
    expect(screen.getByRole('heading', { name: 'Como funciona' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Privacidade de verdade' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Perguntas frequentes' })).toBeInTheDocument();
    expect(screen.getAllByRole('group')).toHaveLength(6); // <details> tem role group
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/leomarzeuski/bg-remover',
    );
  });

  it('renderiza em inglês', () => {
    render(
      <LocaleProvider locale="en">
        <LandingContent />
      </LocaleProvider>,
    );
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByText('Is SemFundo really free?')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/components/LandingContent.test.tsx` — Expected: FAIL.

- [ ] **Step 2: Implementar**

```tsx
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
```

- [ ] **Step 3: Integrar no App**

Em `src/App.tsx`: importar e renderizar `<LandingContent />` como último filho de `<main>` (aparece em todos os estados, abaixo da ferramenta). Substituir o footer por:

```tsx
<footer className="mx-auto max-w-4xl space-y-1 p-6 text-center text-xs text-muted">
  <p>{t('footerTagline')}</p>
  <p>
    <a
      href="https://github.com/leomarzeuski/bg-remover"
      className="underline hover:text-foreground"
    >
      {t('footerOpenSource')}
    </a>
    {' · AGPL-3.0 · '}
    {t('footerAnalytics')}
    {' · '}
    {t('madeBy')}
  </p>
</footer>
```

- [ ] **Step 4: `npm test` (PASS) + commit**

```bash
git add src/components/LandingContent.tsx src/components/LandingContent.test.tsx src/App.tsx
git commit -m "feat: conteúdo de landing (como funciona, privacidade, FAQ) e rodapé completo

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Analytics sem cookies + lazy-load da lib de IA

**Files:**
- Create: `src/lib/track.ts`
- Modify: `package.json` (dep), `src/main.tsx` (inject), `src/App.tsx` (lazy import + evento), `src/components/DownloadButton.tsx` (evento)
- Test: `src/App.test.tsx` e demais continuam passando (o mock de `removeBackground` intercepta também dynamic import).

**Interfaces:**
- Consumes: fluxo do App (Task 3), DownloadButton (Task 4).
- Produces: `track(event: 'process_done' | 'download' | 'sample_used'): void` — usado também pela Task 9.

- [ ] **Step 1: Instalar dependência**

Run: `npm install @vercel/analytics`
Expected: adiciona `@vercel/analytics` em `dependencies`.

- [ ] **Step 2: Criar `src/lib/track.ts`**

```ts
import { track as vercelTrack } from '@vercel/analytics';

export type TrackEvent = 'process_done' | 'download' | 'sample_used';

// Analytics nunca pode quebrar o app (ex.: bloqueadores de script).
export function track(event: TrackEvent) {
  try {
    vercelTrack(event);
  } catch {
    /* noop */
  }
}
```

- [ ] **Step 3: `inject()` no `src/main.tsx`**

Adicionar no topo do arquivo (após os imports existentes):

```tsx
import { inject } from '@vercel/analytics';

inject();
```

- [ ] **Step 4: Lazy import + evento no App**

Em `src/App.tsx`:
- Remover `import { removeBackground } from './lib/removeBackground';`
- Adicionar `import { track } from './lib/track';`
- Em `handleImage`, no lugar da chamada direta:

```tsx
const { removeBackground } = await import('./lib/removeBackground');
const blob = await removeBackground(file, (p, phase) => {
  setProgress(p);
  setLoadingKey(phase === 'download' ? 'loadingDownloading' : 'loadingRemoving');
});
```

- Após `setStatus('done')`: `track('process_done');`

- [ ] **Step 5: Evento no DownloadButton**

Em `handleDownload`, após `URL.revokeObjectURL(url);`: `track('download');` (+ import de `../lib/track`).

- [ ] **Step 6: Rodar testes e medir o bundle**

Run: `npm test`
Expected: PASS — `vi.mock('./lib/removeBackground', ...)` do App.test intercepta o dynamic import igualmente.

```bash
npm run build
ls -lh dist/assets/ | sort -k5 -h
```

Expected: chunk `index-*.js` MENOR que os 289K atuais e um chunk novo separado contendo o código do imgly (carregado só ao processar). Anotar os números no commit.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/track.ts src/main.tsx src/App.tsx src/components/DownloadButton.tsx
git commit -m "feat: analytics sem cookies (Vercel) e lazy-load da lib de IA

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Imagem de exemplo na dropzone

**Files:**
- Create: `public/exemplo.jpg` (asset baixado, ver Step 1)
- Modify: `src/components/ImageDropzone.tsx`
- Test: `src/components/ImageDropzone.test.tsx` (adicionar caso)

**Interfaces:**
- Consumes: `track('sample_used')` (Task 8); `t()` e chaves `sampleButton`/`sampleLoading`/`sampleError` (Task 1).
- Produces: nada novo para outras tasks.

- [ ] **Step 1: Baixar o asset de exemplo (retrato com fundo, licença Unsplash via picsum)**

```bash
curl -L -o public/exemplo.jpg "https://picsum.photos/id/1027/900/1200"
sips -g pixelWidth -g pixelHeight public/exemplo.jpg
ls -lh public/exemplo.jpg
```

Expected: JPEG 900×1200, < 200 KB. Se o id 1027 não existir mais, escolher outro retrato em https://picsum.photos/images (ids 64, 338 e 823 são alternativas com pessoa em destaque). Abrir o arquivo e confirmar visualmente que há um sujeito claro sobre fundo — é o que faz a demo impressionar. Documentar a fonte no README (Task 10).

- [ ] **Step 2: Teste (falhando)**

Adicionar em `src/components/ImageDropzone.test.tsx`:

```tsx
import { vi } from 'vitest';

vi.mock('../lib/track', () => ({ track: vi.fn() }));

it('botão de exemplo busca /exemplo.jpg e chama onImage', async () => {
  const onImage = vi.fn();
  const blob = new Blob(['fake-jpg'], { type: 'image/jpeg' });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(blob, { status: 200 })),
  );
  render(<ImageDropzone onImage={onImage} />);
  fireEvent.click(screen.getByRole('button', { name: /imagem de exemplo/i }));
  await waitFor(() => expect(onImage).toHaveBeenCalled());
  const file = onImage.mock.calls[0][0] as File;
  expect(file.name).toBe('exemplo.jpg');
  expect(file.type).toBe('image/jpeg');
  vi.unstubAllGlobals();
});
```

(adicionar `waitFor` ao import do testing-library no topo do arquivo)

Run: `npx vitest run src/components/ImageDropzone.test.tsx` — Expected: FAIL (botão não existe).

- [ ] **Step 3: Implementar no Dropzone**

Adições em `src/components/ImageDropzone.tsx`:

```tsx
import { track } from '../lib/track';
// estado novo:
const [sampleLoading, setSampleLoading] = useState(false);

async function handleSample() {
  setSampleLoading(true);
  setErrorKey(null);
  try {
    const res = await fetch('/exemplo.jpg');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const file = new File([blob], 'exemplo.jpg', { type: 'image/jpeg' });
    track('sample_used');
    onImage(file);
  } catch (e) {
    console.error(e);
    setErrorKey('sampleError');
  } finally {
    setSampleLoading(false);
  }
}
```

JSX, logo APÓS o fechamento da div da dropzone (fora dela, para o clique não abrir o file picker):

```tsx
<div className="mt-3 text-center">
  <button
    type="button"
    onClick={handleSample}
    disabled={sampleLoading}
    className="text-sm text-muted underline hover:text-foreground disabled:opacity-50"
  >
    {sampleLoading ? t('sampleLoading') : t('sampleButton')}
  </button>
</div>
```

Nota: `setErrorKey('sampleError')` reusa o estado de erro da Task 2 (o tipo já é `StringKey | null`).

- [ ] **Step 4: `npm test` (PASS) + commit**

```bash
git add public/exemplo.jpg src/components/ImageDropzone.tsx src/components/ImageDropzone.test.tsx
git commit -m "feat: botão de imagem de exemplo na dropzone

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: LICENSE AGPL-3.0 + README repaginado

**Files:**
- Create: `LICENSE`
- Modify: `package.json` (campo license), `README.md` (reescrever)

**Interfaces:**
- Consumes: nada.
- Produces: compliance AGPL (obrigação da `@imgly/background-removal`).

- [ ] **Step 1: Baixar o texto oficial**

```bash
curl -sL -o LICENSE https://www.gnu.org/licenses/agpl-3.0.txt
head -3 LICENSE
```

Expected: `GNU AFFERO GENERAL PUBLIC LICENSE / Version 3, 19 November 2007`.

- [ ] **Step 2: `package.json`**

Adicionar após `"version"`: `"license": "AGPL-3.0-only",`

- [ ] **Step 3: Reescrever `README.md`**

```markdown
# SemFundo

**[semfundo.app](https://semfundo.app)** — remova o fundo de imagens grátis,
direto no navegador. Nada é enviado para servidor: a IA roda 100% no seu
dispositivo. Sem cadastro, sem marca d'água, sem limite de resolução.

![Demo](docs/launch/demo.gif)

*Read this in English: the app itself is bilingual — [semfundo.app/en/](https://semfundo.app/en/).*

## Por que outro removedor de fundo?

Porque os grandes enviam sua foto para um servidor. O SemFundo processa tudo
localmente (via [`@imgly/background-removal`](https://github.com/imgly/background-removal-js)
+ ONNX Runtime Web): privacidade verificável — este repositório é o código que
roda no site.

## Recursos

- Arrastar-e-soltar, colar (Ctrl/Cmd+V) ou escolher arquivo (PNG, JPG, WebP)
- Remoção de fundo com IA no navegador, com progresso real
- Pincel de refino (restaurar/apagar) com desfazer/refazer
- Fundo transparente ou cor sólida; download em PNG na resolução original
- Tema claro/escuro, PT-BR e inglês (`/en/`)

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173 (EN em /en/index.html)
npm test         # vitest
npm run build    # gera dist/ estático (páginas / e /en/)
```

> Na primeira remoção, o modelo de IA (~40 MB) é baixado da CDN da imgly e
> fica em cache do navegador. A imagem processada nunca sai do dispositivo.

## Stack

Vite 7 · React 19 · TypeScript · Tailwind 4 · Vitest · Vercel (estático)

## Licença

[AGPL-3.0](./LICENSE). Usa `@imgly/background-removal` (AGPL-3.0) — por isso
este repositório é público e o app linka o código no rodapé. As imagens que
você processa são suas; a licença cobre só o código.

Imagem de exemplo: [picsum.photos](https://picsum.photos) (fotos do Unsplash).
```

- [ ] **Step 4: `npm test` (PASS — nada de código mudou) + commit**

```bash
git add LICENSE package.json README.md
git commit -m "docs: LICENSE AGPL-3.0 e README repaginado para o lançamento

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Kit de divulgação — OG image e posts

**Files:**
- Create: `docs/launch/og.html`, `public/og.png` (screenshot do og.html), `docs/launch/tabnews.md`, `docs/launch/product-hunt.md`, `docs/launch/reddit.md`, `docs/launch/linkedin-x.md`, `docs/launch/roteiro.md`

**Interfaces:**
- Consumes: identidade/copys das tasks anteriores; `public/og.png` já é referenciado pelos heads da Task 6.
- Produces: assets e textos prontos para o Leo publicar.

- [ ] **Step 1: Criar `docs/launch/og.html` (arte 1200×630)**

```html
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    font-family: -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: #0b0f19; color: #e5e7eb;
    display: flex; align-items: center; justify-content: space-between;
    padding: 72px;
  }
  .left { max-width: 640px; }
  .brand { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
  .brand span { font-size: 44px; font-weight: 700; }
  h1 { font-size: 58px; line-height: 1.15; font-weight: 700; }
  h1 em {
    font-style: normal;
    background: linear-gradient(90deg, #a78bfa, #6366f1);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  p { margin-top: 24px; font-size: 26px; color: #94a3b8; }
  .card {
    width: 320px; height: 400px; border-radius: 32px;
    border: 1px solid #24304a;
    background:
      linear-gradient(45deg, #1e293b 25%, transparent 25%),
      linear-gradient(-45deg, #1e293b 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #1e293b 75%),
      linear-gradient(-45deg, transparent 75%, #1e293b 75%);
    background-size: 40px 40px;
    background-position: 0 0, 0 20px, 20px -20px, -20px 0;
    background-color: #0f172a;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .subject {
    width: 240px; height: 300px;
    background: linear-gradient(160deg, #a78bfa, #6366f1);
    border-radius: 120px 120px 0 0;
  }
</style>
</head>
<body>
  <div class="left">
    <div class="brand">
      <svg width="56" height="56" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="17" fill="#1e293b"/><circle cx="32" cy="27" r="8.5" fill="url(#g)"/><path d="M14 56 c0-11 8-17 18-17 s18 6 18 17 z" fill="url(#g)"/></svg>
      <span>SemFundo</span>
    </div>
    <h1>Remova o fundo de imagens <em>sem enviar nada</em> pra servidor</h1>
    <p>Grátis · sem cadastro · a IA roda no seu navegador</p>
  </div>
  <div class="card"><div class="subject"></div></div>
</body>
</html>
```

- [ ] **Step 2: Gerar `public/og.png`**

Com as ferramentas de navegador (Claude in Chrome): abrir `file://…/docs/launch/og.html`, janela 1200×630, capturar screenshot e salvar como `public/og.png`. Verificar:

```bash
sips -g pixelWidth -g pixelHeight public/og.png
```

Expected: `pixelWidth: 1200 / pixelHeight: 630`. (Se a captura sair com devicePixelRatio 2×, redimensionar: `sips -z 630 1200 public/og.png`.)

- [ ] **Step 3: Escrever os posts (arquivos completos)**

`docs/launch/tabnews.md` — título: *"Fiz um removedor de fundo de imagens que roda 100% no navegador (nada sobe pra servidor)"*. Corpo (~200 palavras): história (por que fiz), como funciona tecnicamente (`@imgly/background-removal` + ONNX WASM no browser, modelo ~40MB em cache), o diferencial (privacidade verificável, código aberto AGPL, grátis sem limite), link `https://semfundo.app` + link do repo, pergunta final pedindo feedback técnico.

`docs/launch/product-hunt.md` — Name: `SemFundo`; Tagline: `Remove image backgrounds — 100% in your browser`; Description (260 chars): `Free background remover where the AI runs entirely in your browser. Your photo never touches a server — verifiable, because it's open source. No signup, no watermark, no resolution limits. PT-BR & English.`; First comment do maker: história curta (3 parágrafos: problema/privacidade, como funciona, pedido de feedback).

`docs/launch/reddit.md` — r/InternetIsBeautiful título: `A background remover that runs entirely in your browser — your image never leaves your device`; r/SideProject título: `I built an open-source background remover with zero servers — feedback welcome`. Corpos de 3-5 frases cada, tom pessoal, sem marketing agressivo (regras dos subs), link + repo.

`docs/launch/linkedin-x.md` — LinkedIn PT (1 parágrafo pessoal + 3 bullets + link); X/Twitter: thread de 3 tweets PT e 3 EN (1: o que é + demo.gif; 2: como funciona/privacidade; 3: open source + link).

- [ ] **Step 4: `docs/launch/roteiro.md`**

Conteúdo: ordem de publicação — (1) TabNews numa manhã de dia útil BR, responder todo comentário; (2) Reddit r/SideProject no mesmo dia, r/InternetIsBeautiful no dia seguinte; (3) Product Hunt: submeter para terça/quarta 00:01 PT com og.png + demo.gif + 3 screenshots; (4) LinkedIn/X quando o PH estiver no ar; (5) monitorar Vercel Analytics diariamente na primeira semana (pageviews, process_done, download) e anotar aprendizados no próprio arquivo.

- [ ] **Step 5: Commit**

```bash
git add docs/launch public/og.png
git commit -m "docs: kit de divulgação (og image, posts TabNews/PH/Reddit/LinkedIn/X, roteiro)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Verificação final, deploy, domínio (GATE do usuário) e demo.gif

**Files:**
- Create: `docs/launch/demo.gif` (gravação)
- Modify: nenhum código previsto (correções pequenas se a validação mobile apontar).

**Interfaces:**
- Consumes: tudo anterior.
- Produces: produto no ar em `https://semfundo.app` + critérios de aceite do spec verificados.

- [ ] **Step 1: Suíte e build finais**

```bash
npm test && npm run build
```

Expected: tudo verde.

- [ ] **Step 2: Deploy de preview e validação funcional**

```bash
vercel deploy
```

No URL de preview, via browser: fluxo completo PT (exemplo → resultado → trocar fundo → refinar → baixar) e o mesmo em `/en/`. Conferir `view-source` dos dois HTMLs (meta/hreflang/JSON-LD).

- [ ] **Step 3: Validação mobile**

Janela 390×844 (browser tools): dropzone, botão de exemplo, pincel de refino por toque, download. Registrar problemas; consertar os pequenos, anotar os grandes como fase 2.

- [ ] **Step 4: GATE — compra do domínio (ação do Leo)**

Pausar e pedir ao Leo (AskUserQuestion): comprar `semfundo.app` (US$ 9,99/ano) em https://vercel.com/domains/search?q=semfundo.app ou `vercel domains buy semfundo.app`. Só prosseguir após confirmação.

- [ ] **Step 5: Apontar domínio + produção**

```bash
vercel domains ls          # confirma a compra
vercel domains add semfundo.app   # adiciona ao projeto linkado (ou via dashboard: Project → Settings → Domains)
vercel --prod
```

Habilitar Web Analytics no dashboard (Project → Analytics → Enable) — Leo ou eu via navegador.

- [ ] **Step 6: Gravar demo.gif no domínio real**

Com gif_creator (browser tools): gravar `https://semfundo.app` — colar/escolher exemplo → loader → resultado → trocar cor de fundo → baixar. Salvar como `docs/launch/demo.gif`. Na mesma sessão, capturar 3 screenshots (dropzone, resultado antes/depois, editor de refino) em `docs/launch/screenshot-{1,2,3}.png` para o Product Hunt. Commitar:

```bash
git add docs/launch/demo.gif docs/launch/screenshot-*.png
git commit -m "docs: demo.gif do fluxo completo no domínio de produção

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Checklist de aceite do spec**

- [ ] `https://semfundo.app/` (PT) e `/en/` (EN) respondem 200 com meta corretas
- [ ] https://search.google.com/test/rich-results passa (WebApplication + FAQPage)
- [ ] https://www.opengraph.xyz com semfundo.app mostra og.png
- [ ] Fluxo exemplo→download OK em desktop e mobile
- [ ] Vercel Analytics registrando pageviews (custom events são best-effort — podem exigir plano pago; pageviews bastam para o aceite)
- [ ] LICENSE no repo; rodapé com GitHub/AGPL
- [ ] `docs/launch/` completo
- [ ] Submeter sitemap no Google Search Console (Leo: propriedade semfundo.app)

- [ ] **Step 8: Merge**

Usar a skill superpowers:finishing-a-development-branch para fechar `feat/lancamento-semfundo` (merge em master + push).

---

## Fora do plano (fase 2 — não implementar agora)

PWA/offline, self-host do modelo, tuning profundo de CWV, modelo de maior qualidade opt-in, lote de imagens, monetização leve. Guiar pelos dados do analytics após o lançamento.
