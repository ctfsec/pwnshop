#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        PwnShop Local Setup               ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Auto-generate the lab environment file on first run ──────
if [[ ! -f .env.lab ]]; then
  echo "[*] .env.lab not found - generating one with random secrets..."
  GEN_DB_PASSWORD="$(openssl rand -hex 16)"
  GEN_RESET_TOKEN="$(openssl rand -hex 16)"
  cat > .env.lab <<EOF
DB_NAME=pwnshop
DB_PASSWORD=${GEN_DB_PASSWORD}
LAB_RESET_TOKEN=${GEN_RESET_TOKEN}
HEAL_EVERY_MINUTES=10
VULNBANK_BASE_URL=https://vulnbank.org
VULNBANK_AUTH_MODE=api_key_header
VULNBANK_MERCHANT_API_KEY=
VULNBANK_MERCHANT_JWT=
VULNBANK_CHARGE_PATH=/api/v1/payments/charge
VULNBANK_VERIFY_PATH=/api/v1/payments/{payment_id}
VULNBANK_TIMEOUT_MS=12000
VULNBANK_LAB_VULN=0
EOF
  GENERATED_ENV_LAB=1
fi

# ── Load environment ─────────────────────────────────────────
if [[ -f .env.lab ]]; then
  export $(grep -v '^#' .env.lab | xargs)
fi

# ── Pull the Groq key from .env so the chatbot works ─────────
# README documents putting GROQ_API_KEY in .env, but the lab container
# only sees variables that reach docker compose, so export it here.
if [[ -z "${GROQ_API_KEY:-}" && -f .env ]]; then
  GROQ_API_KEY="$(grep -E '^GROQ_API_KEY=' .env | head -n1 | cut -d= -f2- | tr -d "\"'")"
  export GROQ_API_KEY
fi

DB_NAME="${DB_NAME:-pwnshop}"
DB_PASSWORD="${DB_PASSWORD:-password}"

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
echo "DATABASE CREDENTIALS (Internal Container):"
echo "  Username : root"
echo "  Password : ${DB_PASSWORD}"
echo "  Database : ${DB_NAME}"
echo "------------------------------------------------"
echo "LAB RESET TOKEN: ${LAB_RESET_TOKEN:-<not set>}"
echo ""
if [[ "${GENERATED_ENV_LAB:-}" == "1" ]]; then
  echo "(These were generated and saved to .env.lab - keep that file safe.)"
  echo ""
fi
if [[ -z "${GROQ_API_KEY:-}" ]]; then
  echo "NOTE: GROQ_API_KEY is not set, so the AI chatbot will be disabled."
  echo "      Add GROQ_API_KEY=... to .env.lab and re-run to enable it."
  echo ""
fi
