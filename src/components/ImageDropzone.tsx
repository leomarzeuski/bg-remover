import { useRef, useState } from 'react';
import { validateImage } from '../lib/validateImage';

interface Props {
  onImage: (file: File) => void;
}

export function ImageDropzone({ onImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const result = validateImage(file);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    onImage(file);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Enviar imagem"
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
          Arraste, cole (Ctrl/Cmd+V) ou clique para escolher
        </p>
        <p className="mt-1 text-sm text-muted/70">PNG, JPG ou WebP</p>
        <input
          ref={inputRef}
          data-testid="file-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
