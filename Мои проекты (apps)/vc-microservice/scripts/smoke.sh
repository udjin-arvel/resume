#!/bin/sh
# End-to-end check of a running stack (make up): health, 415, upload → poll →
# download through nginx, faststart. Requires curl and ffmpeg (or an existing
# backend/testdata/sample.mov).
set -eu

URL="${URL:-http://localhost:8080}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
SAMPLE="$DIR/backend/testdata/sample.mov"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }
json() { sed -n "s/.*\"$1\":\"\{0,1\}\([^\",}]*\).*/\1/p"; }

echo "smoke test against $URL"

code=$(curl -s -o "$TMP/h" -w '%{http_code}' "$URL/api/health")
[ "$code" = 200 ] && grep -q '"status":"ok"' "$TMP/h" && pass "GET /api/health → 200" || fail "health: $code $(cat "$TMP/h")"

code=$(curl -s -o /dev/null -w '%{http_code}' "$URL/")
[ "$code" = 200 ] && pass "GET / → 200 (SPA)" || fail "SPA: $code"

echo "not a video" > "$TMP/notes.txt"
code=$(curl -s -o /dev/null -w '%{http_code}' -F "file=@$TMP/notes.txt" "$URL/api/jobs")
[ "$code" = 415 ] && pass "non-video → 415" || fail "non-video: $code"

head -c 4096 /dev/urandom > "$TMP/fake.mp4"
code=$(curl -s -o /dev/null -w '%{http_code}' -F "file=@$TMP/fake.mp4" "$URL/api/jobs")
[ "$code" = 415 ] && pass "random bytes named .mp4 → 415" || fail "fake mp4: $code"

[ -f "$SAMPLE" ] || make -C "$DIR" testdata >/dev/null
code=$(curl -s -o "$TMP/r" -w '%{http_code}' -F "file=@$SAMPLE" "$URL/api/jobs")
[ "$code" = 202 ] || fail "upload: $code $(cat "$TMP/r")"
id=$(json id < "$TMP/r")
pass "upload sample.mov → 202 (id $id)"

status=""
for _ in $(seq 1 60); do
  curl -s "$URL/api/jobs/$id" > "$TMP/s"
  status=$(json status < "$TMP/s")
  [ "$status" = completed ] || [ "$status" = failed ] && break
  sleep 1
done
[ "$status" = completed ] && pass "status → completed" || fail "status: $(cat "$TMP/s")"

curl -s -L -o "$TMP/out.mp4" -w '%{http_code} %{content_type}\n' "$URL/api/jobs/$id/download" > "$TMP/d"
grep -q '^200 video/mp4' "$TMP/d" && pass "download via 302 → nginx → video/mp4" || fail "download: $(cat "$TMP/d")"

in=$(wc -c < "$SAMPLE"); out=$(wc -c < "$TMP/out.mp4")
[ "$out" -lt "$in" ] && pass "size $in → $out bytes" || fail "output not smaller: $in → $out"

moov=$(grep -abo moov "$TMP/out.mp4" | head -1 | cut -d: -f1)
mdat=$(grep -abo mdat "$TMP/out.mp4" | head -1 | cut -d: -f1)
[ -n "$moov" ] && [ -n "$mdat" ] && [ "$moov" -lt "$mdat" ] && pass "faststart (moov before mdat)" || fail "faststart"

code=$(curl -s -o /dev/null -w '%{http_code}' -r 0-99 "$URL/files/processed/$id.mp4")
[ "$code" = 206 ] && pass "Range request → 206 (seeking works)" || fail "range: $code"

code=$(curl -s -o /dev/null -w '%{http_code}' "$URL/files/uploaded/")
[ "$code" = 404 ] && pass "/files/uploaded/ not exposed → 404" || fail "uploaded exposed: $code"

echo "all good"
