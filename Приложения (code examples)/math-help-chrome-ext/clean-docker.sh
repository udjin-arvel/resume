#!/bin/bash
# clean-docker.sh

echo "=== Docker Disk Usage Before ==="
docker system df

echo "=== Removing unused images ==="
docker image prune -a -f

echo "=== Removing stopped containers ==="
docker container prune -f

echo "=== Removing build cache ==="
docker builder prune -f

echo "=== Docker Disk Usage After ==="
docker system df