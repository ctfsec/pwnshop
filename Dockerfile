FROM node:18-bullseye
WORKDIR /usr/src/app

# Create non-root user for app
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install mysql client and gosu
# bullseye-security dropped off the live mirrors (LTS window ended, packages
# pruned from the CDN). Pin sources to a snapshot.debian.org mirror from
# 2026-08-31 (3 days after the last known-good build) so we get the exact
# same package versions as before, just from an archived mirror.
RUN echo "deb http://snapshot.debian.org/archive/debian/20260831T204404Z bullseye main" > /etc/apt/sources.list \
    && echo "deb http://snapshot.debian.org/archive/debian-security/20260831T211327Z bullseye-security main" >> /etc/apt/sources.list \
    && echo "deb http://snapshot.debian.org/archive/debian/20260831T204404Z bullseye-updates main" >> /etc/apt/sources.list \
    && apt-get -o Acquire::Check-Valid-Until=false update \
    && apt-get install -y --no-install-recommends default-mysql-client gosu \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/src/app/scripts/*.sh && \
    chown -R appuser:appuser /usr/src/app && \
    mkdir -p /usr/src/app/public/uploads && \
    chmod 777 /usr/src/app/public/uploads

# ── Railway hardening (replaces docker-compose.lab.yml restrictions) ──────────

# Replaces `:ro` volume mounts — make source, scripts and SQL snapshot
# read-only so a student with RCE cannot permanently alter lab logic.
# uploads/ and uploads-seed/ are intentionally left writable (healer needs them).
RUN chmod -R a-w /usr/src/app/src && \
    chmod -R a-w /usr/src/app/scripts && \
    chmod    a-w /usr/src/app/pwnshop.sql && \
    chmod -R a-w /usr/src/app/public/uploads-seed

# Replaces `tmpfs: [/tmp, /var/tmp, /run]`
# Sticky bit prevents one process from deleting another process's temp files.
# 1777 = rwxrwxrwt (world-writable + sticky)
RUN chmod 1777 /tmp /var/tmp && \
    mkdir -p /run && chmod 1777 /run

# ──────────────────────────────────────────────────────────────────────────────

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
EXPOSE 3000
CMD ["node", "src/app.js"]