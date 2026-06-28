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
