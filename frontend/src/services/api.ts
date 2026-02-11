import axios from 'axios';
import { Store, StoreEvent, CreateStoreRequest } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const storeApi = {
  getStores: async (): Promise<Store[]> => {
    const response = await api.get<{ stores: Store[] }>('/stores');
    return response.data.stores;
  },

  getStore: async (id: string): Promise<Store> => {
    const response = await api.get<{ store: Store }>(`/stores/${id}`);
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
    return response.data.events;
  },
};

export default api;
