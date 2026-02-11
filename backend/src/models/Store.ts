export interface Store {
  id: string;
  name: string;
  engine: 'woocommerce' | 'medusa';
  status: 'provisioning' | 'ready' | 'failed' | 'deleting';
  namespace: string;
  urls?: string;
  created_at: Date;
  updated_at: Date;
  user_id: string;
  error_message?: string;
}

export interface CreateStoreRequest {
  name: string;
  engine: 'woocommerce' | 'medusa';
  user_id?: string;
}

export interface StoreEvent {
  id: number;
  store_id: string;
  event_type: string;
  message?: string;
  created_at: Date;
}
