export interface Store {
  id: string;
  name: string;
  engine: 'woocommerce' | 'medusa';
  status: 'provisioning' | 'ready' | 'failed' | 'deleting';
  namespace: string;
  urls?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  error_message?: string;
}

export interface StoreEvent {
  id: number;
  store_id: string;
  event_type: string;
  message?: string;
  created_at: string;
}

export interface CreateStoreRequest {
  name: string;
  engine: 'woocommerce' | 'medusa';
}
