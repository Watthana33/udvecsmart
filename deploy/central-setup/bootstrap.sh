#!/bin/sh
# ติดตั้งเวอร์ชันแรกลงโฟลเดอร์ releases/ (รันครั้งเดียวบนเครื่องโฮสต์ ก่อนเปิดโหมดอัปเดตตัวเอง)
# ใช้: sh deploy/central-setup/bootstrap.sh [vX.Y.Z]   (ไม่ใส่ = เวอร์ชันล่าสุด)
set -eu
cd "$(dirname "$0")/../.."
REPO="${GITHUB_REPO:-Watthana33/udvecsmart}"
case "$(uname -m)" in aarch64|arm64) ARCH=arm64 ;; *) ARCH=amd64 ;; esac
TAG="${1:-$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1)}"
[ -n "$TAG" ] || { echo "ไม่พบ release บน GitHub"; exit 1; }
NAME="udvec-release-$TAG-linux-$ARCH.tar.gz"
BASE="https://github.com/$REPO/releases/download/$TAG"
mkdir -p releases/versions releases/tmp
echo "ดาวน์โหลด $NAME"
curl -fL "$BASE/$NAME" -o "releases/tmp/$NAME"
curl -fsSL "$BASE/$NAME.sha256" -o "releases/tmp/$NAME.sha256"
(cd releases/tmp && sha256sum -c "$NAME.sha256")
rm -rf "releases/versions/$TAG"
mkdir -p "releases/versions/$TAG"
tar -xzf "releases/tmp/$NAME" -C "releases/versions/$TAG"
ln -sfn "versions/$TAG" releases/current
cp deploy/launcher.mjs releases/launcher.mjs
rm -f "releases/tmp/$NAME" "releases/tmp/$NAME.sha256"
echo "ติดตั้ง $TAG เรียบร้อย — ขั้นต่อไปดู deploy/central-setup/README.md ข้อ 3"
