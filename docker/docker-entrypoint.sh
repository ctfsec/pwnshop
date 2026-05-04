#!/usr/bin/env bash
set -euo pipefail

UPLOADS_DIR="/usr/src/app/public/uploads"
APP_USER="appuser"

mkdir -p "$UPLOADS_DIR"

# Some Docker storage backends (including rootless/userns-remap setups) do not
# allow chown on mounted volumes. Make the uploads tree writable instead of
# failing startup, so the lab reset can delete and restore seed uploads.
if ! chown -R "$APP_USER:$APP_USER" "$UPLOADS_DIR" 2>/dev/null; then
  chmod -R u+rwX,go+rwX "$UPLOADS_DIR" 2>/dev/null || true
fi

# On first boot the Railway volume is empty — seed uploads into it so
# product images appear immediately without waiting for the first lab reset.
SEED_DIR="/usr/src/app/public/uploads-seed"
if [[ -d "$SEED_DIR" ]] && [[ -z "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]]; then
  echo "Seeding uploads from uploads-seed..."
  cp -r "$SEED_DIR"/. "$UPLOADS_DIR"/
  echo "Seed complete: $(ls "$UPLOADS_DIR" | wc -l) files copied."
fi

if [[ $# -eq 0 ]]; then
  set -- node src/app.js
fi

gosu "$APP_USER" "$@" 2>/dev/null || exec "$@"