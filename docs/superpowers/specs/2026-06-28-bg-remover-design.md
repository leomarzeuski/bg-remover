# bg-remover — Design

**Data:** 2026-06-28
**Tipo:** App web client-side (roda 100% no navegador)

## Objetivo

Ferramenta web para remover o fundo de imagens (ex.: limpar o fundo de uma
logo) e baixar o resultado como PNG transparente — ou com uma cor de fundo
sólida escolhida pelo usuário. Todo o processamento acontece no navegador,
sem servidor e sem custo por imagem; a imagem nunca sai da máquina do usuário.

## Escopo da primeira versão

Incluído:

- Subir **uma** imagem (PNG, JPG, WebP) por arrastar-e-soltar ou seletor de arquivo.
- Remover o fundo com IA rodando no navegador.
- Comparação **antes/depois** lado a lado, com fundo quadriculado para enxergar a transparência.
- Escolher o fundo do resultado: **transparente** (padrão) ou **cor sólida** (branco, preto ou cor custom).
- Baixar o resultado como PNG.

Fora de escopo (por enquanto):

- Processamento em lote (várias imagens de uma vez).
- Backend, API paga (remove.bg) ou contas/login.
- Edição manual do recorte (pincel/refino de bordas).

## Stack

- **Vite + React 19 + TypeScript** — app estático, sem SSR (segue o padrão do projeto `truckFrontend`).
- **Tailwind CSS 4** — estilização.
- **`@imgly/background-removal`** — modelo de IA que roda no navegador via WASM. Grátis, offline após o primeiro carregamento.
- **Vitest** — testes das funções puras.

## Fluxo do usuário

1. Usuário arrasta/seleciona uma imagem.
2. App valida que é uma imagem suportada.
3. `@imgly/background-removal` processa no browser e gera um **PNG transparente** (o "recorte"). Barra de progresso é exibida.
4. Tela de antes/depois: original à esquerda, recorte à direita sobre fundo quadriculado.
5. Usuário escolhe o fundo (transparente / cor). A troca de cor **não re-processa** a imagem — apenas compõe a cor sob o recorte via `<canvas>`.
6. Usuário baixa o PNG.

## Estados da aplicação

```
idle ──(arquivo válido)──> processing ──(sucesso)──> done
  ^                            │                       │
  │                            └──(falha)──> error     │
  └────────────(nova imagem / reset)────────────────────┘
```

- `idle`: aguardando arquivo.
- `processing`: removendo fundo; mostra progresso (inclui download do modelo na primeira vez).
- `done`: recorte pronto; permite trocar fundo e baixar.
- `error`: falha (arquivo inválido ou erro no processamento); permite tentar de novo.

## Componentes e módulos

Unidades pequenas e isoladas, cada uma com uma responsabilidade clara:

| Arquivo | Responsabilidade | Depende de |
|---|---|---|
| `src/App.tsx` | Orquestra o estado geral (idle/processing/done/error) e conecta os componentes | todos abaixo |
| `src/components/ImageDropzone.tsx` | Arrastar/soltar + clicar para escolher arquivo; valida tipo de imagem | `lib/validateImage` |
| `src/components/BeforeAfter.tsx` | Mostra original × resultado lado a lado, com fundo quadriculado (CSS) | — |
| `src/components/BackgroundPicker.tsx` | UI para escolher fundo: transparente / branco / preto / cor custom | — |
| `src/components/ProgressBar.tsx` | Barra de progresso durante o processamento | — |
| `src/components/DownloadButton.tsx` | Aciona o download do resultado atual | `lib/composeBackground` |
| `src/lib/validateImage.ts` | Função pura: valida tipo/tamanho do arquivo, retorna ok ou mensagem de erro | — |
| `src/lib/removeBackground.ts` | Wrapper de `@imgly/background-removal`; recebe File, reporta progresso, devolve Blob transparente | `@imgly/background-removal` |
| `src/lib/composeBackground.ts` | Função pura: desenha o recorte sobre uma cor de fundo num `<canvas>` e exporta PNG Blob (cor `null` = transparente, devolve o recorte original) | Canvas API |

## Tratamento de erros

- **Arquivo não suportado** → `validateImage` retorna mensagem; UI exibe aviso e permanece em `idle`.
- **Falha no processamento** → `removeBackground` lança erro; App vai para `error` e mostra botão "Tentar de novo".
- **Primeiro carregamento lento** → o modelo (~40MB) é baixado uma vez e fica em cache do navegador. Durante isso, a `ProgressBar` mostra "Baixando modelo de IA (só na primeira vez)".

## Testes

- **`validateImage`** (Vitest): aceita PNG/JPG/WebP; rejeita tipos inválidos e arquivos vazios; mensagens corretas.
- **`composeBackground`** (Vitest): cor `null` devolve o recorte original; com cor, o canvas tem o tamanho certo e o pixel de fundo é a cor escolhida.
- **`removeBackground`** (Vitest, com a lib mockada): testa transição de estados e propagação de progresso/erro — não testa o modelo de IA em si.
- Teste de componente do `ImageDropzone` (React Testing Library) é opcional/desejável.

## Deploy

App estático (build do Vite gera `dist/`). Pode ser hospedado na Vercel/Netlify/GitHub Pages sem backend. Será deixado pronto para `vercel deploy` (sem configuração especial necessária).
