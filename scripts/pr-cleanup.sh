#!/usr/bin/env bash
set -eo pipefail

PR_NUMBER="${1}"

if [[ -z "${PR_NUMBER}" ]]; then
  echo "Usage: $0 <PR_NUMBER>"
  exit 1
fi

SERVICE_NAME="ihavenever-pr-${PR_NUMBER}"
SCHEMA_NAME="pr_${PR_NUMBER}"

echo "=== Pull Request #${PR_NUMBER} Ephemeral Environment Teardown ==="

# 1. Delete the Cloud Run service
echo "Deleting Cloud Run service: ${SERVICE_NAME}..."
if gcloud run services delete "${SERVICE_NAME}" --region="europe-west1" --quiet; then
  echo "Successfully deleted Cloud Run service ${SERVICE_NAME}."
else
  echo "Cloud Run service ${SERVICE_NAME} not found or failed to delete. Skipping."
fi

# 2. Drop PostgreSQL Schema in Supabase
if [[ -z "${DB_PASS}" ]]; then
  echo "Attempting to retrieve DB_PASS from existing 'ihavenever' Cloud Run service..."
  DB_PASS=$(gcloud run services describe ihavenever --region="europe-west1" --format="value(spec.template.spec.containers[0].env)" 2>/dev/null | grep -oP "'DB_PASS', 'value': '\K[^']+" || true)
  if [[ -n "${DB_PASS}" ]]; then
    echo "Successfully retrieved DB_PASS from GCP."
  else
    echo "Unable to retrieve DB_PASS from GCP. Skipping DB schema deletion."
  fi
fi

if [[ -n "${DB_PASS}" ]]; then
  echo "Dropping database schema: ${SCHEMA_NAME}..."
  
  DB_HOST="aws-1-eu-central-1.pooler.supabase.com"
  DB_PORT="6543"
  DB_USER="postgres.tgdpageqzutxrgupyawq"
  DB_NAME="postgres"

  # Run pg_isready/psql using temporary alpine postgres docker container
  docker run --rm -e PGPASSWORD="${DB_PASS}" postgres:15-alpine \
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    -c "DROP SCHEMA IF EXISTS ${SCHEMA_NAME} CASCADE;"
  
  echo "Successfully dropped database schema ${SCHEMA_NAME}."
else
  echo "DB_PASS variable not set or retrieved. Skipping DB schema deletion."
fi

echo "Teardown complete."
