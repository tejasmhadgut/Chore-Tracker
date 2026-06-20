#!/bin/sh
set -e

PGDATA=/var/lib/postgresql/data

# Only run basebackup if data directory is empty (first start)
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "Initializing replica from primary via pg_basebackup..."
    until pg_basebackup -h postgres -U replicator -D "$PGDATA" -Fp -Xs -R -P 2>/dev/null; do
        echo "Primary not ready yet, retrying in 3s..."
        sleep 3
    done
    echo "pg_basebackup complete."
    chown -R postgres:postgres "$PGDATA"
    chmod 700 "$PGDATA"
fi

# Start postgres as the postgres user
exec su-exec postgres postgres -D "$PGDATA"
