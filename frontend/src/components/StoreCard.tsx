import { Store } from '../types';

interface StoreCardProps {
  store: Store;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function StoreCard({ store, onDelete, isDeleting }: StoreCardProps) {
  const getStatusClass = (status: Store['status']) => {
    return `store-status status-${status}`;
  };

  let urls: string[] = [];
  try {
    urls = store.urls ? JSON.parse(store.urls) : [];
    if (!Array.isArray(urls)) urls = [];
  } catch {
    urls = [];
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="store-card">
      <div className="store-header">
        <div>
          <div className="store-title">{store.name}</div>
          <span className="store-engine">{store.engine}</span>
        </div>
      </div>

      <div className={getStatusClass(store.status)}>
        {store.status.toUpperCase()}
      </div>

      <div className="store-info">
        <div className="info-item">
          <span className="info-label">Namespace:</span>
          <code>{store.namespace}</code>
        </div>
        <div className="info-item">
          <span className="info-label">Created:</span>
          <span className="timestamp">{formatDate(store.created_at)}</span>
        </div>
      </div>

      {urls.length > 0 && (
        <div className="store-urls">
          <div className="info-label">URLs:</div>
          {urls.map((url: string, index: number) => (
            <a key={index} href={url} target="_blank" rel="noopener noreferrer">
              {url}
            </a>
          ))}
        </div>
      )}

      {store.error_message && (
        <div className="error-message">
          <strong>Error:</strong> {store.error_message}
        </div>
      )}

      <div className="store-actions">
        <button
          className="btn btn-danger"
          onClick={() => onDelete(store.id)}
          disabled={isDeleting || store.status === 'deleting'}
        >
          {store.status === 'deleting' ? 'Deleting...' : 'Delete Store'}
        </button>
      </div>
    </div>
  );
}
