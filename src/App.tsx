import { useState } from 'react';
import { ImageDropzone } from './components/ImageDropzone';
import { AiLoader } from './components/AiLoader';
import { BeforeAfter } from './components/BeforeAfter';
import { BackgroundPicker } from './components/BackgroundPicker';
import { DownloadButton } from './components/DownloadButton';
import { RefineEditor } from './components/RefineEditor';
import { ThemeToggle } from './components/ThemeToggle';
import { removeBackground } from './lib/removeBackground';

type Status = 'idle' | 'processing' | 'done' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState('Preparando…');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [aiBlob, setAiBlob] = useState<Blob | null>(null);
  const [aiUrl, setAiUrl] = useState<string | null>(null);
  const [refinedBlob, setRefinedBlob] = useState<Blob | null>(null);
  const [refinedUrl, setRefinedUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeBlob = refinedBlob ?? aiBlob;
  const activeUrl = refinedUrl ?? aiUrl;

  async function handleImage(file: File) {
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAiUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRefinedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRefinedBlob(null);
    setStatus('processing');
    setProgress(0);
    setLoadingLabel('Preparando…');
    setError(null);
    setBgColor(null);
    setEditing(false);
    try {
      const blob = await removeBackground(file, (p, stage) => {
        setProgress(p);
        setLoadingLabel(
          stage && stage.startsWith('fetch')
            ? 'Baixando modelo de IA… (só na primeira vez)'
            : 'Removendo o fundo…',
        );
      });
      setAiBlob(blob);
      setAiUrl(URL.createObjectURL(blob));
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover o fundo.');
      setStatus('error');
    }
  }

  function reset() {
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setAiUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRefinedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setStatus('idle');
    setAiBlob(null);
    setRefinedBlob(null);
    setError(null);
    setBgColor(null);
    setEditing(false);
  }

  function applyRefine(blob: Blob) {
    setRefinedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    setRefinedBlob(blob);
    setEditing(false);
  }

  function revertRefine() {
    setRefinedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRefinedBlob(null);
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span
              className="h-6 w-6 rounded-md bg-linear-to-br from-accent-2 to-accent"
              aria-hidden
            />
            <span className="font-semibold">bg-remover</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <p className="mb-6 text-sm text-muted">
          Remova o fundo das suas imagens direto no navegador. Nada é enviado
          para servidor.
        </p>

        {status === 'idle' && <ImageDropzone onImage={handleImage} />}

        {status === 'processing' && (
          <AiLoader progress={progress} label={loadingLabel} />
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4">
            <p className="mb-3 text-red-500">{error}</p>
            <button
              className="rounded-lg bg-accent px-4 py-2 text-accent-foreground"
              onClick={reset}
            >
              Tentar de novo
            </button>
          </div>
        )}

        {status === 'done' && originalUrl && activeUrl && activeBlob && aiBlob && (
          <div className="space-y-6">
            {editing ? (
              <RefineEditor
                originalUrl={originalUrl}
                cutoutBlob={aiBlob}
                bgColor={bgColor}
                onApply={applyRefine}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <BeforeAfter
                  originalUrl={originalUrl}
                  cutoutUrl={activeUrl}
                  bgColor={bgColor}
                />
                <BackgroundPicker value={bgColor} onChange={setBgColor} />
                <div className="flex flex-wrap gap-3">
                  <DownloadButton
                    cutout={activeBlob}
                    bgColor={bgColor}
                    fileName="sem-fundo.png"
                  />
                  <button
                    className="rounded-lg border border-border px-4 py-2"
                    onClick={() => setEditing(true)}
                  >
                    Refinar recorte
                  </button>
                  {refinedBlob && (
                    <button
                      className="rounded-lg border border-border px-4 py-2"
                      onClick={revertRefine}
                    >
                      Reverter para IA
                    </button>
                  )}
                  <button
                    className="rounded-lg border border-border px-4 py-2"
                    onClick={reset}
                  >
                    Nova imagem
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-4xl p-6 text-center text-xs text-muted">
        100% no navegador · nada é enviado para servidor
      </footer>
    </div>
  );
}
