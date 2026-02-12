import axios from 'axios';
import { Store, StoreEvent, CreateStoreRequest } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include user-id header
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId') || 'default-user';
  config.headers['x-user-id'] = userId;
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const storeApi = {
  getStores: async (): Promise<Store[]> => {
    const response = await api.get<{ stores: Store[] }>('/stores');
    return Array.isArray(response.data?.stores) ? response.data.stores : [];
  },

  getStore: async (id: string): Promise<Store> => {
    const response = await api.get<{ store: Store }>(`/stores/${id}`);
    if (!response.data?.store) throw new Error('Invalid store response');
    return response.data.store;
  },

  createStore: async (data: CreateStoreRequest): Promise<Store> => {
    const response = await api.post<{ store: Store }>('/stores', data);
    return response.data.store;
  },

  deleteStore: async (id: string): Promise<void> => {
    await api.delete(`/stores/${id}`);
  },

  getStoreEvents: async (id: string): Promise<StoreEvent[]> => {
    const response = await api.get<{ events: StoreEvent[] }>(`/stores/${id}/events`);
    return Array.isArray(response.data?.events) ? response.data.events : [];
  },
};

export default api;
