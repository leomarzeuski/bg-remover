# bg-remover — Refino com pincel, tema claro/escuro, nova interface e spinner de IA

**Data:** 2026-07-01
**Tipo:** Evolução do app web client-side (roda 100% no navegador)
**Base:** [2026-06-28-bg-remover-design.md](./2026-06-28-bg-remover-design.md)

## Objetivo

Evoluir o bg-remover com quatro melhorias, mantendo o princípio de rodar 100% no
navegador (nada é enviado a servidor):

1. **Escolher o que fica no recorte** com um **pincel de refino**: depois do recorte
   automático da IA, o usuário pode restaurar partes que sumiram sem querer ou apagar
   partes que sobraram. Se não usar o pincel, vale o resultado automático (o "padrão").
2. **Nova interface** mais cuidada e coesa.
3. **Tema claro/escuro** (com opção "sistema").
4. **Spinner de IA**: uma animação de carregamento com cara de IA durante o processamento.

## Escopo

Incluído:

- Editor de refino por pincel (restaurar/apagar) sobre o recorte automático.
- Reskin geral: shell com cabeçalho e rodapé, cartões, acento em gradiente, estados cuidados.
- Alternância de tema claro / escuro / sistema, persistida e sem flash na carga.
- Componente `AiLoader` (spinner de IA) substituindo a barra crua no estado de processamento.

Fora de escopo (por enquanto):

- Seleção de objeto por clique / modelos maiores (ex.: SAM).
- Bordas suaves/feather no pincel, camadas, histórico infinito.
- Processamento em lote, backend, contas/login.

## 1. Recorte com pincel de refino

O resultado da IA continua sendo o **padrão**. O refino é opcional: na tela de
resultado há um botão **"Refinar recorte"** que abre o editor. Se o usuário não
abrir/aplicar nada, o recorte automático é usado tal como hoje.

### Modelo de dados do editor

O refino trabalha sobre uma **máscara de alpha** aplicada à **imagem original**:

- **Original** — os pixels RGB da imagem enviada (fonte de verdade para "restaurar").
- **Máscara (`alpha`)** — `Uint8ClampedArray` de 1 byte por pixel na resolução de
  trabalho: `255` = mantém (visível), `0` = remove (transparente). Inicializada com o
  canal alpha do recorte da IA.
- **Resolução de trabalho** — `min(maiorLado, 2048)`. Original e máscara são
  redimensionadas para essa resolução, mantendo a edição fluida. O PNG final é composto
  na **resolução cheia** (a máscara é reescalada com interpolação do canvas na exportação).

### Pincel

- Dois modos: **Restaurar** (`value = 255`) e **Apagar** (`value = 0`).
- **Tamanho do pincel** ajustável por slider.
- Ao arrastar, interpola a linha entre os pontos do `pointermove` para não deixar
  buracos em movimentos rápidos.
- **Desfazer** — pilha limitada (até ~12 níveis). Um snapshot da máscara (alpha, 1
  byte/px na resolução de trabalho) é salvo no início de cada traço (`pointerdown`).
- **Reverter para IA** — reinicializa a máscara a partir do alpha do recorte da IA e
  limpa a pilha de desfazer.
- **Aplicar** — exporta o PNG refinado (resolução cheia) e devolve via `onApply(blob)`.
- **Cancelar** — descarta e fecha, mantendo o recorte automático.

### Funções puras (núcleo testável — `src/lib/refine.ts`)

Operam sobre `Uint8ClampedArray` (sem DOM), então rodam em jsdom:

| Função | Assinatura | O que faz |
|---|---|---|
| `extractAlpha` | `(rgba: Uint8ClampedArray) => Uint8ClampedArray` | Copia o canal alpha (cada 4º byte). |
| `paintCircle` | `(alpha, width, height, cx, cy, radius, value) => void` | Seta `alpha = value` nos pixels dentro do círculo. |
| `paintStroke` | `(alpha, width, height, x0, y0, x1, y1, radius, value) => void` | Interpola `paintCircle` ao longo da linha. |
| `composite` | `(rgba, alpha) => Uint8ClampedArray` | Novo RGBA: RGB da original + alpha da máscara. |

O rendering ao vivo pode usar canvas com `globalCompositeOperation = 'destination-in'`
por performance, mas **deve** bater com a saída de `composite`, que é a operação de
referência (e o que os testes cobrem). A exportação final usa `composite` na resolução cheia.

