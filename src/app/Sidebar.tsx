import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  ChevronRight,
  Compass,
  Database,
  Download,
  Layers,
  MapPin,
  Search,
  Settings,
  X,
} from 'lucide-react';
import type { Category, Place } from '../domain/types';
import { useDomainStore, useMapStore, useUiStore } from '../stores/atlas';
import { SavedPlaces } from '../features/library/SavedPlaces';
import { Status } from './Status';
import { setAccountEntryTarget } from '../capabilities/extension-host';
import { toggleService, useLocalStore } from '../stores/local';
import { BASEMAPS } from '../features/map/basemaps';
import { SERVICES, isEnterable, serviceFor } from '../features/map/services';

function ServiceFilters() {
  const places = useDomainStore((s) => s.places);
  const selected = useLocalStore((s) => s.services);
  const hideFound = useLocalStore((s) => s.hideFound);
  const enterableOnly = useLocalStore((s) => s.enterableOnly);
  const found = useLocalStore((s) => s.found);
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const place of places) {
      const service = serviceFor(place);
      if (service) result.set(service.id, (result.get(service.id) ?? 0) + 1);
    }
    return result;
  }, [places]);
  const enterable = useMemo(() => places.filter(isEnterable).length, [places]);
  const foundCount = useMemo(() => {
    const ids = new Set(places.map((p) => p.id));
    return found.filter((id) => ids.has(id)).length;
  }, [places, found]);
  return (
    <div className="service-filters">
      <div className="row-between">
        <span className="filter-heading">Serviços do jogo</span>
        {selected.length > 0 && (
          <button className="text-button" onClick={() => useLocalStore.setState({ services: [] })}>
            Limpar
          </button>
        )}
      </div>
      <div className="chip-grid">
        {SERVICES.filter((service) => counts.get(service.id)).map((service) => (
          <button
            key={service.id}
            className={`chip ${selected.includes(service.id) ? 'active' : ''}`}
            aria-pressed={selected.includes(service.id)}
            onClick={() => toggleService(service.id)}
          >
            <span aria-hidden="true">{service.glyph}</span>
            {service.name}
            <small>{counts.get(service.id)}</small>
          </button>
        ))}
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          checked={enterableOnly}
          onChange={(e) => useLocalStore.setState({ enterableOnly: e.target.checked })}
        />
        Só prédios em que dá para entrar ({enterable})
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={hideFound}
          onChange={(e) => useLocalStore.setState({ hideFound: e.target.checked })}
        />
        Ocultar encontrados ({foundCount} de {places.length.toLocaleString('pt-BR')})
      </label>
    </div>
  );
}

function BasemapPicker() {
  const basemap = useLocalStore((s) => s.basemap);
  return (
    <fieldset className="basemap-picker">
      <legend>Mapa base</legend>
      {BASEMAPS.map((option) => (
        <label key={option.id} className={basemap === option.id ? 'active' : ''}>
          <input
            type="radio"
            name="basemap"
            checked={basemap === option.id}
            onChange={() => useLocalStore.setState({ basemap: option.id })}
          />
          <span>
            {option.name}
            <small>{option.description}</small>
          </span>
        </label>
      ))}
      <button className="button" onClick={() => useUiStore.getState().setDialog('settings')}>
        <Download size={16} />
        Baixar mapas para usar offline
      </button>
    </fieldset>
  );
}

export const CATEGORIES: { id: Category | 'all'; name: string }[] = [
  { id: 'all', name: 'Todos os lugares' },
  { id: 'region', name: 'Regiões' },
  { id: 'landmark', name: 'Pontos de referência' },
  { id: 'nature', name: 'Natureza' },
  { id: 'transport', name: 'Transporte e infraestrutura' },
  { id: 'business', name: 'Comércio e serviços' },
  { id: 'personal', name: 'Meus marcadores' },
];

function LayerManager() {
  const layers = useMapStore((s) => s.layers);
  const ordered = [...layers].sort((a, b) => b.order - a.order);
  function move(id: string, direction: number) {
    const index = ordered.findIndex((l) => l.id === id);
    const neighbor = ordered[index + direction];
    const current = ordered[index];
    if (!neighbor || !current) return;
    useMapStore
      .getState()
      .setLayers(
        layers.map((layer) =>
          layer.id === id
            ? { ...layer, order: neighbor.order }
            : layer.id === neighbor.id
              ? { ...layer, order: current.order }
              : layer,
        ),
      );
  }
  return (
    <div className="layer-manager">
      <BasemapPicker />
      <p className="panel-intro">Camadas de marcadores. As de cima ficam por cima no mapa.</p>
      {ordered.map((layer, index) => (
        <div className="layer-row" key={layer.id}>
          <label>
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={(e) =>
                useMapStore
                  .getState()
                  .setLayers(
                    layers.map((l) =>
                      l.id === layer.id ? { ...l, visible: e.target.checked } : l,
                    ),
                  )
              }
            />
            <span className="layer-dot" style={{ background: layer.style.color }} />
            <span>
              {layer.name}
              <small>{layer.description}</small>
            </span>
          </label>
          <div>
            <button
              className="icon-button"
              aria-label={`Subir ${layer.name}`}
              disabled={index === 0}
              onClick={() => move(layer.id, -1)}
            >
              <ArrowUp size={15} />
            </button>
            <button
              className="icon-button"
              aria-label={`Descer ${layer.name}`}
              disabled={index === ordered.length - 1}
              onClick={() => move(layer.id, 1)}
            >
              <ArrowDown size={15} />
            </button>
          </div>
        </div>
      ))}
      <p className="empty-state">
        As posições dos lugares vêm da comunidade (GTADB) e são aproximadas.
      </p>
    </div>
  );
}

