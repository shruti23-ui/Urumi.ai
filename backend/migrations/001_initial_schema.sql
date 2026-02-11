-- Migration: 001_initial_schema.sql
-- Description: Create stores and store_events tables with indexes
-- Created: 2026-02-11

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    engine VARCHAR(50) NOT NULL CHECK (engine IN ('woocommerce', 'medusa')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('provisioning', 'ready', 'failed', 'deleting')),
    namespace VARCHAR(255) UNIQUE NOT NULL,
    urls JSONB DEFAULT '[]'::jsonb,
    user_id VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(255),
    correlation_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for stores table
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_idempotency ON stores(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_correlation_id ON stores(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_created_at ON stores(created_at);

-- Create store_events table
CREATE TABLE IF NOT EXISTS store_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for store_events table
CREATE INDEX IF NOT EXISTS idx_store_events_store_id ON store_events(store_id);
CREATE INDEX IF NOT EXISTS idx_store_events_created_at ON store_events(created_at);
CREATE INDEX IF NOT EXISTS idx_store_events_type ON store_events(event_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for stores table
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema')
ON CONFLICT (version) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE stores IS 'Stores information for provisioned e-commerce stores';
COMMENT ON COLUMN stores.status IS 'Current status: provisioning, ready, failed, deleting';
COMMENT ON COLUMN stores.engine IS 'Store engine: woocommerce or medusa';
COMMENT ON COLUMN stores.namespace IS 'Kubernetes namespace name (unique per store)';
COMMENT ON COLUMN stores.urls IS 'Array of store URLs (Ingress endpoints)';
COMMENT ON COLUMN stores.idempotency_key IS 'Client-provided idempotency key for safe retries';
COMMENT ON COLUMN stores.correlation_id IS 'Request correlation ID for distributed tracing';

COMMENT ON TABLE store_events IS 'Audit log of store lifecycle events';
COMMENT ON COLUMN store_events.event_type IS 'Event type: created, provisioning, ready, failed, deleted, etc.';
COMMENT ON COLUMN store_events.metadata IS 'Additional event data in JSON format';
