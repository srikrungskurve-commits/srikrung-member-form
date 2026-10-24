# SRIKRUNG CENTRAL HUB — DEMO V1

สถานะ: **DESIGN / DEMO ONLY** (ยังไม่เชื่อมระบบจริง)

## เป้าหมาย
สร้างศูนย์กลางสำหรับเสียบโมดูลฟอร์ม โดยไม่ต้องคัดลอกโค้ด Login ลงทุกฟอร์ม และไม่แก้ Production ขณะทดลอง

## ประตูเข้า 2 ทาง
1. LINE Follow: LINE webhook เก็บ LINE User ID และตรวจการซ้ำ โดยไม่ถือว่าเป็นการ Login หรือพิสูจน์เจ้าของบัญชีเว็บแล้ว
2. Central Login: ตรวจสอบรหัสสมาชิก/รหัสผ่านหรือ LINE login ที่ตรวจ token ฝั่ง server, ออก secure session และตรวจสิทธิ์ทุกครั้ง

ทั้งสองทางต้องเชื่อมกับ **customer_id ถาวรเดียวกัน** หลังพิสูจน์การเป็นเจ้าของบัญชี ห้ามรวมบัญชีจากชื่อหรือเบอร์โทรตรงกันอย่างเดียว

## ส่วนประกอบ
- Identity Core: customer_id, line_user_id (unique), member_id (unique เมื่อมี), membership_status
- Auth Core: password hash / session แยกจาก Member Master
- Permission Core: authorization server-side; Admin/Sub-Admin/Member/Customer
- Module Registry: id, label, url, required_permissions, data_domain, enabled
- Data Adapter: mock สำหรับ DEMO; เปลี่ยนเป็น server API สำหรับใช้งานจริง
- Audit: บันทึก actor/action/time/target สำหรับการแก้ข้อมูลสำคัญ

## โมดูลจิ๊กซอว์ตัวแรก
ฟอร์มสมัครสมาชิกเดิม: สมัครครั้งแรก, ตรวจ referrer ACTIVE, ป้องกัน member_id และ LINE ซ้ำ, เปิดดูข้อมูลเดิม, อัปเดตฟิลด์ที่อนุญาต แยกปุ่มย้อนแก้ก่อนส่งจากการแก้ Record ที่บันทึกแล้ว

## สัญญาช่องเสียบ (Draft)
- GET /api/me → {customer_id, member_id, roles, status, allowed_modules}
- GET /api/modules → รายการโมดูลที่เข้าได้
- GET /api/modules/:moduleId/data → เฉพาะข้อมูลของตัวเองหรือในขอบเขตสิทธิ์
- PUT /api/modules/:moduleId/data → ตรวจ session/permission/validation ก่อนแก้
- POST /api/member/activate → ตรวจสมัครซ้ำและผู้แนะนำแบบ atomic
ทุก endpoint ต้องตรวจฝั่ง server; ไม่เชื่อ member_id / line_user_id ที่ browser ส่งมาเป็นหลักฐานตัวตน

## Data Store
ใช้ Srikrung_Member_Master เป็นฐานลูกค้าตั้งต้นได้ **หลัง** สำรวจ Key และ mapping ของ Scenario เดิม; ยังไม่เปลี่ยน Key/เพิ่ม Data Store จริงในเฟส DEMO. ข้อมูลรถและกรมธรรม์อาจเป็นหลายรายการต่อ customer_id โดยใช้ key แยกรายการ

## เกณฑ์ผ่าน DEMO
1. เปิดจากทาง LINE จำลองหรือ Login จำลองพบ customer_id เดียวกัน
2. สมัครซ้ำไม่สร้าง record ซ้ำ
3. เปิดฟอร์มซ้ำคืนข้อมูลเดิม; แก้ไขแล้วอ่านค่าที่เปลี่ยนได้
4. ผู้ใช้ A เปิดข้อมูล B ไม่ได้ (ทดสอบทั้ง API จำลองและเมื่อเชื่อม backend)
5. Admin เห็นเฉพาะสิทธิ์ที่ได้รับ; suspended ถูกปฏิเสธ
6. เพิ่มโมดูลใหม่ผ่าน registry ไม่ต้องแก้ Login
7. สถานะ DEMO แสดงชัด ไม่มีการใช้ข้อมูลจริงหรือส่ง Make webhook จริง

## ข้อห้ามก่อนอนุมัติ
- ห้ามแก้ main / Production / Cloudflare deployment
- ห้ามเขียนทับ Srikrung_Member_Master หรือเพิ่ม Make Data Store
- ห้ามใส่ secrets/token/password จริงใน repository หรือ browser
- ก่อนเปลี่ยนระบบจริง ต้อง backup และตรวจ mapping Scenario ที่ใช้อยู่

## งานถัดไป
ตรวจโค้ด Central Login staging และ LINE Follow แบบเต็ม, เขียน adapter แบบ mock พร้อม test, จากนั้นเชื่อมฟอร์มสมัครสมาชิกเดิมบน Staging.
