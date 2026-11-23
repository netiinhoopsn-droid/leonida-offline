import type { LayerDefinition, Place } from '../../domain/types';

export const DEFAULT_LAYERS: LayerDefinition[] = [
  {
    id: 'regions',
    name: 'Regiões',
    description: 'Nomes oficiais, posição aproximada.',
    category: 'reference',
    visible: true,
    order: 0,
    source: 'Rockstar Games / GTADB',
    style: { color: '#f2d897', radius: 9 },
    icon: 'region',
    interactive: true,
  },
  {
    id: 'community',
    name: 'Lugares com nome',
    description: 'Mapeados pela comunidade; posição aproximada.',
    category: 'community',
    visible: true,
    order: 10,
    source: 'GTADB / Map GTA · CC BY 4.0',
    style: { color: '#73cbbb', radius: 6 },
    icon: 'pin',
    interactive: true,
  },
  {
    id: 'uncertain',
    name: 'Lugares incertos',
    description: 'Sem nome confirmado ou marcados como incertos.',
    category: 'community',
    visible: true,
    order: 20,
    source: 'GTADB / Map GTA · CC BY 4.0',
    style: { color: '#cba980', radius: 5 },
    icon: 'question',
    interactive: true,
  },
  {
    id: 'personal',
    name: 'Meus marcadores',
    description: 'Marcadores que você criou.',
    category: 'personal',
    visible: true,
    order: 30,
    source: 'Your local atlas',
    style: { color: '#c9a9ef', radius: 8 },
    icon: 'pin',
    interactive: true,
  },
];

/** Unpositioned records remain available to the catalogue; the spatial index omits them. */
export function getVisiblePlaces(
  places: readonly Place[],
  layers: readonly LayerDefinition[],
  zoom?: number,
): Place[] {
  const orderedLayers = layers
    .filter(
      (layer) =>
        layer.visible &&
        (zoom === undefined || layer.minZoom === undefined || zoom >= layer.minZoom) &&
        (zoom === undefined || layer.maxZoom === undefined || zoom <= layer.maxZoom),
    )
    .sort((a, b) => a.order - b.order);
  const buckets = new Map(orderedLayers.map((layer) => [layer.id, [] as Place[]]));
  for (const place of places) buckets.get(place.layerId)?.push(place);
  return orderedLayers.flatMap((layer) => buckets.get(layer.id) ?? []);
}