function Results({ places }: { places: Place[] }) {
  const filters = useUiStore((s) => s.filters);
  const selectedId = useMapStore((s) => s.selectedId);
  const status = useDomainStore((s) => s.status);
  const [limit, setLimit] = useState(50);
  useEffect(() => setLimit(50), [filters]);
  function select(place: Place) {
    useMapStore.getState().select(place);
    if (window.innerWidth < 1000) useUiStore.getState().setSidebar(false);
  }
  return (
    <>
      <div className="filter-controls">
        <label htmlFor="category">Categoria</label>
        <select
          id="category"
          value={filters.category}
          onChange={(e) =>
            useUiStore.getState().setFilters({ category: e.target.value as Category | 'all' })
          }
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="row-between">
          <label className="check-label">
            <input
              type="checkbox"
              checked={filters.favoritesOnly}
              onChange={(e) =>
                useUiStore.getState().setFilters({ favoritesOnly: e.target.checked })
              }
            />
            Favoritos
          </label>
          <select
            className="compact-select"
            aria-label="Confiabilidade"
            value={filters.evidence}
            onChange={(e) =>
              useUiStore
                .getState()
                .setFilters({ evidence: e.target.value as 'all' | 'approximate' | 'uncertain' })
            }
          >
            <option value="all">Todos</option>
            <option value="approximate">Com nome</option>
            <option value="uncertain">Incertos</option>
          </select>
        </div>
        <ServiceFilters />
      </div>
      <div className="results-count">
        <span>{places.length.toLocaleString('pt-BR')} resultados</span>
        <button
          className="text-button"
          onClick={() => {
            useUiStore.getState().resetFilters();
            useLocalStore.setState({ services: [], hideFound: false, enterableOnly: false });
          }}
        >
          Limpar filtros
        </button>
      </div>
      {status === 'loading' ? (
        <p className="empty-state">Carregando os lugares…</p>
      ) : !places.length ? (
        <p className="empty-state">
          Nenhum lugar com esses filtros. Tente outro nome, região ou serviço.
        </p>
      ) : (
        <div className="place-results" aria-label="Resultados">
          {places.slice(0, limit).map((place) => (
            <button
              className={`place-result ${selectedId === place.id ? 'active' : ''}`}
              key={place.id}
              onClick={() => select(place)}
            >
              <MapPin size={19} />
              <span>
                <strong>{place.title || 'Sem nome'}</strong>
                <small>
                  {[
                    serviceFor(place)?.glyph,
                    !place.position
                      ? 'Sem posição no mapa'
                      : place.evidence === 'personal'
                        ? 'Meu marcador'
                        : place.evidence === 'uncertain'
                          ? 'Incerto'
                          : (CATEGORIES.find((c) => c.id === place.category)?.name ??
                            place.category),
                    place.region,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}
      {places.length > limit && (
        <button className="load-more" onClick={() => setLimit((n) => n + 50)}>
          Mostrar mais {Math.min(50, places.length - limit)}
        </button>
      )}
    </>
  );
}

export function Sidebar({ places }: { places: Place[] }) {
  const tab = useUiStore((s) => s.tab);
  const open = useUiStore((s) => s.sidebarOpen);
  const query = useUiStore((s) => s.filters.query);
  return (
    <aside className="sidebar" data-open={open} aria-label="Painel do atlas">
      <header className="brand-header">
        <div>
          <h1>LEONIDA ATLAS</h1>
          <p>MAPA OFFLINE DO GTA VI</p>
        </div>
        <button
          className="icon-button mobile-only"
          aria-label="Fechar painel"
          onClick={() => useUiStore.getState().setSidebar(false)}
        >
          <X size={21} />
        </button>
      </header>
      <div className="search-field">
        <Search size={18} />
        <input
          id="atlas-search"
          type="search"
          maxLength={250}
          placeholder="Buscar lugar, região, serviço"
          aria-label="Buscar lugar, região, serviço"
          value={query}
          onChange={(e) => {
            useUiStore.getState().setFilters({ query: e.target.value });
            useUiStore.getState().setTab('explore');
          }}
        />
        <kbd>/</kbd>
      </div>
      <nav className="sidebar-tabs" aria-label="Ferramentas">
        {(
          [
            { id: 'explore', name: 'Explorar', icon: Compass },
            { id: 'layers', name: 'Mapa', icon: Layers },
            { id: 'saved', name: 'Salvos', icon: Bookmark },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? 'active' : ''}
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => useUiStore.getState().setTab(item.id)}
          >
            <item.icon size={18} />
            {item.name}
          </button>
        ))}
      </nav>
      <div className="sidebar-content">
        {tab === 'explore' ? (
          <Results places={places} />
        ) : tab === 'layers' ? (
          <LayerManager />
        ) : (
          <SavedPlaces />
        )}
      </div>
      <footer className="sidebar-footer">
        <div ref={setAccountEntryTarget} data-atlas-account-slot />
        <Status />
        <div className="button-row">
          <button className="button" onClick={(event) => {
              event.currentTarget.focus();
              useUiStore.getState().setDialog('settings');
            }}>
            <Settings size={17} />
            Ajustes e offline
          </button>
          <button className="button" onClick={(event) => {
              event.currentTarget.focus();
              useUiStore.getState().setDialog('backup');
            }}>
            <Database size={17} />
            Backup
          </button>
        </div>
      </footer>
    </aside>
  );
}
