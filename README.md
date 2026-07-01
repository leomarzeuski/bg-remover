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