### Partes que tocam o DOM (`src/components/RefineEditor.tsx` + helpers finos)

Não são alvo de teste unitário (thin wrappers da Canvas API):

- Carregar `originalUrl` e `cutoutBlob` → `ImageData` (via `<canvas>`).
- Mapear coordenadas do ponteiro (client → coords do canvas, considerando escala CSS).
- Reescalar a máscara para a resolução cheia e exportar `canvas.toBlob('image/png')`.

### Props do `RefineEditor`

```
originalUrl: string     // pixels da original
cutoutBlob: Blob        // recorte da IA (alpha inicial da máscara)
bgColor: string | null  // fundo do preview (xadrez quando null)
onApply: (blob: Blob) => void
onCancel: () => void
```

### Acessibilidade

O ato de pintar é inerentemente por ponteiro (mouse/touch). Os **controles** (modos,
slider de tamanho, desfazer, reverter, aplicar, cancelar) têm rótulos e são acessíveis
por teclado. Há um texto curto de instrução ("Pinte para restaurar ou apagar").

## 2. Nova interface

- **Shell**: `<header>` com a marca ("bg-remover" + um pequeno mark em gradiente) e o
  `ThemeToggle` à direita; `<main>` centralizado; `<footer>` curto ("100% no navegador,
  nada é enviado").
- **Estilo**: cartões arredondados (`rounded-2xl`), borda e sombra sutis, espaçamento
  generoso e um **acento em gradiente violeta→índigo** (cara de "IA") em botões
  primários, no mark e no anel de progresso.
- **Estados cuidados**: vazio (dropzone herói), processando (`AiLoader`), resultado
  (antes/depois + fundo + refinar/baixar), editor. Responsivo.
- Reaproveita os componentes atuais — apenas reestiliza e adiciona o shell. As cores
  vêm dos tokens semânticos (ver Tema), então cada componente usa `bg-surface`,
  `text-foreground`, `border-border`, `bg-accent` etc. em vez de cores fixas.

## 3. Tema claro/escuro

- **Tokens semânticos** em CSS variables no `index.css`: `--surface`, `--surface-2`,
  `--foreground`, `--muted`, `--border`, `--accent`, `--accent-foreground`. Definidos em
  `:root` (claro) e sobrescritos em `.dark` (escuro), e mapeados no `@theme inline` do
  Tailwind v4 (`--color-surface: var(--surface)` …) para virarem utilitários
  (`bg-surface`, `text-foreground`, …).
- **Variante dark** via classe: `@custom-variant dark (&:where(.dark, .dark *));` e a
  classe `.dark` no `<html>`.
- **`hooks/useTheme.ts`**: `theme: 'light' | 'dark' | 'system'` (default `system`),
  lê/grava em `localStorage`, resolve o efetivo via `matchMedia('(prefers-color-scheme:
  dark)')`, aplica/remove `.dark` no `documentElement` e reage a mudanças do sistema
  quando em `system`. Retorna `{ theme, setTheme, resolved }`.
- **`components/ThemeToggle.tsx`**: alterna claro / escuro / sistema (ícones sol / lua /
  monitor), com `aria-label`.
- **Sem flash (FOUC)**: script inline no `index.html`, antes do app montar, aplica
  `.dark` a partir do `localStorage`/sistema.
- **Xadrez de transparência**: cores do padrão quadriculado passam a vir de CSS vars,
  com valores próprios para claro e escuro.

## 4. Spinner de IA (`components/AiLoader.tsx`)

- Presentacional: props `progress: number` (0..1) e `label: string`.
- Visual: orbe com **gradiente animado** + halo pulsante, **anel de progresso**
  determinado (usa o `progress` real do imgly) e **% no centro**. CSS/SVG puro, sem
  dependências.
- Mantém a semântica de progresso: `role="progressbar"` com `aria-valuenow/min/max`.
- Respeita `prefers-reduced-motion` (reduz/para a animação).
- **Rótulo por fase (best-effort)**: `removeBackground` passa a repassar o "stage" do
  callback do imgly; o `App` escolhe "Baixando modelo de IA… (só na primeira vez)" vs
  "Removendo o fundo…". Se o stage não for confiável, cai num rótulo único amigável.

## Componentes e módulos

Novos e alterados (mantendo unidades pequenas e isoladas):

| Arquivo | Status | Responsabilidade |
|---|---|---|
| `src/lib/refine.ts` | **novo** | Funções puras da máscara: `extractAlpha`, `paintCircle`, `paintStroke`, `composite`. |
| `src/components/RefineEditor.tsx` | **novo** | Editor por pincel (canvas + ponteiro + controles); usa `lib/refine`. |
| `src/hooks/useTheme.ts` | **novo** | Estado/persistência/resolução do tema; aplica `.dark`. |
| `src/components/ThemeToggle.tsx` | **novo** | UI de alternância de tema. |
| `src/components/AiLoader.tsx` | **novo** | Spinner de IA com anel de progresso (substitui a barra crua no `processing`). |
| `src/App.tsx` | alterado | Shell (header/footer), fluxo de refino, `AiLoader`, estado `refinedCutout`, reestilo. |
| `src/index.css` | alterado | Tokens de tema (claro/escuro), `@theme inline`, `@custom-variant dark`, keyframes do spinner, xadrez por tema. |
| `index.html` | alterado | Script anti-flash do tema. |
| `src/lib/removeBackground.ts` | alterado | Repassa o "stage" do progresso (para o rótulo por fase). |
| `src/components/ProgressBar.tsx` | **removido** | Substituído pelo `AiLoader` (era usado só no `processing`). |
| `ImageDropzone` / `BeforeAfter` / `BackgroundPicker` / `DownloadButton` | alterado | Reestilo para os tokens/tema. |

## Estado e fluxo

- Novos campos no `App`: `refinedBlob: Blob | null`, `refinedUrl: string | null`,
  `editing: boolean`.
- **Recorte ativo**: `activeCutout = refinedBlob ?? aiCutoutBlob` e
  `activeCutoutUrl = refinedUrl ?? cutoutUrl`. `BeforeAfter` e `DownloadButton` usam os
  ativos.
- Fluxo do estado `done`:
  - "Refinar recorte" → `editing = true` (mostra `RefineEditor`).
  - `onApply(blob)` → revoga `refinedUrl` anterior, grava `refinedBlob`/`refinedUrl`,
    `editing = false`.
  - `onCancel` → `editing = false`.
  - "Reverter para IA" (na tela de resultado) → limpa `refinedBlob`/`refinedUrl`.
- **Ciclo de object-URLs**: estende o padrão atual — `refinedUrl` é revogado ao aplicar
  novo refino, ao resetar e ao trocar de imagem.

## Estados da aplicação

Sem mudança na máquina principal (`idle → processing → done/error`). O `editing` é um
sub-estado do `done` (o editor abre sobre a tela de resultado e volta ao aplicar/cancelar).

## Tratamento de erros

- **Falha ao exportar o PNG refinado** → mostra aviso no editor e mantém aberto (não
  perde a edição); o usuário pode tentar aplicar de novo ou cancelar.
- **Canvas 2D indisponível** → reaproveita a mensagem já existente ("Canvas 2D não
  disponível neste navegador.").
- Demais erros (upload, processamento) seguem como hoje.

## Testes

- **`lib/refine.ts`** (Vitest, arrays puros):
  - `extractAlpha` devolve o canal alpha correto.
  - `paintCircle` altera só os pixels dentro do raio, com o `value` do modo.
  - `paintStroke` cobre a linha entre dois pontos (sem buracos).
  - `composite` preserva RGB da original e aplica o alpha da máscara.
- **`hooks/useTheme.ts`** (jsdom, com `matchMedia` e `localStorage` mockados): default
  `system`; `setTheme` persiste e alterna a classe `.dark`; reage a mudança do sistema.
- **`AiLoader`** (RTL): expõe `role="progressbar"` com `aria-valuenow` derivado de
  `progress` e mostra o %.
- **Existentes**: ajustar `removeBackground.test.ts` à nova assinatura de progresso
  (`stage`); ajustar `App.test.tsx` (novo shell, sem `ProgressBar`), `ImageDropzone.test.tsx`
  e `BackgroundPicker.test.tsx` ao novo markup, mantendo rótulos estáveis para minimizar
  churn. `RefineEditor` tem teste de componente leve (renderiza controles; "Aplicar"
  chama `onApply`) — a correção de pixels fica coberta por `lib/refine`.

## Não-objetivos / YAGNI

Sem seleção por clique/SAM, sem feather, sem camadas, sem histórico infinito, sem
lote/backend. O pincel é hard-edge com anti-alias natural do canvas; a resolução de
trabalho é limitada a 2048px para manter a fluidez.
