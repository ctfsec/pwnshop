#!/usr/bin/env bash
set -euo pipefail

# ── Load environment ─────────────────────────────────────────
if [[ -f .env.lab ]]; then
  export $(grep -v '^#' .env.lab | xargs)
fi

DB_NAME="${DB_NAME:-pwnshop}"
DB_PASSWORD="${DB_PASSWORD:-password}"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        PwnShop Local Setup               ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Tear down any existing containers and volumes ────────────
echo "[1/5] Cleaning up existing containers and volumes..."
docker compose --env-file .env.lab -f docker/docker-compose.lab.yml down -v 2>/dev/null || true

# ── Build and start containers ───────────────────────────────
echo "[2/5] Building and starting containers..."
docker compose --env-file .env.lab -f docker/docker-compose.lab.yml up --build -d

# ── Wait for MySQL to fully accept root connections ──────────
echo "[3/5] Waiting for MySQL to be ready..."
ATTEMPTS=0
MAX_ATTEMPTS=40
until docker exec docker-db-1 mysql -u root -p"${DB_PASSWORD}" \
  -e "SELECT 1;" 2>/dev/null | grep -q "1"; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [[ $ATTEMPTS -ge $MAX_ATTEMPTS ]]; then
    echo ""
    echo "ERROR: MySQL did not become ready after $((MAX_ATTEMPTS * 2)) seconds."
    echo "Check logs with: docker logs docker-db-1"
    exit 1
  fi
  printf "."
  sleep 2
done
echo " ready!"

# ── Create database and import schema ────────────────────────
echo "[4/5] Creating database and importing schema..."
docker exec docker-db-1 mysql -u root -p"${DB_PASSWORD}" \
  -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`; CREATE DATABASE \`${DB_NAME}\`;" 2>/dev/null

docker exec -i docker-db-1 mysql -u root -p"${DB_PASSWORD}" "${DB_NAME}" \
  < pwnshop.sql 2>/dev/null

# Verify import
TABLE_COUNT=$(docker exec docker-db-1 mysql -u root -p"${DB_PASSWORD}" "${DB_NAME}" \
  -e "SHOW TABLES;" 2>/dev/null | wc -l)

if [[ $TABLE_COUNT -lt 5 ]]; then
  echo "ERROR: Database import failed — only $TABLE_COUNT tables found."
  exit 1
fi
echo "      Database imported successfully ($TABLE_COUNT tables)."

# ── Copy seed images into uploads volume ─────────────────────
echo "[5/5] Copying seed images..."
UPLOADS_VOLUME=$(docker volume inspect docker_uploads_data --format '{{.Mountpoint}}' 2>/dev/null || true)

if [[ -n "$UPLOADS_VOLUME" ]]; then
  sudo cp public/uploads-seed/* "$UPLOADS_VOLUME"/
  sudo chown -R 999:999 "$UPLOADS_VOLUME"/
  echo "      Seed images copied."
else
  echo "      Warning: Could not find uploads volume — images may not show until first reset."
fi

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  PwnShop is ready!                       ║"
echo "║  Visit: http://localhost:3000            ║"
echo "╚══════════════════════════════════════════╝"
echo ""