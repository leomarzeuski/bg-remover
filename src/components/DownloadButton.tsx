import { useState } from 'react';
import { composeBackground } from '../lib/composeBackground';

interface Props {
  cutout: Blob;
  bgColor: string | null;
  fileName: string;
}

export function DownloadButton({ cutout, bgColor, fileName }: Props) {
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloadError(null);
    try {
      const blob = await composeBackground(cutout, bgColor);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setDownloadError('Erro ao gerar o arquivo para download. Tente novamente.');
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Baixar PNG
      </button>
      {downloadError && (
        <p className="mt-1 text-sm text-red-600">{downloadError}</p>
      )}
    </div>
  );
}
