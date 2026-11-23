import { create } from 'zustand';
import type { BasemapId } from '../features/map/basemaps';
import type { Filters, Position } from '../domain/types';

/**
 * Preferências deste aparelho que precisam sobreviver ao fechar o app: mapa base, filtros,
 * camadas, última posição do mapa e lugares marcados como encontrados.
 */
export interface LocalState {
  basemap: BasemapId;
  services: string[];
  hideFound: boolean;
  enterableOnly: boolean;
  found: string[];
  layerVisibility: Record<string, boolean>;
  filters: Partial<Filters> | null;
  view: { center: Position; zoom: number } | null;
}

const KEY = 'leonida-offline:v1';
const DEFAULTS: LocalState = {
  basemap: 'oficial',
  services: [],
  hideFound: false,
  enterableOnly: false,
  found: [],
  layerVisibility: {},
  filters: null,
  view: null,
};

function read(): LocalState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<LocalState>;
    return {
      ...DEFAULTS,
      ...parsed,
      found: Array.isArray(parsed.found) ? parsed.found.filter((id) => typeof id === 'string') : [],
      services: Array.isArray(parsed.services) ? parsed.services : [],
    };
  } catch {
    return DEFAULTS;
  }
}

export const useLocalStore = create<LocalState>(() => read());

let timer: ReturnType<typeof setTimeout> | undefined;
useLocalStore.subscribe((state) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* Armazenamento cheio ou bloqueado: o app continua funcionando nesta sessão. */
    }
  }, 150);
});

export function toggleFound(placeId: string) {
  useLocalStore.setState((state) => ({
    found: state.found.includes(placeId)
      ? state.found.filter((id) => id !== placeId)
      : [...state.found, placeId],
  }));
}

export function toggleService(serviceId: string) {
  useLocalStore.setState((state) => ({
    services: state.services.includes(serviceId)
      ? state.services.filter((id) => id !== serviceId)
      : [...state.services, serviceId],
  }));
}
