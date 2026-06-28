interface Props {
  originalUrl: string;
  cutoutUrl: string;
  bgColor: string | null;
}

export function BeforeAfter({ originalUrl, cutoutUrl, bgColor }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <figure>
        <figcaption className="mb-1 text-sm text-gray-600">Original</figcaption>
        <img src={originalUrl} alt="Original" className="w-full rounded border" />
      </figure>
      <figure>
        <figcaption className="mb-1 text-sm text-gray-600">Sem fundo</figcaption>
        <div
          className={`overflow-hidden rounded border ${
            bgColor === null ? 'checkerboard' : ''
          }`}
          style={bgColor ? { backgroundColor: bgColor } : undefined}
        >
          <img src={cutoutUrl} alt="Sem fundo" className="w-full" />
        </div>
      </figure>
    </div>
  );
}
