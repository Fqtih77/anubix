#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
backup_dir="$(pwd)/.anubix-backups"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
filename="anubix-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"

docker compose -f compose.prod.yaml stop web mail
restart_services() {
  docker compose -f compose.prod.yaml start web mail
}
trap restart_services EXIT

docker compose -f compose.prod.yaml run --rm --no-deps --user root \
  --volume "$backup_dir:/backup" --entrypoint sh web \
  -c 'tar -czf "/backup/$1" -C /app/data .' sh "$filename"

printf 'Yedek hazır: %s/%s\n' "$backup_dir" "$filename"
