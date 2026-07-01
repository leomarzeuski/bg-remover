export type ProgressPhase = 'download' | 'compute';

export interface ProgressUpdate {
  /** Progresso global monotônico, 0..1. */
  progress: number;
  phase: ProgressPhase;
}

/** Fatia da barra reservada ao download do modelo (a 1ª vez). */
const DOWNLOAD_CAP = 0.7;

/**
 * O `@imgly/background-removal` reporta o progresso como frações independentes
 * por fase: cada arquivo baixado vai de 0→1 (`fetch:*`) e o cômputo vem em
 * passos `step/4` (`compute:*`). Mostrar essas frações direto faz a barra bater
 * 100% várias vezes no download e resetar.
 *
 * Este rastreador converte esses eventos num progresso **global e monotônico**:
 * - download → 0..DOWNLOAD_CAP (agregando bytes de todos os arquivos vistos);
 * - compute  → DOWNLOAD_CAP..1 (ou 0..1 quando o modelo já está em cache).
 */
export function createProgressTracker() {
  const files = new Map<string, { current: number; total: number }>();
  let hadDownload = false;
  let displayed = 0;

  return function update(
    stage: string,
    current: number,
    total: number,
  ): ProgressUpdate {
    if (stage.startsWith('fetch')) {
      hadDownload = true;
      files.set(stage, { current, total });
      let sumCurrent = 0;
      let sumTotal = 0;
      for (const f of files.values()) {
        sumCurrent += f.current;
        sumTotal += f.total;
      }
      const frac = sumTotal > 0 ? sumCurrent / sumTotal : 0;
      displayed = Math.max(displayed, frac * DOWNLOAD_CAP);
      return { progress: displayed, phase: 'download' };
    }

    // compute:* → current/total é step/4
    const frac = total > 0 ? current / total : 0;
    const mapped = hadDownload
      ? DOWNLOAD_CAP + frac * (1 - DOWNLOAD_CAP)
      : frac;
    displayed = Math.max(displayed, mapped);
    return { progress: displayed, phase: 'compute' };
  };
}
