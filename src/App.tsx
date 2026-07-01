import { useEffect, useState } from 'react';
import { ImageDropzone } from './components/ImageDropzone';
import { AiLoader } from './components/AiLoader';
import { BeforeAfter } from './components/BeforeAfter';
import { BackgroundPicker } from './components/BackgroundPicker';
import { DownloadButton } from './components/DownloadButton';
import { RefineEditor } from './components/RefineEditor';
import { ThemeToggle } from './components/ThemeToggle';
import { Logo } from './components/Logo';
import { LangHint } from './components/LangHint';
import { removeBackground } from './lib/removeBackground';
import { validateImage } from './lib/validateImage';
import { useLocale } from './i18n/locale';
import type { StringKey } from './i18n/strings';

type Status = 'idle' | 'processing' | 'done' | 'error';

export default function App() {
  const { locale, t } = useLocale();
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [loadingKey, setLoadingKey] = useState<StringKey>('loadingPreparing');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [aiBlob, setAiBlob] = useState<Blob | null>(null);
  const [aiUrl, setAiUrl] = useState<string | null>(null);
  const [refinedBlob, setRefinedBlob] = useState<Blob | null>(null);
  const [refinedUrl, setRefinedUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [errorKey, setErrorKey] = useState<StringKey | null>(null);

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
    setLoadingKey('loadingPreparing');
    setErrorKey(null);
    setBgColor(null);
    setEditing(false);
    try {
      const blob = await removeBackground(file, (p, phase) => {
        setProgress(p);
        setLoadingKey(phase === 'download' ? 'loadingDownloading' : 'loadingRemoving');
      });
      // O último evento do imgly (100%) seria agrupado com a troca de tela e
      // não chegaria a pintar — força o 100% e deixa aparecer antes de trocar.
      setProgress(1);
      setLoadingKey('loadingDone');
      await new Promise((resolve) => setTimeout(resolve, 600));
      setAiBlob(blob);
      setAiUrl(URL.createObjectURL(blob));
      setStatus('done');
    } catch (e) {
      console.error(e);
      setErrorKey('errorGeneric');
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
    setErrorKey(null);
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

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (status === 'processing') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file && validateImage(file).ok) {
            e.preventDefault();
            void handleImage(file);
            return;
          }
        }
      }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [status]);

  return (
    <div className="min-h-screen bg-surface text-foreground">
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
                title="Read this page in English"
                className="text-sm text-muted hover:text-foreground"
              >
                EN
              </a>
            ) : (
              <a
                href="/"
                title="Ler esta página em português"
                className="text-sm text-muted hover:text-foreground"
              >
                PT
              </a>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <LangHint />
        <h1 className="mb-1 text-xl font-semibold">{t('h1')}</h1>
        <p className="mb-6 text-sm text-muted">{t('intro')}</p>

        {status === 'idle' && <ImageDropzone onImage={handleImage} />}

        {status === 'processing' && (
          <AiLoader progress={progress} label={t(loadingKey)} />
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4">
            <p className="mb-3 text-red-500">{errorKey && t(errorKey)}</p>
            <button
              className="rounded-lg bg-accent px-4 py-2 text-accent-foreground"
              onClick={reset}
            >
              {t('tryAgain')}
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
                    fileName={t('downloadFileName')}
                  />
                  <button
                    className="rounded-lg border border-border px-4 py-2"
                    onClick={() => setEditing(true)}
                  >
                    {t('refineCutout')}
                  </button>
                  {refinedBlob && (
                    <button
                      className="rounded-lg border border-border px-4 py-2"
                      onClick={revertRefine}
                    >
                      {t('revertToAi')}
                    </button>
                  )}
                  <button
                    className="rounded-lg border border-border px-4 py-2"
                    onClick={reset}
                  >
                    {t('newImage')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-4xl p-6 text-center text-xs text-muted">
        {t('footerTagline')}
      </footer>
    </div>
  );
}
