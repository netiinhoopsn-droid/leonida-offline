import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Square, Trash2 } from 'lucide-react';
import {
  BASEMAPS,
  allTileUrls,
  loadTileManifest,
  type TileManifest,
} from '../map/basemaps';

/** Mesmo nome usado pelo service worker; fica fora do prefixo que ele apaga a cada versão. */
export const TILE_CACHE = 'leonida-tiles-v1';
const CONCURRENCY = 8;

type Progress = { done: number; total: number; failed: number };

function formatMb(bytes: number) {
  return `${Math.round(bytes / 1048576)} MB`;
}

async function cachedCount(urls: string[]): Promise<number> {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  const have = new Set(keys.map((request) => new URL(request.url).pathname));
  return urls.filter((url) => have.has(url)).length;
}

export function OfflineDownload() {
  const supported = typeof caches !== 'undefined';
  const [manifest, setManifest] = useState<TileManifest | null>(null);
  const [status, setStatus] = useState<Record<string, Progress>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const stop = useRef(false);

  async function refresh(current: TileManifest) {
    const next: Record<string, Progress> = {};
    for (const set of Object.keys(current.sets)) {
      const urls = allTileUrls(current, set);
      next[set] = { done: await cachedCount(urls), total: urls.length, failed: 0 };
    }
    setStatus(next);
  }

  useEffect(() => {
    if (!supported) return;
    loadTileManifest()
      .then(async (loaded) => {
        setManifest(loaded);
        await refresh(loaded);
      })
      .catch(() => setMessage('Abra o app com internet uma vez para ver os mapas disponíveis.'));
  }, [supported]);

  async function download(set: string) {
    if (!manifest || running) return;
    stop.current = false;
    setRunning(set);
    setMessage('');
    try {
      await navigator.storage?.persist?.();
    } catch {
      /* Pedido opcional. */
    }
    const cache = await caches.open(TILE_CACHE);
    const have = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
    const urls = allTileUrls(manifest, set);
    const pending = urls.filter((url) => !have.has(url));
    let done = urls.length - pending.length;
    let failed = 0;
    setStatus((s) => ({ ...s, [set]: { done, total: urls.length, failed } }));
    let cursor = 0;
    let lastPaint = 0;
    async function worker() {
      while (!stop.current && cursor < pending.length) {
        const url = pending[cursor++]!;
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (!response.ok) throw new Error(String(response.status));
          await cache.put(url, response);
          done++;
        } catch (error) {
          failed++;
          if (error instanceof DOMException && error.name === 'QuotaExceededError') stop.current = true;
        }
        const now = performance.now();
        if (now - lastPaint > 250) {
          lastPaint = now;
          setStatus((s) => ({ ...s, [set]: { done, total: urls.length, failed } }));
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setStatus((s) => ({ ...s, [set]: { done, total: urls.length, failed } }));
    setRunning(null);
    setMessage(
      stop.current && done < urls.length
        ? 'Download pausado. Toque em Continuar para seguir de onde parou.'
        : failed
          ? `${failed} partes falharam (sem internet?). Toque em Continuar para completar.`
          : 'Pronto: este mapa abre sem internet.',
    );
  }

  async function remove(set: string) {
    if (!manifest) return;
    const cache = await caches.open(TILE_CACHE);
    const prefix = `/tiles/${set}/`;
    for (const request of await cache.keys())
      if (new URL(request.url).pathname.includes(prefix)) await cache.delete(request);
    await refresh(manifest);
  }

  if (!supported)
    return <p className="help-text">Este navegador não permite guardar o mapa para uso offline.</p>;

  return (
    <div className="offline-download">
      {BASEMAPS.map((basemap) => {
        if (!basemap.tiled) return null;
        const info = manifest?.sets[basemap.id];
        const progress = status[basemap.id];
        const complete = progress && progress.done >= progress.total && progress.total > 0;
        const percent = progress?.total ? Math.floor((progress.done / progress.total) * 100) : 0;
        return (
          <div className="offline-row" key={basemap.id}>
            <div className="row-between">
              <span>
                <strong>{basemap.name}</strong>
                <small>
                  {info ? `${formatMb(info.bytes)} · ${info.count.toLocaleString('pt-BR')} partes` : '…'}
                </small>
              </span>
              {complete ? (
                <span className="offline-ok">
                  <CheckCircle2 size={16} /> Offline
                </span>
              ) : null}
            </div>
            <progress max={100} value={percent} aria-label={`Progresso de ${basemap.name}`} />
            <div className="row-between">
              <small>
                {progress ? `${percent}% · ${progress.done.toLocaleString('pt-BR')} de ${progress.total.toLocaleString('pt-BR')}` : ''}
              </small>
              <div className="button-row">
                {running === basemap.id ? (
                  <button className="button" onClick={() => (stop.current = true)}>
                    <Square size={15} /> Pausar
                  </button>
                ) : (
                  <button
                    className="button"
                    disabled={!manifest || Boolean(running) || complete}
                    onClick={() => void download(basemap.id)}
                  >
                    <Download size={15} /> {progress?.done ? 'Continuar' : 'Baixar'}
                  </button>
                )}
                {progress?.done && !running ? (
                  <button
                    className="icon-button"
                    aria-label={`Apagar ${basemap.name} do aparelho`}
                    onClick={() => void remove(basemap.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
      {message && (
        <p role="status" className="help-text">
          {message}
        </p>
      )}
      <p className="help-text">
        Faça o download no Wi-Fi, com o app instalado na tela inicial e a tela ligada. Se parar,
        toque em Continuar: o que já baixou fica guardado.
      </p>
    </div>
  );
}
