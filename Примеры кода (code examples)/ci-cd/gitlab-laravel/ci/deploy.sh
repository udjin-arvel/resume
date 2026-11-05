#!/bin/sh
# Выполняется на сервере через `ssh ... sh -s < ci/deploy.sh`.
#   MODE=deploy   — подтянуть образы с IMAGE_TAG, поднять стек, прогнать миграции
#   MODE=rollback — вернуть предыдущий тег (миграции не откатываются: они должны быть обратно совместимы)
set -eu

: "${DEPLOY_PATH:?}" "${COMPOSE_FILE:?}" "${CI_REGISTRY_IMAGE:?}"
cd "$DEPLOY_PATH"

if [ ! -f .env ]; then
  echo "Нет $DEPLOY_PATH/.env: создайте его на сервере до первого деплоя" >&2
  exit 1
fi

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }
artisan() { compose exec -T app php artisan "$@"; }

up() {
  export IMAGE_TAG="$1"
  compose pull app nginx smtp-proxy
  compose up -d --remove-orphans
}

case "${MODE:-deploy}" in
  deploy)
    : "${IMAGE_TAG:?}"
    echo "$REGISTRY_PASSWORD" | docker login -u "$REGISTRY_USER" --password-stdin "$REGISTRY"

    [ -f .release ] && cp .release .release.previous
    mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
             storage/logs storage/app/public bootstrap/cache

    up "$IMAGE_TAG"
    artisan migrate --force
    artisan operations:process --sync
    artisan storage:link || true
    artisan optimize
    artisan horizon:terminate || true   # воркеры перезапустятся на новом коде

    echo "$IMAGE_TAG" > .release
    echo "Выложен релиз $IMAGE_TAG"
    ;;

  rollback)
    if [ ! -f .release.previous ]; then
      echo "Предыдущего релиза нет, откатываться некуда" >&2
      exit 1
    fi
    PREVIOUS="$(cat .release.previous)"
    up "$PREVIOUS"
    artisan optimize
    artisan horizon:terminate || true
    echo "$PREVIOUS" > .release
    echo "Откат на релиз $PREVIOUS"
    ;;

  *)
    echo "Неизвестный MODE=$MODE" >&2
    exit 1
    ;;
esac
