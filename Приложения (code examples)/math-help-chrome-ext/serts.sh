#!/usr/bin/env bash
set -euo pipefail
for vol in $(docker volume ls -q); do
  mp=$(docker volume inspect --format '{{ .Mountpoint }}' "$vol")           # абсолютный путь тома на хосте
  echo "===== ТОМ: $vol  ($mp)"
  found=$(find "$mp" -maxdepth 4 -type f \( -name 'privkey.pem' -o -name 'fullchain.pem' -o -name 'cert.pem' \) -print | head)
  if [[ -n "$found" ]]; then
    echo "$found"                                                           # выводим найденные сертификаты или их фрагменты
  else
    echo "⨯   сертификаты не обнаружены"
  fi
done
