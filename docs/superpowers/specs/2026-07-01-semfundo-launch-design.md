# SemFundo — Lançamento: domínio, i18n PT/EN, SEO, conversão e kit de divulgação

**Data:** 2026-07-01
**Tipo:** Lançamento como produto (app segue 100% client-side)
**Base:** [2026-07-01-refine-brush-theme-ui-design.md](./2026-07-01-refine-brush-theme-ui-design.md)

## Objetivo

Transformar o bg-remover em produto lançável para **usuários reais** (receita não é
objetivo agora), mantendo o princípio de rodar 100% no navegador:

1. Marca **SemFundo** + domínio **semfundo.app**.
2. Bilíngue: **`/` = PT-BR** e **`/en/` = inglês**, ambas crawleáveis.
3. SEO completo (meta, OG, JSON-LD, sitemap) + conteúdo de landing (como funciona,
   privacidade, FAQ).
4. Conversão: botão "experimentar com imagem de exemplo" + lazy-load da lib de IA.
5. Analytics sem cookies (Vercel Web Analytics) com 3 eventos de funil.
6. Compliance AGPL-3.0 (LICENSE + link de código aberto no rodapé).
7. Kit de divulgação pronto em `docs/launch/`.

## Decisões de produto (contexto)

- **Posicionamento**: utilitário gratuito com privacidade real ("sua imagem nunca sai
  do seu dispositivo"), sem cadastro, sem marca d'água, sem limite de resolução. Não
  competimos em qualidade de modelo com remove.bg/Photoroom — competimos em
  privacidade, gratuidade e atrito zero.
- **Mercado**: PT-BR é o canal natural de divulgação (menos saturado); EN multiplica o
  público. `x-default` do hreflang aponta para `/en/` (buscadores de outros idiomas).
- **Nome/domínio**: SemFundo / semfundo.app (US$ 9,99/ano, disponível em 2026-07-01,
  compra na Vercel). Repo GitHub continua `bg-remover`; projeto Vercel continua.
- **AGPL**: `@imgly/background-removal` é AGPL-3.0. O repo já é público; falta declarar
  a licença do projeto e linkar o código no app. Paywall/código fechado está fora de
  questão sem licença comercial da IMG.LY (não é o caso — produto é grátis).

## Escopo

Incluído: tudo listado no Objetivo.

Fora de escopo (fase 2, guiada pelos dados do analytics):

- PWA/offline e self-host do modelo (hoje vem do CDN da imgly).
- Tuning profundo de Core Web Vitals além do lazy-load.
- Modelo de maior qualidade opt-in (ex.: BiRefNet), lote de imagens, backend, contas,
  monetização (doações/ads).
- SSG/pre-render do conteúdo React (ver Riscos).

## 1. Identidade

- Header: mark em gradiente atual + texto **"SemFundo"** (substitui "bg-remover").
- Tagline sob o header / h1 da página: *"Remova o fundo de imagens grátis — direto no
  navegador"*.
- `<title>`, manifest name e rodapé atualizados para SemFundo.

## 2. Domínio e Vercel

- **Compra (ação do Leo, ~2 min)**: `vercel domains buy semfundo.app` ou dashboard.
- Adicionar `semfundo.app` como domínio de produção do projeto `bg-remover`; os URLs
  `*.vercel.app` continuam funcionando.
- `<link rel="canonical">` em cada página aponta para `https://semfundo.app/` (PT) e
  `https://semfundo.app/en/` (EN) — o Google indexa só o domínio novo.
- Verificar na implementação se `/en` (sem barra) resolve para `/en/` no static da
  Vercel; se não, redirect no `vercel.json`.

## 3. i18n e rotas

**Duas páginas estáticas, um app só** (sem lib de i18n — ~35 strings não justificam):

- Build multi-página do Vite: `rollupOptions.input = { main: index.html, en: en/index.html }`.
  Ambas carregam o mesmo bundle React e o script anti-flash de tema.
- `src/i18n/strings.ts`: `const pt = {...}` e `const en: Record<keyof typeof pt, string>`
  — paridade de chaves garantida pelo compilador.
- `src/i18n/locale.tsx`: contexto + hook `useLocale()` → `{ locale, t }`; locale derivado
  de `location.pathname.startsWith('/en')`.
- Componentes trocam literais por `t('chave')`.
- **`validateImage` passa a retornar códigos** (`'unsupported-type' | 'empty-file'`) em
  vez de mensagens; quem traduz é a UI. Mesmo padrão para erros do `App`.
- **Toggle PT | EN** no header: `<a>` real (crawleável) para a rota irmã.
- **Aviso discreto de idioma** (sem redirect automático — ruim pra SEO e pra usuário):
  se `navigator.language` não bate com a página, linha dismissível "This page is also
  available in English →" / "Esta página também existe em português →"
  (dismiss persistido em `localStorage`).

hreflang em ambas as páginas:

```html
<link rel="alternate" hreflang="pt-BR" href="https://semfundo.app/" />
<link rel="alternate" hreflang="en" href="https://semfundo.app/en/" />
<link rel="alternate" hreflang="x-default" href="https://semfundo.app/en/" />
```

## 4. SEO e conteúdo da landing

### Head estático por página

- **PT** — title: `Remover Fundo de Imagem Grátis e Privado | SemFundo`
  description: `Remova o fundo de qualquer imagem em segundos, grátis e sem enviar
  nada para servidores: a IA roda 100% no seu navegador. Sem cadastro, sem marca
  d'água.`
- **EN** — title: `Remove Image Background Free & Private | SemFundo`
  description: `Remove the background from any image in seconds — free, no signup,
  no watermark. The AI runs 100% in your browser, so your photos never leave your
  device.`
- OG/Twitter card (`summary_large_image`) com `public/og.png` 1200×630 (marca +
  antes/depois, texto mínimo — serve aos dois idiomas; URL absoluta do domínio prod).
- JSON-LD estático no HTML: `WebApplication` (offers price 0) + `FAQPage` (mesmo
  conteúdo do FAQ visível, no idioma da página).
- `public/robots.txt` (allow all + sitemap) e `public/sitemap.xml` (2 URLs com
  alternates hreflang).

### Conteúdo visível (React, via `t()`, abaixo da ferramenta)

Novo componente `src/components/LandingContent.tsx`:

1. **h1** (a página hoje não tem nenhum): o parágrafo introdutório atual vira h1
   estilizado.
2. **Como funciona** — 3 passos (enviar → IA remove o fundo → baixar PNG).
3. **Privacidade de verdade** — parágrafo explicando processamento local + link para o
   GitHub ("confira o código").
4. **FAQ** (6 itens, `<details>/<summary>` nativo; conteúdo espelha o JSON-LD):
   é grátis mesmo? · minhas imagens são enviadas a algum servidor? · por que a
   primeira remoção demora? · quais formatos? · funciona no celular? · posso usar o
   resultado comercialmente?
5. **Rodapé**: `Código aberto (AGPL-3.0) · GitHub · feito por Leo Marzeuski` +
   nota "análise de audiência sem cookies".

## 5. Conversão

- **Imagem de exemplo**: botão secundário na dropzone ("Experimentar com uma imagem de
  exemplo") → `fetch('/exemplo.jpg')` → `File` → mesmo fluxo de `handleImage`. Imagem
  pequena (~150 KB), licença permissiva com fonte documentada no README.
- **Lazy-load da IA**: `removeBackground` importado com `await import(...)` no primeiro
  uso, tirando imgly/onnxruntime do bundle inicial (meta: chunk inicial < 150 KB gzip;
  verificar os chunks reais no build — se o imgly já isolar via dynamic import, apenas
  documentar).
- **Mobile**: validar no navegador o fluxo completo em viewport móvel (upload da
  galeria, pincel touch, download). Consertos pequenos entram; grandes viram fase 2.

## 6. Analytics (Vercel Web Analytics)

- `@vercel/analytics` com `inject()` no `main.tsx`; habilitar Web Analytics no projeto
  (dashboard). Sem cookies, agregado, compatível com LGPD/GDPR — não contradiz o
  discurso de privacidade (nada sobre a imagem é coletado).
- Eventos custom (funil mínimo): `process_done`, `download`, `sample_used`.
- Verificar quota do plano hobby na implementação; se apertar, manter só pageviews +
  `process_done`.

## 7. Compliance AGPL

- `LICENSE` (texto integral AGPL-3.0) na raiz + `"license": "AGPL-3.0-only"` no
  `package.json`.
- README: seção de licença citando `@imgly/background-removal` (AGPL) e o link do
  código.
- Rodapé do app linka o GitHub (satisfaz a oferta de código na interface).

## 8. Kit de divulgação (`docs/launch/`)

- `tabnews.md` (PT, tom de comunidade dev: história técnica + link) — primeiro post,
  feedback BR.
- `product-hunt.md` (EN: tagline, descrição, primeiro comentário do maker).
- `reddit.md` (EN, 2 variantes: r/InternetIsBeautiful e r/SideProject).
- `linkedin.md` (PT) e `x-thread.md` (PT+EN).
- `roteiro.md`: ordem e timing sugeridos de publicação.
- Assets: `public/og.png` (reusado nos posts) + `demo.gif` (gravação do fluxo: colar
  imagem → processar → trocar fundo → baixar) + screenshots para o README repaginado.
- Publicação é sempre ação do Leo (posso acompanhar pelo navegador).

## Componentes e módulos

| Arquivo | Status | Responsabilidade |
|---|---|---|
| `src/i18n/strings.ts` | **novo** | Dicionário pt/en tipado (paridade por tipo). |
| `src/i18n/locale.tsx` | **novo** | Provider/hook `useLocale()` → `{ locale, t }`. |
| `src/components/LandingContent.tsx` | **novo** | Como funciona, privacidade, FAQ, via `t()`. |
| `src/components/LangHint.tsx` | **novo** | Aviso dismissível de idioma alternativo. |
| `en/index.html` | **novo** | Entry EN (lang, meta, JSON-LD em inglês). |
| `index.html` | alterado | Meta completa PT, canonical, hreflang, JSON-LD. |
| `vite.config.ts` | alterado | Build multi-página. |
| `src/lib/validateImage.ts` | alterado | Retorna códigos de erro, não mensagens. |
| `src/App.tsx` | alterado | Provider de locale, h1/landing, fluxo do exemplo, lazy import, analytics, header SemFundo + toggle PT/EN. |
| `src/components/ImageDropzone.tsx` | alterado | Strings via `t()`, botão de exemplo. |
| Demais componentes | alterado | Literais → `t()`. |
| `public/robots.txt`, `public/sitemap.xml`, `public/og.png`, `public/exemplo.jpg` | **novos** | SEO/conversão. |
| `LICENSE` | **novo** | AGPL-3.0. |
| `docs/launch/*` | **novos** | Kit de divulgação. |
| `package.json` | alterado | `@vercel/analytics`, campo `license`. |

## Testes

- `strings.ts`: paridade de chaves pt/en (o compilador já garante; teste runtime cobre
  valores não vazios).
- `locale`: `/` → pt, `/en/` e `/en` → en.
- `validateImage`: novos códigos de erro.
- `LandingContent`: renderiza seções e FAQ em pt e en.
- `ImageDropzone`: botão de exemplo produz `File` válido e chama `onImage` (fetch
  mockado).
- Existentes: seguem passando com PT default (jsdom usa pathname `/`).
- Pós-build (verificação manual/CI): `dist/en/index.html` existe com `lang="en"`.

## Critérios de aceite (lançável)

1. `https://semfundo.app/` (PT) e `https://semfundo.app/en/` (EN) no ar.
2. Rich Results Test passa (WebApplication + FAQPage); OG validando em validador.
3. Fluxo exemplo → resultado → download funciona em desktop e mobile.
4. Analytics registrando pageviews e eventos de funil.
5. `LICENSE` no repo e rodapé com link de código aberto.
6. `docs/launch/` completo (posts + og.png + demo.gif + README novo).
7. Suíte de testes passando (35+).

## Ordem de execução

1. Código (i18n, SEO, conteúdo, exemplo, analytics, LICENSE) → preview Vercel → revisão
   do Leo.
2. Compra do domínio (Leo) + apontamento no projeto.
3. Deploy de produção + validação dos critérios de aceite.
4. Kit de divulgação final (GIF gravado no domínio real) → publicar juntos.

## Riscos e mitigações

- **Conteúdo React e SEO**: Google renderiza JS e indexa; Bing é mais fraco nisso.
  Mitigação: meta + JSON-LD estáticos no HTML carregam o essencial. SSG/pre-render só
  na fase 2 se o Search Console mostrar problema.
- **OG hardcoded no domínio prod**: previews mostram OG de produção — aceitável.
- **Dependência do CDN da imgly para o modelo**: já é assim hoje; self-host fica para a
  fase 2 (também habilita offline).
- **SEO demora meses**: tráfego inicial vem dos posts de lançamento; SEO é semente.
