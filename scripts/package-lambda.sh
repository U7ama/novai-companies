#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
BUILD_STANDALONE=true NEXT_PUBLIC_AWS_OAC=true NEXT_PUBLIC_APP_URL="https://${DEPLOY_DOMAIN:-novai-companies.usamaaslam.site}" pnpm build
bundle_dir="$project_dir/.aws-build/bundle"
mkdir -p "$project_dir/.aws-build"
if [[ -e "$bundle_dir" ]]; then
  mv "$bundle_dir" "$project_dir/.aws-build/bundle-$(date +%s%N)"
fi
mkdir -p "$bundle_dir"
cp -a .next-lambda/standalone/. "$bundle_dir/"
mkdir -p "$bundle_dir/.next-lambda"
cp -a .next-lambda/static "$bundle_dir/.next-lambda/static"
cp -a public "$bundle_dir/public"
rm -rf "$bundle_dir/.next-lambda/cache"
ln -s /tmp/novai-cache "$bundle_dir/.next-lambda/cache"
cp infra/run.sh "$bundle_dir/run.sh"
chmod 755 "$bundle_dir/run.sh"
# Build artifacts must never contain local credentials or environment files.
find "$bundle_dir" -type f -name '.env*' -delete
artifact="$project_dir/.aws-build/novai-companies.zip"
rm -f "$artifact"
(cd "$bundle_dir" && zip -qry "$artifact" .)
python3 - "$bundle_dir" "$artifact" <<'PY'
import os, sys
from pathlib import Path
bundle, artifact = map(Path, sys.argv[1:])
size = sum(p.stat().st_size for p in bundle.rglob('*') if p.is_file() and not p.is_symlink())
# Leave room for the Lambda adapter layer under Lambda's 250 MiB unpacked limit.
if size > 230 * 1024 * 1024:
    raise SystemExit(f'Bundle is too large: {size} bytes')
print(f'Lambda ZIP: {artifact} ({artifact.stat().st_size} bytes; bundle {size} bytes)')
PY
