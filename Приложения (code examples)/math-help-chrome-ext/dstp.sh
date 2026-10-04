APP_CONTAINERS=("math-help-proxy" "math-help-api" "math-help-api-pg")
# Stop all the application containers
for container in "${APP_CONTAINERS[@]}"; do
  echo "Stopping container: $container"
  docker stop "$container"
done
