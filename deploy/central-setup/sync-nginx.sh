#!/bin/sh
# สร้าง nginx.selfupdate.conf จาก frontend/nginx.conf (ต่างกันเฉพาะบรรทัด root) — รันทุกครั้งที่แก้ frontend/nginx.conf
set -eu
cd "$(dirname "$0")/../.."
sed 's#root /usr/share/nginx/html;#root /releases/current/frontend;#' frontend/nginx.conf > deploy/central-setup/nginx.selfupdate.conf
echo "สร้าง deploy/central-setup/nginx.selfupdate.conf แล้ว"
