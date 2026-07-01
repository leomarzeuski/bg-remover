> **Onde postar:** https://www.tabnews.com.br/ → "Criar conteúdo". Colar o título e o corpo abaixo tal como estão (Markdown).

## Título

Fiz um removedor de fundo de imagens que roda 100% no navegador (nada sobe pra servidor)

## Corpo

Sempre que eu precisava tirar o fundo de uma foto rápido, esbarrava no mesmo problema: os removedores "grátis" sobem sua imagem pra um servidor, e só na hora de baixar você descobre o limite de resolução ou a marca d'água escondida. Resolvi resolver isso pra mim mesmo e acabei publicando: o SemFundo.

A remoção de fundo roda inteiramente no navegador. Uso o `@imgly/background-removal`, que executa um modelo de segmentação via ONNX Runtime Web (WASM) direto no browser — não existe backend recebendo a imagem. Na primeira execução, o navegador baixa ~40MB de modelo e guarda em cache; das próximas vezes em diante, cada imagem processa em ~1-2s, sem round-trip nenhum pra internet.

Como não tem servidor no meio, a privacidade não depende de eu prometer nada: é só ler o código, que é público e AGPL. O app é grátis de verdade — sem cadastro, sem marca d'água, sem limite de resolução. Também tem pincel de refino (restaurar/apagar), troca de cor de fundo e interface em PT-BR e inglês.

App: https://semfundo.app
Código: https://github.com/leomarzeuski/bg-remover

É projeto solo e ainda tem bastante estrada pela frente. Quem aqui já mexeu com ONNX Runtime Web / WASM em produção — o que vocês usariam para melhorar performance em imagens grandes? Todo feedback técnico é bem-vindo.
