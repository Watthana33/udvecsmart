#!/bin/sh
# nginx.selfupdate.conf ต้องต่างจาก frontend/nginx.conf เฉพาะบรรทัด root เท่านั้น (กันสองไฟล์เพี้ยนจากกัน)
set -eu
cd "$(dirname "$0")/../.."
sed 's#root /usr/share/nginx/html;#root /releases/current/frontend;#' frontend/nginx.conf > /tmp/nginx.expected
if ! diff -u /tmp/nginx.expected deploy/central-setup/nginx.selfupdate.conf; then
  echo "nginx.selfupdate.conf ไม่ตรงกับ frontend/nginx.conf — รัน sh deploy/central-setup/sync-nginx.sh แล้ว commit"
  exit 1
fi
echo "nginx conf ตรงกัน"
