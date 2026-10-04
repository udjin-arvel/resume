#!/bin/bash
now=$(date +%Y-%m-%d-%H%M%S)
db=math-help-api-pg
path=/root/server/math-help-ai-v2/db_backups  # Use full path

/usr/bin/docker exec math-help-api-pg pg_dump -U postgres > "${path}/${now}.sql" 2>&1  # Full path to docker, redirect stderr
cp "${path}/${now}.sql" "${path}/latest.sql"
