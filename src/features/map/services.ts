import type { Place } from '../../domain/types';

/** Serviços do jogo, a partir das tags "#..." (ícones de radar) do GTADB. */
export interface ServiceDefinition {
  id: string;
  name: string;
  glyph: string;
  tags: string[];
}

export const SERVICES: ServiceDefinition[] = [
  { id: 'gas', name: 'Postos', glyph: '⛽', tags: ['#gas'] },
  { id: 'mercado', name: 'Mercados', glyph: '🛒', tags: ['#supermarket', 'supermarket'] },
  { id: 'roupas', name: 'Roupas e calçados', glyph: '👕', tags: ['#clothes', '#shoes'] },
  { id: 'armas', name: 'Armas', glyph: '🔫', tags: ['#guns'] },
  { id: 'cabelo', name: 'Barbearias', glyph: '💈', tags: ['#hair'] },
  { id: 'tatuagem', name: 'Tatuagem', glyph: '🖋️', tags: ['#tattoos'] },
  { id: 'comida', name: 'Comida', glyph: '🍔', tags: ['#food', '#fastfood', '#vendor', '#drinks'] },
  { id: 'noite', name: 'Bares e boates', glyph: '🍸', tags: ['#bar', '#nightclub', '#stripclub'] },
  { id: 'eletronicos', name: 'Eletrônicos', glyph: '📺', tags: ['#electronics'] },
  { id: 'receptador', name: 'Receptadores', glyph: '💎', tags: ['#fence'] },
  {
    id: 'oficina',
    name: 'Oficinas e lava-rápido',
    glyph: '🔧',
    tags: ['#modshop', "#pay'n'spray", '#carwash'],
  },
  {
    id: 'transporte',
    name: 'Transporte',
    glyph: '🚉',
    tags: ['#bus', '#train', '#metro', '#metromover', '#marina', '#airport', '#airbase', '#blimp'],
  },
  { id: 'saude', name: 'Hospital e polícia', glyph: '🏥', tags: ['#hospital', '#police', '#jail'] },
  { id: 'casa', name: 'Esconderijos', glyph: '🏠', tags: ['#safehouse'] },
  {
    id: 'lazer',
    name: 'Lazer e corridas',
    glyph: '🎡',
    tags: ['#tennis', '#racetrack', '#ferriswheel'],
  },
];

const byTag = new Map(SERVICES.flatMap((service) => service.tags.map((tag) => [tag, service])));

export function serviceFor(place: Place): ServiceDefinition | undefined {
  for (const tag of place.tags) {
    const service = byTag.get(tag);
    if (service) return service;
  }
  return undefined;
}

export function isEnterable(place: Place): boolean {
  return place.tags.includes('enterable');
}
