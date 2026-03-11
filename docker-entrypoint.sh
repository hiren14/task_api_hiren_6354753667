#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."

# Wait until postgres accepts connections
until node -e "
  const { Client } = require('pg');
  const c = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  c.connect().then(() => { c.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  echo "  PostgreSQL not ready yet — retrying in 2s..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

echo "🔄 Running database migrations..."
npx knex migrate:latest --knexfile knexfile.ts

if [ "${RUN_SEEDS:-false}" = "true" ]; then
  echo "🌱 Running database seeds..."
  npx knex seed:run --knexfile knexfile.ts
fi

echo "🚀 Starting application..."
exec node dist/server.js
