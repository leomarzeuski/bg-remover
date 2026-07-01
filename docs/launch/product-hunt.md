> **Where to post:** https://www.producthunt.com/posts/new — fill in the fields below exactly, then paste the maker's first comment as soon as the post goes live.

## Name

SemFundo

## Tagline

Remove image backgrounds — 100% in your browser

## Description

Free background remover where the AI runs entirely in your browser. Your photo never touches a server — verifiable, because it's open source. No signup, no watermark, no resolution limits. PT-BR & English.

## First comment (maker)

Hey hunters! Maker here.

Every background remover I tried had the same problem: you drop your photo in, and it quietly gets uploaded to someone's server before you get anything back. You have no idea where it goes, how long it's kept, or who else can see it. That bugged me enough to turn it into a real side project: SemFundo.

The whole thing runs client-side. It uses `@imgly/background-removal`, which loads a segmentation model through ONNX Runtime Web (WASM) and runs it right in your browser tab — no backend, no upload, no queue. The first time you use it, a ~40MB model downloads and caches locally; after that, each image processes in about 1-2 seconds, fully offline. Since there's no server in the loop, I can't see your images even if I wanted to — and it's open source (AGPL), so you don't have to take my word for it.

I'm a solo dev and this is very much a nights-and-weekends project, so I'd love your feedback: bugs, rough edges in the UI, features you'd want next. Also curious if anyone here has shipped in-browser ML with ONNX Runtime Web and has performance tips for larger images. Thanks for checking it out!
