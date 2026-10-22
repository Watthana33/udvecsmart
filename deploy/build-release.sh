#!/bin/sh
# รันใน node:20-alpine (จาก GitHub Actions) — ประกอบไฟล์ release: backend ที่ compile แล้วพร้อม node_modules + frontend ที่ build แล้ว
# ขั้นตอน backend เลียนแบบ backend/Dockerfile (npm ci --omit=dev + prisma generate) เพื่อให้ได้ไฟล์เหมือนในอิมเมจ
set -eu
: "${TAG:?}" "${COMMIT:?}" "${ARCH:?}"
apk add --no-cache openssl tar >/dev/null

ROOT=$(pwd)
BUILD=/tmp/build
OUT="$ROOT/dist-release"
STAGE=/tmp/stage
rm -rf "$BUILD" "$STAGE" "$OUT"
mkdir -p "$BUILD" "$STAGE/backend" "$STAGE/frontend" "$OUT"

echo "== backend: compile"
cp -r backend "$BUILD/backend"
(cd "$BUILD/backend" && npm ci && npx prisma generate && npm run build)

echo "== backend: production dependencies"
cp backend/package.json backend/package-lock.json "$STAGE/backend/"
cp -r backend/prisma "$STAGE/backend/prisma"
(cd "$STAGE/backend" && npm ci --omit=dev && npx prisma generate)
cp -r "$BUILD/backend/dist" "$STAGE/backend/dist"

echo "== frontend: build"
cp -r frontend "$BUILD/frontend"
(cd "$BUILD/frontend" && npm ci && npm run build)
cp -r "$BUILD/frontend/dist/." "$STAGE/frontend/"

echo "== manifest"
NEEDS=$(node -e "const r=require('./release.json');process.stdout.write(String(!!r.needsRebuild))")
REASON=$(node -e "const r=require('./release.json');process.stdout.write(r.needsRebuildReason||'')")
API=$(node -e "const r=require('./release.json');process.stdout.write(String(r.launcherApi||1))")
node -e "
const fs=require('fs');
const m={version:process.env.TAG,commit:process.env.COMMIT,platform:'linux-'+process.env.ARCH,builtAt:new Date().toISOString(),launcherApi:Number('$API'),needsRebuild:$NEEDS,needsRebuildReason:process.argv[1]};
fs.writeFileSync('/tmp/stage/manifest.json',JSON.stringify(m,null,2));
fs.writeFileSync('$OUT/udvec-manifest-'+process.env.TAG+'.json',JSON.stringify(m,null,2));
" "$REASON"

NAME="udvec-release-${TAG}-linux-${ARCH}.tar.gz"
tar -czf "$OUT/$NAME" -C "$STAGE" .
(cd "$OUT" && sha256sum "$NAME" > "$NAME.sha256")
ls -la "$OUT"
