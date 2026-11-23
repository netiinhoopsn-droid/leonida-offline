import { useState } from 'react';
import { atlasRepository } from '../../db/repository';
import { saveLocal, usePersistenceStore, useUserStore } from '../../stores/atlas';
import { Modal } from '../../app/Modal';
import { OfflineDownload } from './OfflineDownload';

export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const preferences = useUserStore((s) => s.preferences);
  const ready = usePersistenceStore((s) => s.ready);
  const [storageMessage, setStorageMessage] = useState('');
  return (
    <Modal title="Ajustes" onClose={onClose}>
      <section className="detail-section">
        <h3>Mapas offline</h3>
        <OfflineDownload />
      </section>
      <div className="settings-list">
        {(
          [
            {
              key: 'showLabels',
              title: 'Nomes no mapa',
              description: 'Mostra o nome dos lugares quando aproxima.',
            },
            {
              key: 'clusterMarkers',
              title: 'Agrupar marcadores próximos',
              description: 'Junta pontos vizinhos para o mapa não poluir.',
            },
            {
              key: 'reducedMotion',
              title: 'Menos animação',
              description: 'Movimentos do mapa sem animação.',
            },
          ] as const
        ).map((option) => (
          <label className="setting-row" key={option.key}>
            <span>
              {option.title}
              <small>{option.description}</small>
            </span>
            <input
              type="checkbox"
              disabled={!ready}
              checked={preferences[option.key]}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                void saveLocal(() =>
                  atlasRepository.savePreferences({
                    ...useUserStore.getState().preferences,
                    [option.key]: checked,
                  }),
                );
              }}
            />
          </label>
        ))}
      </div>
      <section className="detail-section">
        <h3>Dados neste aparelho</h3>
        <p className="help-text">
          Favoritos, anotações, coleções, filtros e encontrados ficam só neste aparelho. Use Backup
          de vez em quando: se os dados do Safari forem apagados, eles se perdem.
        </p>
        <button
          className="button"
          disabled={!ready}
          onClick={async () => {
            const persisted = await atlasRepository.requestPersistence();
            setStorageMessage(
              persisted
                ? 'Armazenamento protegido.'
                : 'O navegador não liberou a proteção. Tudo continua salvando; mantenha um backup.',
            );
          }}
        >
          Proteger os dados
        </button>
        {storageMessage && (
          <p role="status" className="help-text">
            {storageMessage}
          </p>
        )}
      </section>
      <section className="detail-section">
        <h3>Créditos</h3>
        <p className="help-text">
          Lugares e mapas: GTADB / Map GTA e colaboradores (CC BY 4.0). Mapa da comunidade: Yanis
          v18. Mapa oficial: Rockstar Games. App: Leonida Atlas (AGPL-3.0). Projeto de fã, sem
          vínculo com a Rockstar ou a Take-Two.
        </p>
      </section>
    </Modal>
  );
}
