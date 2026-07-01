import { useRef, useState } from 'react';
import { validateImage, type ValidationErrorCode } from '../lib/validateImage';
import { useLocale } from '../i18n/locale';
import type { StringKey } from '../i18n/strings';
import { track } from '../lib/track';

interface Props {
  onImage: (file: File) => void;
}

const ERROR_KEY: Record<ValidationErrorCode, StringKey> = {
  'unsupported-type': 'errorUnsupportedType',
  'empty-file': 'errorEmptyFile',
};

export function ImageDropzone({ onImage }: Props) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorKey, setErrorKey] = useState<StringKey | null>(null);
  const [dragging, setDragging] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const result = validateImage(file);
    if (!result.ok) {
      setErrorKey(ERROR_KEY[result.code]);
      return;
    }
    setErrorKey(null);
    onImage(file);
  }

  async function handleSample() {
    setSampleLoading(true);
    setErrorKey(null);
    try {
      const res = await fetch('/exemplo.jpg');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], 'exemplo.jpg', { type: 'image/jpeg' });
      track('sample_used');
      onImage(file);
    } catch (e) {
      console.error(e);
      setErrorKey('sampleError');
    } finally {
      setSampleLoading(false);
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={t('dropzoneAria')}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.key === ' ') e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          dragging
            ? 'border-accent bg-accent/10'
            : 'border-border hover:border-accent/60'
        }`}
      >
        <p className="text-muted">
          {t('dropzonePrompt')}
        </p>
        <p className="mt-1 text-sm text-muted/70">{t('dropzoneFormats')}</p>
        <input
          ref={inputRef}
          data-testid="file-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={handleSample}
          disabled={sampleLoading}
          className="text-sm text-muted underline hover:text-foreground disabled:opacity-50"
        >
          {sampleLoading ? t('sampleLoading') : t('sampleButton')}
        </button>
      </div>
      {errorKey && <p className="mt-2 text-sm text-red-500">{t(errorKey)}</p>}
    </div>
  );
}
