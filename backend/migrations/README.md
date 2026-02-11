# Database Migrations

This directory contains SQL migration files for the platform database.

## Migration Files

### 001_initial_schema.sql
- Creates `stores` table with all columns and constraints
- Creates `store_events` table for audit logging
- Creates indexes for performance
- Creates `updated_at` trigger
- Creates `schema_migrations` tracking table

## Running Migrations

### Method 1: Using psql (Manual)

```bash
# Connect to database
psql postgresql://postgres:password@localhost:5432/store_platform

# Run migration
\i migrations/001_initial_schema.sql
```

### Method 2: Using Node.js Script

```bash
cd backend
npm run migrate
```

### Method 3: Using db-migrate (Recommended for Production)

```bash
# Install db-migrate
npm install -g db-migrate db-migrate-pg

# Create database.json config
cat > database.json <<EOF
{
  "dev": {
    "driver": "pg",
    "user": "postgres",
    "password": "password",
    "host": "localhost",
    "database": "store_platform"
  },
  "prod": {
    "driver": "pg",
    "user": {"ENV": "DB_USER"},
    "password": {"ENV": "DB_PASSWORD"},
    "host": {"ENV": "DB_HOST"},
    "database": {"ENV": "DB_NAME"}
  }
}
EOF

# Run migrations
db-migrate up
```

## Creating New Migrations

1. Create new file with sequential number:
   ```
   002_add_new_column.sql
   ```

2. Include migration tracking:
   ```sql
   -- Your changes here

   -- Record migration
   INSERT INTO schema_migrations (version) VALUES ('002_add_new_column')
   ON CONFLICT (version) DO NOTHING;
   ```

3. Test migration:
   ```bash
   psql ... < migrations/002_add_new_column.sql
   ```

## Migration Naming Convention

```
NNN_description.sql

Where:
- NNN = Sequential number (001, 002, 003, ...)
- description = Short description in snake_case
```

Examples:
- 001_initial_schema.sql
- 002_add_user_roles.sql
- 003_add_store_templates.sql

## Rolling Back

To rollback, create a corresponding down migration:

```sql
-- migrations/001_initial_schema_down.sql
DROP TABLE IF EXISTS store_events CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

## Checking Applied Migrations

```sql
SELECT * FROM schema_migrations ORDER BY applied_at;
```

## Best Practices

1. **Always test migrations** on development database first
2. **Never modify existing migrations** - create new ones instead
3. **Include rollback scripts** for production deployments
4. **Use transactions** where possible:
   ```sql
   BEGIN;
   -- Your changes
   COMMIT;
   ```
5. **Document breaking changes** in migration comments
6. **Backup database** before running migrations in production

## Automated Migration on Startup

The backend can automatically run migrations on startup:

```javascript
// backend/src/config/database.ts
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`Applied migration: ${file}`);
  }
}

// Call on startup
runMigrations().catch(console.error);
```

## Production Considerations

### Using Managed Databases

For AWS RDS, GCP Cloud SQL, etc.:

1. Connect via SSL:
   ```javascript
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: { rejectUnauthorized: false }
   });
   ```

2. Use migration tools with SSL support
3. Schedule migrations during maintenance windows
4. Use read replicas for zero-downtime migrations

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
- name: Run database migrations
  run: |
    npm run migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Troubleshooting

### Migration already applied

```
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
```

**Solution:** Migration was already run. Check with:
```sql
SELECT * FROM schema_migrations WHERE version = '001_initial_schema';
```

### Permission denied

```
ERROR: permission denied for schema public
```

**Solution:** Grant permissions:
```sql
GRANT ALL ON SCHEMA public TO your_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
```

### Connection refused

```
ERROR: could not connect to server
```

**Solution:** Check database is running:
```bash
docker ps | grep postgres
kubectl get pods -l app=postgresql
```

## Schema Version

Current schema version: **001**

Last updated: 2026-02-11
