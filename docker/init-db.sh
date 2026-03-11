#!/bin/sh
# Runs inside the postgres container on first boot (via /docker-entrypoint-initdb.d/).
# POSTGRES_DB (main DB) is already created by the official image — we just add the test DB.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  SELECT 'CREATE DATABASE tasks_db_test'
  WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'tasks_db_test'
  )\gexec
EOSQL

echo "✅ tasks_db_test database ensured"
