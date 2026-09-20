@echo off
chcp 65001 > nul
echo ===================================================
echo 🚀 เริ่มต้นการทำงานระบบ UDVECSmart (สอจ.อุดรธานี)
echo ===================================================
echo กำลังเปิดเซิร์ฟเวอร์ Backend (Port 5000)...
start "UDVECSmart Backend (Port 5000)" cmd /k "cd /d %~dp0backend && npm.cmd run dev"

echo กำลังเปิดเซิร์ฟเวอร์ Frontend (Port 5173)...
start "UDVECSmart Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo ===================================================
echo ✅ เปิดระบบเรียบร้อยแล้ว!
echo - หน้าเว็บ (Frontend): http://localhost:5173
echo - บริการข้อมูล (Backend): http://localhost:5000
echo ===================================================
pause
