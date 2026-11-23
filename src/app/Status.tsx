import { CheckCircle2, Database, LoaderCircle, WifiOff, AlertCircle } from 'lucide-react';
import { hydrateUserData, usePersistenceStore } from '../stores/atlas';

export function Status() {
  const status = usePersistenceStore((s) => s.status);
  const offline = usePersistenceStore((s) => s.offline);
  const error = usePersistenceStore((s) => s.error);
  return (
    <div
      className={`save-status ${status === 'error' ? 'status-error' : ''}`}
      role="status"
      aria-live="polite"
    >
      {status === 'saving' || status === 'loading' ? (
        <LoaderCircle size={22} className="spin" />
      ) : status === 'error' ? (
        <AlertCircle size={22} />
      ) : offline ? (
        <WifiOff size={22} />
      ) : (
        <CheckCircle2 size={22} />
      )}
      <div>
        <strong>
          {status === 'loading'
            ? 'Abrindo dados do aparelho…'
            : status === 'saving'
              ? 'Salvando no aparelho…'
              : status === 'error'
                ? 'Problema ao salvar no aparelho'
                : offline
                  ? 'Sem internet · dados prontos'
                  : 'Tudo salvo no aparelho'}
        </strong>
        <small>{error || 'Seus dados ficam só neste aparelho'}</small>
        {status === 'error' && (
          <button className="text-button" onClick={() => void hydrateUserData()}>
            Retry storage
          </button>
        )}
      </div>
      <Database size={14} aria-hidden="true" />
    </div>
  );
}
