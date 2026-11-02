#!/bin/bash
set -euo pipefail
cd "${LAMBDA_TASK_ROOT}"
mkdir -p /tmp/novai-cache
export HOSTNAME=0.0.0.0
export PORT=8080
exec node server.js
