
## 2026-10-21 — setup.sh ไฟล์เดียวสำหรับแอดมินส่วนกลาง (Linux)
- **ทำอะไร:** เพิ่ม `setup.sh` ที่รากโปรเจกต์ รวม bootstrap.sh + คำสั่ง docker compose (prod + selfupdate) เป็นไฟล์เดียว: ตรวจเครื่องมือ (curl/tar/sha256sum/docker compose) → ดาวน์โหลด release ตามสถาปัตยกรรม → ตรวจ SHA-256 → ติดตั้งลง releases/ → up -d --build; รับเวอร์ชัน (vX.Y.Z) และ --no-up; รันซ้ำได้ ปลอดภัย
- **ผลลัพธ์:** ตรวจ syntax ผ่าน (sh -n) และเพิ่มหัวข้อ "วิธีลัด" ใน deploy/central-setup/README.md; ยังไม่ได้รันจริงเพราะยังไม่มี release บน GitHub; ยังไม่ commit
- **เหตุการณ์ระหว่างทำ:** เขียน README/DEVLOG ผ่าน ssh heredoc ที่ไม่ใส่เครื่องหมายคำพูด ทำให้ backtick ถูกรันเป็นคำสั่ง (setup.sh ถูกรันโดยไม่ตั้งใจ) — ล้มเหลวเองที่ขั้นดาวน์โหลด (404 ไม่มี release) ไม่กระทบคอนเทนเนอร์ production เหลือแค่โฟลเดอร์ releases/ ว่าง ลบแล้ว · ป้องกัน: ใช้ heredoc แบบ 'EOF' หรือส่งเป็นไฟล์
