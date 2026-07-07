#!/bin/sh
# Dump database and profile related environment variables into application properties format
env | grep -E '^(DB_|SPRING_DATASOURCE_|SPRING_PROFILES_ACTIVE)' > /tmp/env.properties || true

# Restore execution from the checkpointed files
exec java -XX:+UnlockExperimentalVMOptions -XX:+IgnoreCPUFeatures -XX:CRaCRestoreFrom=/opt/crac-files
