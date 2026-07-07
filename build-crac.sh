#!/bin/bash
set -e

TARGET_TAG=$1
if [ -z "$TARGET_TAG" ]; then
  echo "Error: Target tag is required."
  echo "Usage: $0 <target-image-tag>"
  exit 1
fi

echo "=== Step 1: Cleaning up any old training containers ==="
docker rm -f crac-checkpoint || true
docker rm -f local-postgres || true
docker network rm crac-net || true

echo "=== Step 2: Building the training Docker image ==="
docker build -t ihavenever:training -f Dockerfile.training .

echo "=== Step 2.5: Starting temporary PostgreSQL database ==="
docker network create crac-net || true
docker run -d --name local-postgres --network crac-net -e POSTGRES_PASSWORD=postgres postgres:16-alpine

echo "Waiting for postgres to start..."
for i in {1..20}; do
  if docker exec local-postgres pg_isready -U postgres; then
    break
  fi
  sleep 1
done

echo "=== Step 3: Running the training container to trigger checkpoint ==="
# We disable exit-on-error during docker run because checkpoint exit codes
# are usually non-zero (137 or 143) as the JVM dumps state and shuts down.
set +e
docker run --privileged --name crac-checkpoint --network crac-net \
  -e "GLIBC_TUNABLES=glibc.pthread.rseq=0" \
  -e "JAVA_TOOL_OPTIONS=-Dspring.context.checkpoint=onRefresh -XX:CPUFeatures=generic -XX:CRaCCheckpointTo=/opt/crac-files" \
  -e "SPRING_PROFILES_ACTIVE=prod" \
  -e "DB_PROFILE=postgres" \
  -e "DB_URL=local-postgres" \
  -e "DB_PORT=5432" \
  -e "DB_NAME=postgres" \
  -e "DB_USER=postgres" \
  -e "DB_PASS=postgres" \
  ihavenever:training
exit_code=$?
set -e

echo "=== Step 3.5: Cleaning up database container and network ==="
docker rm -f local-postgres || true
docker network rm crac-net || true

echo "Training run exited with code: $exit_code"

# Verify that checkpoint files (.img files) are actually written inside the container
# before we try to commit it.
if ! docker cp crac-checkpoint:/opt/crac-files - | tar -tf - | grep -q '\.img$'; then
  echo "Error: Checkpoint files (*.img) were not created in the container!"
  docker rm -f crac-checkpoint || true
  exit 1
fi
echo "Checkpoint files verified successfully!"

# We set the ENTRYPOINT to restore from the /opt/crac-files directory with CPU features ignored since they can differ in production,
# and we clear training-specific environment variables so that production is not overridden by dummy config.
docker commit \
  --change='ENTRYPOINT ["/app/run-app.sh"]' \
  --change='ENV JAVA_TOOL_OPTIONS=""' \
  --change='ENV SPRING_DATASOURCE_URL=""' \
  --change='ENV SPRING_DATASOURCE_DRIVER_CLASS_NAME=""' \
  --change='ENV GLIBC_TUNABLES=""' \
  --change='ENV DB_PROFILE=""' \
  --change='ENV DB_URL=""' \
  --change='ENV DB_PORT=""' \
  --change='ENV DB_NAME=""' \
  --change='ENV DB_USER=""' \
  --change='ENV DB_PASS=""' \
  crac-checkpoint "$TARGET_TAG"

echo "=== Step 5: Cleaning up training container ==="
docker rm -f crac-checkpoint || true

echo "=== CRaC Image successfully created: $TARGET_TAG ==="
