import { useState } from 'react';
import { ImageDropzone } from './components/ImageDropzone';
import { ProgressBar } from './components/ProgressBar';
import { BeforeAfter } from './components/BeforeAfter';
import { BackgroundPicker } from './components/BackgroundPicker';
import { DownloadButton } from './components/DownloadButton';
import { removeBackground } from './lib/removeBackground';

type Status = 'idle' | 'processing' | 'done' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [cutoutBlob, setCutoutBlob] = useState<Blob | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImage(file: File) {
    setStatus('processing');
    setProgress(0);
    setError(null);
    setBgColor(null);
    setOriginalUrl(URL.createObjectURL(file));
    try {
      const blob = await removeBackground(file, setProgress);
      setCutoutBlob(blob);
      setCutoutUrl(URL.createObjectURL(blob));
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover o fundo.');
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setOriginalUrl(null);
    setCutoutBlob(null);
    setCutoutUrl(null);
    setError(null);
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-3xl font-bold">bg-remover</h1>
      <p className="mb-6 text-sm text-gray-500">
        Remova o fundo das suas imagens direto no navegador. Nada é enviado para
        servidor.
      </p>

      {status === 'idle' && <ImageDropzone onImage={handleImage} />}

      {status === 'processing' && (
        <ProgressBar
          value={progress}
          label="Removendo o fundo… (na primeira vez, baixa o modelo de IA — pode levar um pouco)"
        />
      )}

      {status === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="mb-3 text-red-700">{error}</p>
          <button
            className="rounded bg-red-600 px-4 py-2 text-white"
            onClick={reset}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {status === 'done' && originalUrl && cutoutUrl && cutoutBlob && (
        <div className="space-y-6">
          <BeforeAfter
            originalUrl={originalUrl}
            cutoutUrl={cutoutUrl}
            bgColor={bgColor}
          />
          <BackgroundPicker value={bgColor} onChange={setBgColor} />
          <div className="flex gap-3">
            <DownloadButton
              cutout={cutoutBlob}
              bgColor={bgColor}
              fileName="sem-fundo.png"
            />
            <button className="rounded border px-4 py-2" onClick={reset}>
              Nova imagem
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
