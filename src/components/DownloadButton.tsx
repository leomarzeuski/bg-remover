import { useState } from 'react';
import { composeBackground } from '../lib/composeBackground';
import { track } from '../lib/track';
import { useLocale } from '../i18n/locale';

interface Props {
  cutout: Blob;
  bgColor: string | null;
  fileName: string;
}

export function DownloadButton({ cutout, bgColor, fileName }: Props) {
  const { t } = useLocale();
  const [failed, setFailed] = useState(false);

  async function handleDownload() {
    setFailed(false);
    try {
      const blob = await composeBackground(cutout, bgColor);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      track('download');
    } catch (e) {
      console.error(e);
      setFailed(true);
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        {t('downloadPng')}
      </button>
      {failed && (
        <p className="mt-1 text-sm text-red-500">{t('downloadError')}</p>
      )}
    </div>
  );
}
