#!/bin/sh
# ตั้งค่าระบบอัปเดตเว็บด้วยตัวเอง ครั้งเดียวจบ (Linux) — สำหรับแอดมินส่วนกลาง
# ใช้: sh setup.sh [vX.Y.Z] [--no-up]
#   vX.Y.Z   เวอร์ชันแรกที่จะติดตั้ง (ไม่ใส่ = เวอร์ชันล่าสุดบน GitHub)
#   --no-up  ติดตั้งลง releases/ อย่างเดียว ยังไม่รัน docker compose
# ทำซ้ำได้ปลอดภัย: รันอีกครั้งจะติดตั้งเวอร์ชันที่ระบุทับและ up -d --build ใหม่
set -eu
cd "$(dirname "$0")"

REPO="${GITHUB_REPO:-Watthana33/udvecsmart}"
export GITHUB_REPO="$REPO"
TAG=""
DO_UP=1
for a in "$@"; do
  case "$a" in
    --no-up) DO_UP=0 ;;
    v*) TAG="$a" ;;
    *) echo "ไม่รู้จักตัวเลือก: $a"; exit 1 ;;
  esac
done

# 1) ตรวจเครื่องมือและไฟล์ที่ต้องมี
need() { command -v "$1" >/dev/null 2>&1 || { echo "ไม่พบคำสั่ง $1 กรุณาติดตั้งก่อน"; exit 1; }; }
need curl; need tar; need sha256sum
[ -f docker-compose.prod.yml ] || { echo "ไม่พบ docker-compose.prod.yml — รันสคริปต์นี้ที่โฟลเดอร์โปรเจกต์"; exit 1; }
[ -f deploy/launcher.mjs ] && [ -f deploy/central-setup/docker-compose.selfupdate.yml ] \
  || { echo "ไม่พบโฟลเดอร์ deploy/ — อัปเดตโค้ดเป็นเวอร์ชันที่ติดแท็กแล้วก่อน"; exit 1; }
if [ "$DO_UP" = 1 ]; then
  docker compose version >/dev/null 2>&1 || { echo "ไม่พบ docker compose"; exit 1; }
fi

# 2) ดาวน์โหลดและติดตั้งเวอร์ชันแรกลง releases/
case "$(uname -m)" in aarch64|arm64) ARCH=arm64 ;; *) ARCH=amd64 ;; esac
if [ -z "$TAG" ]; then
  TAG="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1)"
fi
[ -n "$TAG" ] || { echo "ไม่พบ release บน GitHub ($REPO) — ต้องสร้างแท็กและรอ Actions build ให้เสร็จก่อน"; exit 1; }
NAME="udvec-release-$TAG-linux-$ARCH.tar.gz"
BASE="https://github.com/$REPO/releases/download/$TAG"

mkdir -p releases/versions releases/tmp
echo "[1/3] ดาวน์โหลด $NAME"
curl -fL "$BASE/$NAME" -o "releases/tmp/$NAME"
curl -fsSL "$BASE/$NAME.sha256" -o "releases/tmp/$NAME.sha256"
(cd releases/tmp && sha256sum -c "$NAME.sha256")
rm -rf "releases/versions/$TAG"
mkdir -p "releases/versions/$TAG"
tar -xzf "releases/tmp/$NAME" -C "releases/versions/$TAG"
ln -sfn "versions/$TAG" releases/current
cp deploy/launcher.mjs releases/launcher.mjs
rm -f "releases/tmp/$NAME" "releases/tmp/$NAME.sha256"
echo "[2/3] ติดตั้ง $TAG ลง releases/ เรียบร้อย"

# 3) เปิดโหมดอัปเดตตัวเอง
if [ "$DO_UP" = 1 ]; then
  echo "[3/3] docker compose up -d --build"
  docker compose -f docker-compose.prod.yml -f deploy/central-setup/docker-compose.selfupdate.yml up -d --build
  echo "เสร็จแล้ว — เปิดหน้าแอดมิน แท็บ \"อัปเดตระบบ\" กด \"ตรวจสุขภาพระบบ\" ต้องผ่านทุกข้อ"
else
  echo "[3/3] ข้าม docker compose (--no-up) — รันเองด้วย:"
  echo "  docker compose -f docker-compose.prod.yml -f deploy/central-setup/docker-compose.selfupdate.yml up -d --build"
fi
