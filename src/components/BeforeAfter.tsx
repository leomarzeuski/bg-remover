import { useLocale } from '../i18n/locale';

interface Props {
  originalUrl: string;
  cutoutUrl: string;
  bgColor: string | null;
}

export function BeforeAfter({ originalUrl, cutoutUrl, bgColor }: Props) {
  const { t } = useLocale();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <figure>
        <figcaption className="mb-1 text-sm text-muted">{t('original')}</figcaption>
        <img
          src={originalUrl}
          alt={t('original')}
          className="w-full rounded-2xl border border-border"
        />
      </figure>
      <figure>
        <figcaption className="mb-1 text-sm text-muted">{t('cutout')}</figcaption>
        <div
          className={`overflow-hidden rounded-2xl border border-border ${
            bgColor === null ? 'checkerboard' : ''
          }`}
          style={bgColor ? { backgroundColor: bgColor } : undefined}
        >
          <img src={cutoutUrl} alt={t('cutout')} className="w-full" />
        </div>
      </figure>
    </div>
  );
}
