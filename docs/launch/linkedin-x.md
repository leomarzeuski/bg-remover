> **Onde postar:** LinkedIn (post pessoal) e X/Twitter (thread) — publicar depois que o Product Hunt estiver no ar, linkando o post do PH se possível.

## LinkedIn (PT)

Nos últimos meses, usei meu tempo livre pra resolver um incômodo pessoal: todo removedor de fundo "grátis" que eu testava enviava minha foto pra um servidor de algum lugar, e eu nunca sabia direito o que acontecia com ela depois. Resolvi construir o SemFundo — um removedor de fundo de imagens que roda inteiramente no navegador, sem enviar nada pra lugar nenhum.

- A IA roda 100% no seu dispositivo (ONNX Runtime Web), então a imagem nunca sai do navegador
- Grátis de verdade: sem cadastro, sem marca d'água, sem limite de resolução
- Código aberto (AGPL) — dá pra conferir exatamente o que roda por trás, não é só uma promessa

https://semfundo.app

## X/Twitter — thread PT (3 tweets)

**1/3**
Fiz um removedor de fundo de imagens que roda 100% no seu navegador — nenhuma foto sobe pra servidor.
[anexar docs/launch/demo.gif]

**2/3**
Como funciona: a IA (`@imgly/background-removal` + ONNX Runtime Web) processa tudo localmente. O modelo (~40MB) baixa uma vez e fica em cache do navegador; depois disso, cada imagem sai em ~1-2s, sem round-trip pra internet.

**3/3**
É grátis, sem cadastro, e o código é aberto (AGPL) — dá pra auditar em vez de confiar só na minha palavra.
App: https://semfundo.app
Código: https://github.com/leomarzeuski/bg-remover

## X/Twitter — thread EN (3 tweets)

**1/3**
I built a background remover that runs 100% in your browser — no photo ever touches a server.
[attach docs/launch/demo.gif]

**2/3**
How it works: the AI (`@imgly/background-removal` + ONNX Runtime Web) runs entirely client-side. A ~40MB model downloads once and caches locally; after that, each image processes in ~1-2s with no network round-trip.

**3/3**
Free, no signup, and open source (AGPL) so you can verify the privacy claim yourself instead of trusting me.
App: https://semfundo.app
Code: https://github.com/leomarzeuski/bg-remover
