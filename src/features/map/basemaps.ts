import L from 'leaflet';

export type BasemapId = 'oficial' | 'yanis18' | 'estilizado';

export interface BasemapDefinition {
  id: BasemapId;
  name: string;
  description: string;
  /** Cor do mar, usada como fundo fora da área coberta pelos tiles. */
  background: string;
  tiled: boolean;
}

export const BASEMAPS: BasemapDefinition[] = [
  {
    id: 'oficial',
    name: 'Mapa oficial do jogo',
    description: 'Mapa do GTA VI, sem nomes. Zoom mais detalhado.',
    background: '#2f8db0',
    tiled: true,
  },
  {
    id: 'yanis18',
    name: 'Mapa da comunidade (Yanis v18)',
    description: 'Com nomes de regiões, ruas e áreas.',
    background: '#2c5f9e',
    tiled: true,
  },
  {
    id: 'estilizado',
    name: 'Atlas estilizado',
    description: 'Base leve do Leonida Atlas, já guardada offline.',
    background: '#0b202c',
    tiled: false,
  },
];

export interface TileRange {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  missing: string[];
}
export interface TileManifest {
  sets: Record<string, { zooms: Record<string, TileRange>; count: number; bytes: number }>;
}

let manifestRequest: Promise<TileManifest> | undefined;
export function tilesBase(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base.endsWith('/') ? base : `${base}/`}tiles/`;
}
export function loadTileManifest(): Promise<TileManifest> {
  manifestRequest ??= fetch(`${tilesBase()}manifest.json`).then((response) => {
    if (!response.ok) throw new Error(`Manifesto de tiles indisponível (${response.status}).`);
    return response.json() as Promise<TileManifest>;
  });
  manifestRequest.catch(() => (manifestRequest = undefined));
  return manifestRequest;
}

/**
 * Grade do GTADB: no zoom g o mapa tem 4·2^g tiles por lado, centrado na origem, e no g=5 cada
 * pixel vale uma unidade do jogo. No CRS.Simple do Leaflet o zoom 0 vale uma unidade por pixel,
 * então g = z + 5 e o índice do tile se desloca em 2^(g+1).
 */
export const GTADB_ZOOM_OFFSET = 5;
export function gtadbTile(z: number, x: number, y: number) {
  const g = z + GTADB_ZOOM_OFFSET;
  const shift = 2 ** (g + 1);
  return { g, x: x + shift, y: y + shift };
}

export function tileUrl(set: string, g: number, x: number, y: number): string {
  return `${tilesBase()}${set}/${g}/${x}_${y}.jpg`;
}

/** Todas as URLs de um conjunto, para o download offline. */
export function allTileUrls(manifest: TileManifest, set: string): string[] {
  const urls: string[] = [];
  const zooms = manifest.sets[set]?.zooms ?? {};
  for (const [g, range] of Object.entries(zooms)) {
    const missing = new Set(range.missing);
    for (let y = range.y0; y <= range.y1; y++)
      for (let x = range.x0; x <= range.x1; x++)
        if (!missing.has(`${x}_${y}`)) urls.push(tileUrl(set, Number(g), x, y));
  }
  return urls;
}

const EMPTY_TILE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export function createGtadbTileLayer(set: string, manifest: TileManifest): L.TileLayer {
  const zooms = manifest.sets[set]?.zooms ?? {};
  const native = Object.keys(zooms).map(Number);
  const maxG = Math.max(...native);
  const minG = Math.min(...native);
  const Layer = L.TileLayer.extend({
    getTileUrl(coords: L.Coords) {
      const tile = gtadbTile(coords.z, coords.x, coords.y);
      const range = zooms[String(tile.g)];
      if (
        !range ||
        tile.x < range.x0 ||
        tile.x > range.x1 ||
        tile.y < range.y0 ||
        tile.y > range.y1 ||
        range.missing.includes(`${tile.x}_${tile.y}`)
      )
        return EMPTY_TILE;
      return tileUrl(set, tile.g, tile.x, tile.y);
    },
  }) as unknown as new (url: string, options: L.TileLayerOptions) => L.TileLayer;
  return new Layer('', {
    // O padrão do Leaflet (0 a 18) esconderia a camada nos zooms negativos do CRS.Simple.
    minZoom: -10,
    maxZoom: 10,
    tileSize: 256,
    noWrap: true,
    minNativeZoom: minG - GTADB_ZOOM_OFFSET,
    maxNativeZoom: maxG - GTADB_ZOOM_OFFSET,
    keepBuffer: 3,
    updateWhenZooming: false,
    className: 'atlas-tiles',
    errorTileUrl: EMPTY_TILE,
  });
}
