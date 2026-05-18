#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-password}"
DB_NAME="${DB_NAME:-pwnshop}"
SQL_FILE="/usr/src/app/pwnshop.sql"
UPLOADS_DIR="/usr/src/app/public/uploads"
SEED_UPLOADS_DIR="/usr/src/app/public/uploads-seed"

wait_for_mysql() {
  local attempts=30
  local sleep_seconds=2
  local i

  for ((i=1; i<=attempts; i++)); do
    if mysql --protocol=tcp --ssl=0 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
      return 0
    fi
    echo "Waiting for MySQL at $DB_HOST ($i/$attempts)..."
    sleep "$sleep_seconds"
  done

  echo "MySQL did not become ready after $((attempts * sleep_seconds)) seconds" >&2
  return 1
}

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Missing SQL snapshot: $SQL_FILE" >&2
  exit 1
fi

wait_for_mysql

# Backup visitor_stats so persistent counters survive the reset
VS_BACKUP="/tmp/visitor_stats_backup.sql"
mysqldump --protocol=tcp --ssl=0 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
  --no-create-info --skip-triggers "$DB_NAME" visitor_stats > "$VS_BACKUP" 2>/dev/null || true

mysql --protocol=tcp --ssl=0 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
  -e "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\`;"

mysql --protocol=tcp --ssl=0 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE"

# ── Clear runtime-accumulated data so every reset is a clean slate ──────────
# audit_log / audit_logs  : action history from student activity
# transactions            : payment records (prevents replay artifacts carrying over)
# otp_codes               : stale one-time passwords
# vulnbank_tx_log         : already wiped by DROP/CREATE above, listed here for clarity
mysql --protocol=tcp --ssl=0 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<'SQL'
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_log;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE transactions;
TRUNCATE TABLE otp_codes;
SET FOREIGN_KEY_CHECKS = 1;
SQL

echo "Runtime tables cleared (audit_log, audit_logs, transactions, otp_codes)."

# Restore visitor_stats
if [[ -f "$VS_BACKUP" ]] && [[ -s "$VS_BACKUP" ]]; then
  mysql --protocol=tcp --ssl=0 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$VS_BACKUP" || true
  echo "Visitor stats restored."
fi

mkdir -p "$UPLOADS_DIR"
find "$UPLOADS_DIR" -mindepth 1 -delete

if [[ -d "$SEED_UPLOADS_DIR" ]]; then
  cp -r --no-preserve=mode,ownership "$SEED_UPLOADS_DIR"/. "$UPLOADS_DIR"/
fi

echo "Lab reset finished at $(date -u +%Y-%m-%dT%H:%M:%SZ)"