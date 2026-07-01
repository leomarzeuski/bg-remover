import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { composite, extractAlpha, paintStroke } from '../lib/refine';

interface Props {
  originalUrl: string;
  cutoutBlob: Blob;
  bgColor: string | null;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
}

type Mode = 'restore' | 'erase';
const MAX_WORK = 2048;
const UNDO_LIMIT = 12;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar a imagem.'));
    img.src = url;
  });
}

function toImageData(source: CanvasImageSource, w: number, h: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D não disponível neste navegador.');
  ctx.drawImage(source, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function maskToCanvas(
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D não disponível neste navegador.');
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < alpha.length; i++) {
    img.data[i * 4] = 255;
    img.data[i * 4 + 1] = 255;
    img.data[i * 4 + 2] = 255;
    img.data[i * 4 + 3] = alpha[i];
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

async function exportMasked(
  originalUrl: string,
  alpha: Uint8ClampedArray,
  workW: number,
  workH: number,
): Promise<Blob> {
  const img = await loadImage(originalUrl);
  const fw = img.naturalWidth || img.width;
  const fh = img.naturalHeight || img.height;
  const originalData = toImageData(img, fw, fh);

  const maskC = maskToCanvas(alpha, workW, workH);
  const maskFull = document.createElement('canvas');
  maskFull.width = fw;
  maskFull.height = fh;
  const mctx = maskFull.getContext('2d');
  if (!mctx) throw new Error('Canvas 2D não disponível neste navegador.');
  mctx.drawImage(maskC, 0, 0, fw, fh);
  const fullAlpha = extractAlpha(mctx.getImageData(0, 0, fw, fh).data);

  const out = composite(originalData.data, fullAlpha);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = fw;
  outCanvas.height = fh;
  const octx = outCanvas.getContext('2d');
  if (!octx) throw new Error('Canvas 2D não disponível neste navegador.');
  const outImage = octx.createImageData(fw, fh);
  outImage.data.set(out);
  octx.putImageData(outImage, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao exportar o PNG.'))),
      'image/png',
    );
  });
}

export function RefineEditor({
  originalUrl,
  cutoutBlob,
  bgColor,
  onApply,
  onCancel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alphaRef = useRef<Uint8ClampedArray | null>(null);
  const originalRef = useRef<ImageData | null>(null);
  const dimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const undoRef = useRef<Uint8ClampedArray[]>([]);
  const redoRef = useRef<Uint8ClampedArray[]>([]);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const dirtyRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [mode, setMode] = useState<Mode>('restore');
  const [brushSize, setBrushSize] = useState(28);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [cursor, setCursor] = useState<{
    x: number;
    y: number;
    size: number;
  } | null>(null);

  const modeRef = useRef(mode);
  const brushRef = useRef(brushSize);
  modeRef.current = mode;
  brushRef.current = brushSize;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const original = originalRef.current;
    const alpha = alphaRef.current;
    if (!canvas || !original || !alpha) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h } = dimsRef.current;
    const out = composite(original.data, alpha);
    const image = ctx.createImageData(w, h);
    image.data.set(out);
    ctx.putImageData(image, 0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const img = await loadImage(originalUrl);
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const scale = Math.min(1, MAX_WORK / Math.max(iw, ih));
        const w = Math.max(1, Math.round(iw * scale));
        const h = Math.max(1, Math.round(ih * scale));
        const originalData = toImageData(img, w, h);
        const cutoutBitmap = await createImageBitmap(cutoutBlob);
        const cutoutData = toImageData(cutoutBitmap, w, h);
        cutoutBitmap.close();
        if (cancelled) return;
        originalRef.current = originalData;
        alphaRef.current = extractAlpha(cutoutData.data);
        dimsRef.current = { w, h };
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = w;
          canvas.height = h;
        }
        setReady(true);
        render();
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'Falha ao preparar o editor.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [originalUrl, cutoutBlob, render]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const scheduleRender = useCallback(() => {
    dirtyRef.current = true;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (dirtyRef.current) {
        dirtyRef.current = false;
        render();
      }
    });
  }, [render]);

  const eventToCanvas = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const { w, h } = dimsRef.current;
    return {
      x: ((e.clientX - rect.left) / rect.width) * w,
      y: ((e.clientY - rect.top) / rect.height) * h,
    };
  };

  // The brush size is expressed in on-screen (display) pixels, so it feels the
  // same regardless of the image resolution.
  const updateCursor = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      size: brushRef.current,
    });
  };

  const paintAt = (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => {
    const alpha = alphaRef.current;
    const canvas = canvasRef.current;
    if (!alpha || !canvas) return;
    const { w, h } = dimsRef.current;
    // Convert the display-pixel brush size to working-resolution pixels.
    const scale = w / (canvas.getBoundingClientRect().width || 1);
    const radius = (brushRef.current / 2) * scale;
    const value = modeRef.current === 'restore' ? 255 : 0;
    paintStroke(alpha, w, h, from.x, from.y, to.x, to.y, radius, value);
    scheduleRender();
  };

  const pushUndo = () => {
    const alpha = alphaRef.current;
    if (!alpha) return;
    undoRef.current.push(new Uint8ClampedArray(alpha));
    if (undoRef.current.length > UNDO_LIMIT) undoRef.current.shift();
    redoRef.current = [];
    setCanRedo(false);
    setCanUndo(true);
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pushUndo();
    drawingRef.current = true;
    const p = eventToCanvas(e);
    lastRef.current = p;
    paintAt(p, p);
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    updateCursor(e);
    if (!drawingRef.current) return;
    const p = eventToCanvas(e);
    const last = lastRef.current ?? p;
    paintAt(last, p);
    lastRef.current = p;
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastRef.current = null;
  };

  const handlePointerLeave = () => {
    handlePointerUp();
    setCursor(null);
  };

  const handleUndo = useCallback(() => {
    const prev = undoRef.current.pop();
    if (!prev || !alphaRef.current) return;
    redoRef.current.push(new Uint8ClampedArray(alphaRef.current));
    alphaRef.current = prev;
    setCanUndo(undoRef.current.length > 0);
    setCanRedo(true);
    render();
  }, [render]);

  const handleRedo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next || !alphaRef.current) return;
    undoRef.current.push(new Uint8ClampedArray(alphaRef.current));
    alphaRef.current = next;
    setCanRedo(redoRef.current.length > 0);
    setCanUndo(true);
    render();
  }, [render]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  const handleRevert = async () => {
    try {
      const { w, h } = dimsRef.current;
      const cutoutBitmap = await createImageBitmap(cutoutBlob);
      const cutoutData = toImageData(cutoutBitmap, w, h);
      cutoutBitmap.close();
      alphaRef.current = extractAlpha(cutoutData.data);
      undoRef.current = [];
      redoRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      render();
    } catch {
      setError('Falha ao reverter para o recorte da IA.');
    }
  };

  const handleApply = async () => {
    const alpha = alphaRef.current;
    if (!alpha) return;
    setError(null);
    try {
      const blob = await exportMasked(
        originalUrl,
        alpha,
        dimsRef.current.w,
        dimsRef.current.h,
      );
      onApply(blob);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erro ao gerar o PNG. Tente novamente.',
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => setMode('restore')}
            aria-pressed={mode === 'restore'}
            className={`rounded-md px-3 py-1 text-sm ${
              mode === 'restore'
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground'
            }`}
          >
            Restaurar
          </button>
          <button
            type="button"
            onClick={() => setMode('erase')}
            aria-pressed={mode === 'erase'}
            className={`rounded-md px-3 py-1 text-sm ${
              mode === 'erase'
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground'
            }`}
          >
            Apagar
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Pincel
          <input
            type="range"
            min={4}
            max={80}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            aria-label="Tamanho do pincel"
          />
        </label>
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-40"
        >
          Desfazer
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={!canRedo}
          className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-40"
        >
          Refazer
        </button>
        <button
          type="button"
          onClick={handleRevert}
          className="rounded-lg border border-border px-3 py-1 text-sm"
        >
          Reverter para IA
        </button>
      </div>

      <p className="text-xs text-muted">
        Pinte sobre a imagem para restaurar ou apagar partes do recorte.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div
        className={`relative overflow-hidden rounded-2xl border border-border ${
          bgColor === null ? 'checkerboard' : ''
        }`}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className="block w-full touch-none [image-rendering:pixelated]"
          style={{ cursor: 'crosshair' }}
        />
        {cursor && (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full border-2 border-white mix-blend-difference"
            style={{
              left: cursor.x - cursor.size / 2,
              top: cursor.y - cursor.size / 2,
              width: cursor.size,
              height: cursor.size,
            }}
          />
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleApply}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground"
        >
          Aplicar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
