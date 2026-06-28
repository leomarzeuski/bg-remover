import { composeBackground } from '../lib/composeBackground';

interface Props {
  cutout: Blob;
  bgColor: string | null;
  fileName: string;
}

export function DownloadButton({ cutout, bgColor, fileName }: Props) {
  async function handleDownload() {
    const blob = await composeBackground(cutout, bgColor);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleDownload}
      className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
    >
      Baixar PNG
    </button>
  );
}
