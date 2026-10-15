#!/bin/bash
BACKUP_DIR=~/db_backups
BACKUP_FILE=(date +\%Y-\%m-\%d_\%H-\%M-\%S)+".sql"
DB_CONTAINER=math-help-api-pg
DB_NAME=math-help-db
APP_CONTAINERS=["math-help-proxy math-help-api math-help-api-pg loki graphana"]

# Stop all the application containers
for container in $APP_CONTAINERS; do
  docker stop $container
done

# Create database
docker exec $DB_CONTAINER createdb -U postgres $DB_NAME

# Copy backup file to container
docker cp $BACKUP_DIR/$BACKUP_FILE $DB_CONTAINER:$BACKUP_FILE

# Restore database
docker exec $DB_CONTAINER sh -c "psql -U postgres -d $DB_NAME < $BACKUP_FILE"

# Start all the application containers
for container in $APP_CONTAINERS; do
  docker start $container
done
