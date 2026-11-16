# syntax=docker/dockerfile:1

# ---- build the SPA (TanStack Start in SPA mode → static files) ----
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
# The static output location depends on the build preset (nitro → .output/public,
# plain Vite → dist/client). Collect whichever exists and expose the SPA shell
# as index.html for nginx's try_files fallback.
RUN set -eu; \
    OUT=""; \
    for d in .output/public dist/client dist; do \
      if [ -f "$d/_shell.html" ] || [ -f "$d/index.html" ]; then OUT="$d"; break; fi; \
    done; \
    if [ -z "$OUT" ]; then \
      echo "SPA shell (_shell.html / index.html) not found. HTML files produced:" >&2; \
      find . -name '*.html' -not -path './node_modules/*' >&2; exit 1; \
    fi; \
    echo "Using static output from $OUT"; \
    mkdir -p /site && cp -R "$OUT"/. /site/; \
    if [ -f /site/_shell.html ]; then mv -f /site/_shell.html /site/index.html; fi

# ---- serve with nginx (config is mounted from ../nginx/nginx.conf by compose) ----
FROM nginx:1.27-alpine
COPY --from=build /site /usr/share/nginx/html
EXPOSE 80
