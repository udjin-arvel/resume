# syntax=docker/dockerfile:1

# ---- build ----
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# ---- runtime: Alpine + ffmpeg (libx264, aac) ----
FROM alpine:3.20
RUN apk add --no-cache ffmpeg ca-certificates tzdata \
 && addgroup -S app && adduser -S -G app -u 10001 app \
 && mkdir -p /data/uploaded /data/processed \
 && chown -R app:app /data
# A fresh named volume inherits this ownership on first mount.
VOLUME ["/data"]
COPY --from=build /out/server /usr/local/bin/server
USER app
ENV PORT=8080 DATA_DIR=/data
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1
ENTRYPOINT ["/usr/local/bin/server"]
