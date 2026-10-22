# คู่มือแอดมินส่วนกลาง: เปิดระบบอัปเดตเว็บด้วยตัวเอง (ทำครั้งเดียว)

หลังตั้งค่านี้ ผู้ดูแลระบบ สอจ. อัปเดต/ย้อนคืนเวอร์ชันเว็บได้เองจากหน้าแอดมิน โดยไม่ต้องขอให้ rebuild Docker
ระบบไม่ได้รับสิทธิ์ใช้ Docker และไม่ mount `docker.sock` — แค่อ่าน/เขียนโฟลเดอร์ `releases/` ที่กำหนด

## สิ่งที่เปลี่ยนในเครื่อง
| รายการ | รายละเอียด |
|---|---|
| โฟลเดอร์ `releases/` | เก็บเวอร์ชันที่ build แล้ว (`versions/vX.Y.Z`), ตัวชี้ `current`/`previous`, ไฟล์สำรองฐานข้อมูล `backups/` |
| backend | รันผ่าน `launcher.mjs` อ่านเวอร์ชันจาก `releases/current` และสลับกลับเวอร์ชันเดิมเองถ้าเวอร์ชันใหม่เริ่มไม่ขึ้น |
| frontend (nginx) | อ่านไฟล์เว็บจาก `releases/current/frontend` (อ่านอย่างเดียว) |
| อิมเมจ backend | เพิ่ม `postgresql16-client` (สำหรับสำรองฐานข้อมูล) — ต้อง build ครั้งนี้ครั้งเดียว |

## วิธีลัด (ไฟล์เดียว)
ที่โฟลเดอร์โปรเจกต์รัน `sh setup.sh` (ทำข้อ 2–3 ให้ทั้งหมด; ระบุเวอร์ชันได้ เช่น `sh setup.sh v1.0.0`, ใส่ `--no-up` ถ้าจะรัน compose เอง) แล้วไปข้อ 4

## ขั้นตอน
1. อัปเดตโค้ดโปรเจกต์เป็นเวอร์ชันที่มีโฟลเดอร์ `deploy/` (เวอร์ชันที่ติดแท็กแล้ว)
2. ติดตั้งเวอร์ชันแรกลง `releases/`:
   `sh deploy/central-setup/bootstrap.sh`   (ต้องมี curl, tar; เครื่อง arm64/amd64 เลือกให้อัตโนมัติ)
3. เปิดโหมดอัปเดตตัวเอง (build อิมเมจ backend ครั้งเดียว):
   `docker compose -f docker-compose.prod.yml -f deploy/central-setup/docker-compose.selfupdate.yml up -d --build`
4. เปิดหน้าแอดมิน → แท็บ "อัปเดตระบบ" → กด "ตรวจสุขภาพระบบ" ต้องผ่านทุกข้อ

## ความปลอดภัย
- เฉพาะ SUPER_ADMIN สั่งอัปเดตได้ และดึงไฟล์จาก GitHub repo ที่กำหนดใน `GITHUB_REPO` เท่านั้น (ผู้ใช้เลือก repo ไม่ได้)
- ตรวจ SHA-256 ก่อนติดตั้งทุกครั้ง และปฏิเสธไฟล์ที่มีพาธอันตราย
- ก่อนสลับเวอร์ชันจะสำรองฐานข้อมูลเก็บ 5 ไฟล์ล่าสุดที่ `releases/backups/`

## กรณีที่ยังต้องให้แอดมินส่วนกลางทำเอง
เวอร์ชันที่เปลี่ยน base image, `docker-compose`, หรือ `frontend/nginx.conf` จะถูกระบุ `needsRebuild` ในไฟล์ `release.json` ระบบจะไม่ติดตั้งและแจ้งเหตุผลในหน้าแอดมิน
(เมื่อแก้ nginx.conf ให้รัน `sh deploy/central-setup/sync-nginx.sh` แล้ว commit ด้วย)

## ย้อนกลับไปโหมดเดิม
เอาไฟล์ `-f deploy/central-setup/docker-compose.selfupdate.yml` ออกแล้ว `up -d --build` — ใช้โค้ดที่ฝังในอิมเมจตามเดิม
