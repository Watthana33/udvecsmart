import { PrismaClient, Role, InstitutionType, NewsCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Comprehensive Database Seeding for UDVECSmart (29 Colleges)...');

  // 1. สร้างรหัสผ่านที่เข้ารหัสด้วย bcrypt
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password@1234', salt);

  // 2. ข้อมูลสถานศึกษาทั้ง 29 แห่งในสังกัด สอจ.อุดรธานี (10 รัฐบาล + 19 เอกชน)
  const institutionsData = [
    // ภาครัฐ (10 แห่ง)
    {
      code: '13410101',
      name: 'วิทยาลัยเทคนิคอุดรธานี',
      type: InstitutionType.PUBLIC,
      director: 'นายธีรภัทร์ ไชยสัตย์',
      website: 'https://www.udtech.ac.th',
      phone: '042-221538',
      address: '115 ถนนทหาร ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 2450, female: 1300,
      v1: 850, v2: 780, v3: 720, d1: 710, d2: 570, b: 120,
      teachers: 145, staff: 48,
      gradV: 680, gradD: 540,
      empIn: 750, empOut: 180, empFree: 120, unemp: 70, study: 100,
      gov: 180, priv: 750, self: 120
    },
    {
      code: '13410102',
      name: 'วิทยาลัยอาชีวศึกษาอุดรธานี',
      type: InstitutionType.PUBLIC,
      director: 'นางสาวนิรชา ประภาสุนทร',
      website: 'https://www.udvc.ac.th',
      phone: '042-221167',
      address: '107 ถนนโพศรี ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 620, female: 2580,
      v1: 720, v2: 680, v3: 650, d1: 610, d2: 540, b: 0,
      teachers: 128, staff: 42,
      gradV: 610, gradD: 510,
      empIn: 680, empOut: 210, empFree: 150, unemp: 50, study: 130,
      gov: 140, priv: 750, self: 150
    },
    {
      code: '13410103',
      name: 'วิทยาลัยสารพัดช่างอุดรธานี',
      type: InstitutionType.PUBLIC,
      director: 'นายประดิษฐ์ ชัยกูล',
      website: 'https://www.udpoly.ac.th',
      phone: '042-243886',
      address: 'ถนนเลี่ยงเมือง ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 780, female: 620,
      v1: 320, v2: 310, v3: 290, d1: 260, d2: 220, b: 0,
      teachers: 62, staff: 25,
      gradV: 270, gradD: 210,
      empIn: 290, empOut: 90, empFree: 60, unemp: 30, study: 50,
      gov: 50, priv: 330, self: 60
    },
    {
      code: '13410104',
      name: 'วิทยาลัยการอาชีพบ้านผือ',
      type: InstitutionType.PUBLIC,
      director: 'นายทรงศักดิ์ ศรีโคตร',
      website: 'https://www.bpc.ac.th',
      phone: '042-282110',
      address: 'ตำบลจำปาโมง อำเภอบ้านผือ จังหวัดอุดรธานี 41160',
      male: 540, female: 410,
      v1: 220, v2: 210, v3: 200, d1: 170, d2: 150, b: 0,
      teachers: 48, staff: 18,
      gradV: 190, gradD: 140,
      empIn: 180, empOut: 60, empFree: 45, unemp: 25, study: 40,
      gov: 30, priv: 210, self: 45
    },
    {
      code: '13410105',
      name: 'วิทยาลัยการอาชีพกุมภวาปี',
      type: InstitutionType.PUBLIC,
      director: 'นายสุรศักดิ์ แก้ววิเชียร',
      website: 'https://www.kice.ac.th',
      phone: '042-377222',
      address: 'ตำบลเวียงคำ อำเภอกุมภวาปี จังหวัดอุดรธานี 41110',
      male: 620, female: 480,
      v1: 260, v2: 240, v3: 230, d1: 200, d2: 170, b: 0,
      teachers: 52, staff: 20,
      gradV: 210, gradD: 160,
      empIn: 210, empOut: 75, empFree: 50, unemp: 20, study: 45,
      gov: 35, priv: 250, self: 50
    },
    {
      code: '13410106',
      name: 'วิทยาลัยการอาชีพหนองหาน',
      type: InstitutionType.PUBLIC,
      director: 'นายเกรียงไกร ธนรักษ์',
      website: 'https://www.nhice.ac.th',
      phone: '042-261234',
      address: 'ตำบลหนองหาน อำเภอหนองหาน จังหวัดอุดรธานี 41130',
      male: 510, female: 390,
      v1: 210, v2: 200, v3: 190, d1: 160, d2: 140, b: 0,
      teachers: 44, staff: 16,
      gradV: 180, gradD: 130,
      empIn: 170, empOut: 55, empFree: 40, unemp: 20, study: 35,
      gov: 25, priv: 200, self: 40
    },
    {
      code: '13410107',
      name: 'วิทยาลัยการอาชีพน้ำโสม',
      type: InstitutionType.PUBLIC,
      director: 'นายสมหมาย มงคลชัย',
      website: 'https://www.nsic.ac.th',
      phone: '042-289123',
      address: 'ตำบลน้ำโสม อำเภอน้ำโสม จังหวัดอุดรธานี 41210',
      male: 430, female: 320,
      v1: 180, v2: 170, v3: 160, d1: 130, d2: 110, b: 0,
      teachers: 38, staff: 15,
      gradV: 150, gradD: 105,
      empIn: 140, empOut: 45, empFree: 35, unemp: 15, study: 30,
      gov: 20, priv: 165, self: 35
    },
    {
      code: '13410108',
      name: 'วิทยาลัยการอาชีพเพ็ญ',
      type: InstitutionType.PUBLIC,
      director: 'นายอำนวย ชาญวิวัฒน์',
      website: 'https://www.pice.ac.th',
      phone: '042-279456',
      address: 'ตำบลเพ็ญ อำเภอเพ็ญ จังหวัดอุดรธานี 41150',
      male: 460, female: 350,
      v1: 190, v2: 180, v3: 170, d1: 140, d2: 130, b: 0,
      teachers: 40, staff: 15,
      gradV: 160, gradD: 120,
      empIn: 150, empOut: 50, empFree: 38, unemp: 18, study: 32,
      gov: 22, priv: 178, self: 38
    },
    {
      code: '13410109',
      name: 'วิทยาลัยเกษตรและเทคโนโลยีอุดรธานี',
      type: InstitutionType.PUBLIC,
      director: 'นายประเสริฐ สุทธิประภา',
      website: 'https://www.udcat.ac.th',
      phone: '042-295345',
      address: 'ตำบลกุดสระ อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 490, female: 280,
      v1: 190, v2: 180, v3: 160, d1: 130, d2: 110, b: 0,
      teachers: 45, staff: 22,
      gradV: 150, gradD: 100,
      empIn: 130, empOut: 40, empFree: 45, unemp: 15, study: 30,
      gov: 35, priv: 135, self: 45
    },
    {
      code: '13410110',
      name: 'วิทยาลัยเทคนิคกาญจนาภิเษก อุดรธานี',
      type: InstitutionType.PUBLIC,
      director: 'นายวิทวัส สุริยะ',
      website: 'https://www.kptud.ac.th',
      phone: '042-325678',
      address: 'ตำบลบ้านจั่น อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 680, female: 320,
      v1: 250, v2: 240, v3: 220, d1: 160, d2: 130, b: 0,
      teachers: 55, staff: 20,
      gradV: 205, gradD: 125,
      empIn: 195, empOut: 55, empFree: 40, unemp: 20, study: 40,
      gov: 30, priv: 220, self: 40
    },

    // ภาคเอกชน (19 แห่ง)
    {
      code: '23410101',
      name: 'วิทยาลัยเทคโนโลยีพิชญบัณฑิต 2',
      type: InstitutionType.PRIVATE,
      director: 'ดร.พิชญ์นภัทร เจริญบัณฑิต',
      website: 'https://www.p-tech.ac.th',
      phone: '042-182399',
      address: 'ตำบลหนองบัว อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 650, female: 580,
      v1: 280, v2: 260, v3: 250, d1: 230, d2: 210, b: 0,
      teachers: 56, staff: 22,
      gradV: 240, gradD: 200,
      empIn: 250, empOut: 85, empFree: 55, unemp: 25, study: 45,
      gov: 25, priv: 310, self: 55
    },
    {
      code: '23410102',
      name: 'วิทยาลัยเทคโนโลยีสันตพล',
      type: InstitutionType.PRIVATE,
      director: 'ดร.กฤษณา วิเศษสมบัติ',
      website: 'https://www.stc.ac.th',
      phone: '042-246555',
      address: 'ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 520, female: 610,
      v1: 260, v2: 240, v3: 230, d1: 210, d2: 190, b: 0,
      teachers: 50, staff: 18,
      gradV: 220, gradD: 180,
      empIn: 230, empOut: 75, empFree: 50, unemp: 20, study: 40,
      gov: 20, priv: 285, self: 50
    },
    {
      code: '23410103',
      name: 'วิทยาลัยเทคโนโลยีพณิชยการอุดรธานี',
      type: InstitutionType.PRIVATE,
      director: 'นายวรศักดิ์ ศิริพรรณ',
      website: 'https://www.upc.ac.th',
      phone: '042-241234',
      address: 'ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 380, female: 490,
      v1: 200, v2: 190, v3: 180, d1: 160, d2: 140, b: 0,
      teachers: 42, staff: 16,
      gradV: 170, gradD: 135,
      empIn: 180, empOut: 55, empFree: 40, unemp: 15, study: 35,
      gov: 15, priv: 220, self: 40
    },
    {
      code: '23410104',
      name: 'วิทยาลัยเทคโนโลยีบริหารธุรกิจอุดรธานี',
      type: InstitutionType.PRIVATE,
      director: 'นางจันทรา วงศ์สว่าง',
      website: 'https://www.ubac.ac.th',
      phone: '042-245678',
      address: 'ตำบลหนองบัว อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 310, female: 440,
      v1: 170, v2: 160, v3: 160, d1: 140, d2: 120, b: 0,
      teachers: 36, staff: 14,
      gradV: 150, gradD: 115,
      empIn: 160, empOut: 45, empFree: 35, unemp: 15, study: 25,
      gov: 12, priv: 193, self: 35
    },
    {
      code: '23410105',
      name: 'วิทยาลัยอาชีวศึกษาพาณิชยการอุดรธานี',
      type: InstitutionType.PRIVATE,
      director: 'นายกิตติกร ภัทรเดช',
      website: 'https://www.voc-udon.ac.th',
      phone: '042-247890',
      address: 'ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 290, female: 410,
      v1: 160, v2: 150, v3: 150, d1: 130, d2: 110, b: 0,
      teachers: 34, staff: 12,
      gradV: 140, gradD: 105,
      empIn: 145, empOut: 45, empFree: 30, unemp: 15, study: 20,
      gov: 10, priv: 180, self: 30
    },
    {
      code: '23410106',
      name: 'วิทยาลัยเทคโนโลยีเอเชีย อุดรธานี',
      type: InstitutionType.PRIVATE,
      director: 'ดร.ศิริชัย ธนเจริญ',
      website: 'https://www.asia-tech.ac.th',
      phone: '042-249123',
      address: 'ตำบลบ้านจั่น อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 340, female: 380,
      v1: 170, v2: 160, v3: 150, d1: 130, d2: 110, b: 0,
      teachers: 35, staff: 14,
      gradV: 145, gradD: 105,
      empIn: 150, empOut: 45, empFree: 32, unemp: 13, study: 25,
      gov: 15, priv: 180, self: 32
    },
    {
      code: '23410107',
      name: 'วิทยาลัยเทคโนโลยีปิ่นศิริ',
      type: InstitutionType.PRIVATE,
      director: 'นางปิ่นแก้ว สิริรัตน์',
      website: 'https://www.pinsiri.ac.th',
      phone: '042-248555',
      address: 'ตำบลหนองนาคำ อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 260, female: 310,
      v1: 130, v2: 120, v3: 120, d1: 110, d2: 90, b: 0,
      teachers: 28, staff: 10,
      gradV: 115, gradD: 85,
      empIn: 120, empOut: 35, empFree: 25, unemp: 10, study: 20,
      gov: 8, priv: 147, self: 25
    },
    {
      code: '23410108',
      name: 'วิทยาลัยเทคโนโลยีวานิชพาณิชยการ',
      type: InstitutionType.PRIVATE,
      director: 'นายวิชิต อารีรัตน์',
      website: 'https://www.wanich.ac.th',
      phone: '042-246789',
      address: 'ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 240, female: 320,
      v1: 130, v2: 120, v3: 120, d1: 100, d2: 90, b: 0,
      teachers: 26, staff: 10,
      gradV: 110, gradD: 85,
      empIn: 115, empOut: 35, empFree: 25, unemp: 10, study: 20,
      gov: 10, priv: 140, self: 25
    },
    {
      code: '23410109',
      name: 'วิทยาลัยเทคโนโลยีธีรภาดา',
      type: InstitutionType.PRIVATE,
      director: 'ดร.ธีรยุทธ ชัยมงคล',
      website: 'https://www.teerapada.ac.th',
      phone: '042-243456',
      address: 'ตำบลบ้านตาด อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 280, female: 340,
      v1: 150, v2: 140, v3: 130, d1: 110, d2: 90, b: 0,
      teachers: 30, staff: 12,
      gradV: 125, gradD: 85,
      empIn: 130, empOut: 40, empFree: 25, unemp: 10, study: 20,
      gov: 10, priv: 160, self: 25
    },
    {
      code: '23410110',
      name: 'วิทยาลัยเทคโนโลยีรัตนมงคล',
      type: InstitutionType.PRIVATE,
      director: 'นายมงคล รัตนพล',
      website: 'https://www.ratanamongkol.ac.th',
      phone: '042-242333',
      address: 'ตำบลหนองบัว อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 210, female: 270,
      v1: 110, v2: 110, v3: 100, d1: 90, d2: 70, b: 0,
      teachers: 24, staff: 10,
      gradV: 95, gradD: 65,
      empIn: 95, empOut: 30, empFree: 20, unemp: 8, study: 17,
      gov: 8, priv: 117, self: 20
    },
    {
      code: '23410111',
      name: 'วิทยาลัยเทคโนโลยีเซนต์ฟรังซีส',
      type: InstitutionType.PRIVATE,
      director: 'ซิสเตอร์มารีอา เดอเลอรีส',
      website: 'https://www.stfrancis.ac.th',
      phone: '042-244111',
      address: 'ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 230, female: 310,
      v1: 130, v2: 120, v3: 110, d1: 100, d2: 80, b: 0,
      teachers: 28, staff: 11,
      gradV: 105, gradD: 75,
      empIn: 110, empOut: 35, empFree: 22, unemp: 8, study: 18,
      gov: 10, priv: 135, self: 22
    },
    {
      code: '23410112',
      name: 'วิทยาลัยเทคโนโลยีอีสานเหนือ',
      type: InstitutionType.PRIVATE,
      director: 'นายอนุชา ศรีสมบัติ',
      website: 'https://www.isan-north.ac.th',
      phone: '042-240999',
      address: 'ตำบลหนองบัว อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 380, female: 410,
      v1: 180, v2: 170, v3: 160, d1: 150, d2: 130, b: 0,
      teachers: 38, staff: 15,
      gradV: 155, gradD: 125,
      empIn: 165, empOut: 50, empFree: 35, unemp: 15, study: 30,
      gov: 15, priv: 200, self: 35
    },
    {
      code: '23410113',
      name: 'วิทยาลัยเทคโนโลยีศรีธาตุ',
      type: InstitutionType.PRIVATE,
      director: 'นายทวีชัย บุญประสิทธิ์',
      website: 'https://www.srithat-tech.ac.th',
      phone: '042-381234',
      address: 'ตำบลศรีธาตุ อำเภอศรีธาตุ จังหวัดอุดรธานี 41230',
      male: 210, female: 250,
      v1: 110, v2: 100, v3: 100, d1: 80, d2: 70, b: 0,
      teachers: 22, staff: 8,
      gradV: 95, gradD: 65,
      empIn: 95, empOut: 28, empFree: 20, unemp: 8, study: 15,
      gov: 8, priv: 115, self: 20
    },
    {
      code: '23410114',
      name: 'วิทยาลัยเทคโนโลยีกุดจับ',
      type: InstitutionType.PRIVATE,
      director: 'นายณรงค์ฤทธิ์ ชนะกุล',
      website: 'https://www.kudchap-tech.ac.th',
      phone: '042-291122',
      address: 'ตำบลเมืองเพีย อำเภอกุดจับ จังหวัดอุดรธานี 41250',
      male: 230, female: 270,
      v1: 120, v2: 110, v3: 100, d1: 90, d2: 80, b: 0,
      teachers: 24, staff: 9,
      gradV: 98, gradD: 75,
      empIn: 105, empOut: 30, empFree: 22, unemp: 8, study: 16,
      gov: 10, priv: 125, self: 22
    },
    {
      code: '23410115',
      name: 'วิทยาลัยเทคโนโลยีบ้านดุง',
      type: InstitutionType.PRIVATE,
      director: 'นายสมคิด วงศ์คำ',
      website: 'https://www.bandung-tech.ac.th',
      phone: '042-271333',
      address: 'ตำบลศรีสุทโธ อำเภอบ้านดุง จังหวัดอุดรธานี 41190',
      male: 250, female: 290,
      v1: 130, v2: 120, v3: 110, d1: 100, d2: 80, b: 0,
      teachers: 26, staff: 10,
      gradV: 105, gradD: 75,
      empIn: 110, empOut: 35, empFree: 22, unemp: 8, study: 18,
      gov: 10, priv: 135, self: 22
    },
    {
      code: '23410116',
      name: 'วิทยาลัยเทคโนโลยีโนนสะอาด',
      type: InstitutionType.PRIVATE,
      director: 'นายประภาส สุขสวัสดิ์',
      website: 'https://www.nonsaat-tech.ac.th',
      phone: '042-391444',
      address: 'ตำบลโนนสะอาด อำเภอโนนสะอาด จังหวัดอุดรธานี 41240',
      male: 210, female: 240,
      v1: 110, v2: 100, v3: 90, d1: 80, d2: 70, b: 0,
      teachers: 22, staff: 8,
      gradV: 85, gradD: 65,
      empIn: 90, empOut: 28, empFree: 18, unemp: 8, study: 14,
      gov: 8, priv: 110, self: 18
    },
    {
      code: '23410117',
      name: 'วิทยาลัยเทคโนโลยีอุดรธานีบริรักษ์',
      type: InstitutionType.PRIVATE,
      director: 'พว.ดร.กานดา สุวรรณเวช',
      website: 'https://www.borirak-ud.ac.th',
      phone: '042-243777',
      address: 'ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 90, female: 420,
      v1: 120, v2: 110, v3: 110, d1: 90, d2: 80, b: 0,
      teachers: 25, staff: 10,
      gradV: 105, gradD: 75,
      empIn: 125, empOut: 25, empFree: 18, unemp: 5, study: 15,
      gov: 25, priv: 125, self: 18
    },
    {
      code: '23410118',
      name: 'วิทยาลัยเทคโนโลยีมหาประชารวมมิตร',
      type: InstitutionType.PRIVATE,
      director: 'นายประสิทธิ์ มหาราช',
      website: 'https://www.mahapracha.ac.th',
      phone: '042-249555',
      address: 'ตำบลหนองบัว อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 190, female: 230,
      v1: 100, v2: 90, v3: 90, d1: 70, d2: 70, b: 0,
      teachers: 20, staff: 8,
      gradV: 85, gradD: 65,
      empIn: 85, empOut: 28, empFree: 18, unemp: 8, study: 15,
      gov: 8, priv: 105, self: 18
    },
    {
      code: '23410119',
      name: 'วิทยาลัยเทคโนโลยีอินเตอร์เนชั่นแนล อุดรธานี',
      type: InstitutionType.PRIVATE,
      director: 'ดร.ริชาร์ด ชัยวัฒน์',
      website: 'https://www.inter-tech.ac.th',
      phone: '042-248888',
      address: 'ตำบลบ้านเลื่อม อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      male: 260, female: 300,
      v1: 130, v2: 120, v3: 110, d1: 110, d2: 90, b: 0,
      teachers: 28, staff: 11,
      gradV: 105, gradD: 85,
      empIn: 115, empOut: 35, empFree: 22, unemp: 9, study: 19,
      gov: 12, priv: 138, self: 22
    },
  ];

  // 3. Upsert วิทยาลัย, ผู้บริหาร, และ สถิติ
  let count = 0;
  for (const item of institutionsData) {
    count++;
    const inst = await prisma.institution.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        type: item.type,
        website: item.website,
        phone: item.phone,
        address: item.address,
      },
      create: {
        code: item.code,
        name: item.name,
        type: item.type,
        website: item.website,
        phone: item.phone,
        address: item.address,
      },
    });

    // สร้าง/อัปเดต ผู้บริหาร
    const existingPersonnel = await prisma.personnel.findFirst({
      where: { institutionId: inst.id, order: 1 },
    });
    if (existingPersonnel) {
      await prisma.personnel.update({
        where: { id: existingPersonnel.id },
        data: { name: item.director, position: 'ผู้อำนวยการวิทยาลัย' },
      });
    } else {
      await prisma.personnel.create({
        data: {
          name: item.director,
          position: 'ผู้อำนวยการวิทยาลัย',
          order: 1,
          institutionId: inst.id,
        },
      });
    }

    // สร้าง/อัปเดต สถิติปี 2568 ภาคเรียนที่ 1
    const totalV = item.v1 + item.v2 + item.v3;
    const totalD = item.d1 + item.d2;
    const totalStudents = totalV + totalD + item.b;
    const employedTotal = item.empIn + item.empOut + item.empFree;

    await prisma.schoolStat.upsert({
      where: {
        institutionId_academicYear_semester: {
          institutionId: inst.id,
          academicYear: 2568,
          semester: 1,
        },
      },
      update: {
        maleStudents: item.male,
        femaleStudents: item.female,
        vocCert1: item.v1,
        vocCert2: item.v2,
        vocCert3: item.v3,
        highVocCert1: item.d1,
        highVocCert2: item.d2,
        bachelorCount: item.b,
        vocCertCount: totalV,
        highVocCertCount: totalD,
        totalStudents: totalStudents,
        totalTeachers: item.teachers,
        totalStaff: item.staff,
        gradVocCertCount: item.gradV,
        gradHighVocCertCount: item.gradD,
        employedGraduatesCount: employedTotal,
        furtherStudyCount: item.study,
        unemployedCount: item.unemp,
        employedInField: item.empIn,
        employedOutField: item.empOut,
        employedFreelance: item.empFree,
        workGov: item.gov,
        workPrivate: item.priv,
        workSelf: item.self,
      },
      create: {
        institutionId: inst.id,
        academicYear: 2568,
        semester: 1,
        maleStudents: item.male,
        femaleStudents: item.female,
        vocCert1: item.v1,
        vocCert2: item.v2,
        vocCert3: item.v3,
        highVocCert1: item.d1,
        highVocCert2: item.d2,
        bachelorCount: item.b,
        vocCertCount: totalV,
        highVocCertCount: totalD,
        totalStudents: totalStudents,
        totalTeachers: item.teachers,
        totalStaff: item.staff,
        gradVocCertCount: item.gradV,
        gradHighVocCertCount: item.gradD,
        employedGraduatesCount: employedTotal,
        furtherStudyCount: item.study,
        unemployedCount: item.unemp,
        employedInField: item.empIn,
        employedOutField: item.empOut,
        employedFreelance: item.empFree,
        workGov: item.gov,
        workPrivate: item.priv,
        workSelf: item.self,
      },
    });
  }
  console.log(`✅ Seeded all ${count} institutions with directors and detailed statistics!`);

  // 4. สร้าง Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@udpvec.go.th' },
    update: {},
    create: {
      email: 'admin@udpvec.go.th',
      passwordHash: defaultPasswordHash,
      fullName: 'ผู้ดูแลระบบ สอจ.อุดรธานี',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`✅ Super Admin ready: ${superAdmin.email}`);

  // 5. ปรับค่าการตั้งค่าระบบ (UDVECSmart & Year 2568)
  const settings = [
    {
      key: 'system_title',
      value: 'ระบบสารสนเทศ สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (UDVECSmart)',
      description: 'ชื่อทางการของระบบ',
    },
    {
      key: 'current_academic_year',
      value: '2568',
      description: 'ปีการศึกษาปัจจุบัน',
    },
    {
      key: 'current_semester',
      value: '1',
      description: 'ภาคเรียนปัจจุบัน',
    },
    {
      key: 'is_data_submission_open',
      value: 'true',
      description: 'สถานะเปิดรับการบันทึกข้อมูลสถิติจากวิทยาลัย',
    },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('✅ Site settings updated to UDVECSmart & Year 2568.');

  // 6. สร้างข่าวประชาสัมพันธ์ 3 ข่าวสำหรับ Carousel
  const sampleNews = [
    {
      title: 'ยินดีต้อนรับสู่ระบบสารสนเทศอาชีวศึกษาจังหวัดอุดรธานี (UDVECSmart)',
      content: 'สอจ.อุดรธานี ยกระดับการบริหารจัดการข้อมูลสถานศึกษาทั้ง 29 แห่งในจังหวัด เข้าสู่ระบบฐานข้อมูลกลางและสถิติสารสนเทศแบบ Real-time',
      category: NewsCategory.ANNOUNCEMENT,
    },
    {
      title: 'ประกาศเปิดรับการรายงานข้อมูลสถิตินักศึกษาและภาวะการมีงานทำ ปีการศึกษา 2568',
      content: 'ขอเชิญแอดมินสถานศึกษาภาครัฐและเอกชนทุกแห่ง ดำเนินการเข้าสู่ระบบเพื่อบันทึกและยืนยันข้อมูลจำนวนนักเรียนและผู้สำเร็จการศึกษา',
      category: NewsCategory.ACTIVITY,
    },
    {
      title: 'ผลการแข่งขันทักษะวิชาชีพและทักษะวิชาการ ระดับจังหวัดอุดรธานี ประจำปีการศึกษา 2568',
      content: 'ขอแสดงความยินดีกับตัวแทนนักเรียนนักศึกษาอาชีวศึกษาจังหวัดอุดรธานีที่คว้ารางวัลชนะเลิศและเป็นตัวแทนระดับภาคตะวันออกเฉียงเหนือ',
      category: NewsCategory.ACTIVITY,
    },
  ];

  for (const n of sampleNews) {
    const existing = await prisma.news.findFirst({ where: { title: n.title } });
    if (!existing) {
      await prisma.news.create({
        data: {
          title: n.title,
          content: n.content,
          category: n.category,
          isPublished: true,
          authorId: superAdmin.id,
        },
      });
    }
  }
  console.log('✅ Sample news announcements created for Slider/Carousel.');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
