#!/bin/bash

# Arguments
EMAIL=$1
NEW_ATTEMPTS=$2

# Docker container and PostgreSQL credentials
CONTAINER_NAME="math-help-api-pg"
POSTGRES_USER="postgres"
POSTGRES_DB="postgres"
POSTGRES_PASSWORD="pass"

# Check if email and attempts are provided
if [ -z "$EMAIL" ] || [ -z "$NEW_ATTEMPTS" ]; then
  echo "Usage: $0 <email> <new_attempts>"
  exit 1
fi

# Run the command inside the PostgreSQL Docker container
docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -c "UPDATE \"user\" SET \"attemptsLeft\" = $NEW_ATTEMPTS WHERE email = '$EMAIL';"
docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -c "UPDATE \"user\" SET \"attemptsUsedToday\" = 0 WHERE email = '$EMAIL';"
if [ $? -eq 0 ]; then
  echo "Successfully updated attempts for user with email: $EMAIL"
else
  echo "Failed to update attempts for user with email: $EMAIL"
fi
