import { useState, useEffect } from 'react';
import { storeApi } from './services/api';
import { Store, CreateStoreRequest } from './types';
import { StoreCard } from './components/StoreCard';
import './App.css';

function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateStoreRequest>({
    name: '',
    engine: 'woocommerce',
  });

  const fetchStores = async () => {
    try {
      const data = await storeApi.getStores();
      setStores(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching stores:', err);
      setError(err.response?.data?.error || 'Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();

    const interval = setInterval(fetchStores, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a store name');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await storeApi.createStore(formData);
      setFormData({ name: '', engine: 'woocommerce' });
      await fetchStores();
      alert('Store creation initiated successfully');
    } catch (err: any) {
      console.error('Error creating store:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create store';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      return;
    }

    setDeleting(id);

    try {
      await storeApi.deleteStore(id);
      await fetchStores();
      alert('Store deletion initiated');
    } catch (err: any) {
      console.error('Error deleting store:', err);
      const errorMessage = err.response?.data?.error || 'Failed to delete store';
      alert(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Store Platform Dashboard</h1>
        <p>Manage your WooCommerce and Medusa stores</p>
      </header>

      <div className="container">
        <section className="create-section">
          <h2>Create New Store</h2>
          <form className="create-form" onSubmit={handleCreateStore}>
            <div className="form-group">
              <label htmlFor="name">Store Name</label>
              <input
                id="name"
                type="text"
                placeholder="My Store"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={creating}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="engine">Store Engine</label>
              <select
                id="engine"
                value={formData.engine}
                onChange={(e) => setFormData({ ...formData, engine: e.target.value as 'woocommerce' | 'medusa' })}
                disabled={creating}
              >
                <option value="woocommerce">WooCommerce</option>
                <option value="medusa" disabled>Medusa (Coming in Round 2)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Store'}
            </button>
            <button type="button" className="btn refresh-btn" onClick={fetchStores} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </form>
        </section>

        {error && (
          <div className="error-alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <section className="stores-section">
          <h2>Your Stores ({(stores ?? []).length})</h2>

          {loading && (stores ?? []).length === 0 ? (
            <div className="loading">Loading stores...</div>
          ) : (stores ?? []).length === 0 ? (
            <div className="no-stores">
              <h3>No stores yet</h3>
              <p>Create your first store using the form above</p>
            </div>
          ) : (
            <div className="stores-grid">
              {(stores ?? []).map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onDelete={handleDeleteStore}
                  isDeleting={deleting === store.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
