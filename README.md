https://trip-together-ivory.vercel.app
# TripTogether ✈️

เว็บไซต์ช่วยนัดวันเที่ยวกับเพื่อน แก้ปัญหาการหาวันและเวลาว่างที่ตรงกันได้ยาก! โดยระบบจะให้เพื่อนแต่ละคนโหวตวันว่าง และคำนวณ "วันที่ดีที่สุด" ให้โดยอัตโนมัติ

## 🌟 ฟีเจอร์หลัก
* **ไม่ต้องสมัครสมาชิก**: ทั้งคนสร้างและคนเข้าร่วม แค่มีลิงก์ก็ใช้งานได้เลย
* **ระบุสถานะวันว่าง**: ว่างแน่นอน / อาจจะว่าง / ไม่ว่าง
* **ระบุช่วงเวลา (Time slots)**: เช้า / บ่าย / เย็น
* **สรุปวันที่ตรงกัน (Best Match)**: คำนวณและจัดอันดับวันที่มีคนว่างมากที่สุดให้อัตโนมัติ
* **ระบบจัดการสำหรับเจ้าของทริป (Owner)**: ควบคุมการปิด/เปิดโหวต และกดยืนยันวันนัดหมายจริง

## 🛠 เทคโนโลยีที่ใช้
* **Frontend**: Next.js 14, React 18, Tailwind CSS (แยกฝั่ง Client ชัดเจน)
* **Backend**: Node.js, Express.js, TypeScript (REST API)
* **Database**: PostgreSQL
* **ORM**: Prisma
* **Deployment (Local)**: Docker Compose สำหรับ Database

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Local Development)

### 1. สิ่งที่ต้องมีในเครื่อง (Prerequisites)
- [Node.js](https://nodejs.org/en/) (เวอร์ชัน 18 ขึ้นไป)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (สำหรับรัน PostgreSQL)

### 2. โคลนและเข้าสู่โฟลเดอร์โปรเจกต์
```bash
git clone https://github.com/yourusername/triptogether.git
cd triptogether
```

### 3. ตั้งค่า Environment Variables
โปรเจกต์นี้แยก Environment เป็น 3 ส่วน
1. ที่ Root ของโปรเจกต์ (สำหรับ Docker) มีไฟล์ `.env` ที่สร้างมาให้แล้ว
2. ที่โฟลเดอร์ `server` (สำหรับ Backend) สร้างไฟล์ `.env` โดยคัดลอกรูปแบบจาก `server/.env.example`
3. ที่โฟลเดอร์ `client` (สำหรับ Frontend) สร้างไฟล์ `.env.local` โดยคัดลอกรูปแบบจาก `client/.env.example`

*(ไฟล์ `.env` ถูกตั้งค่าพื้นฐานสำหรับ Development ไว้เรียบร้อยแล้ว)*

### 4. เปิดฐานข้อมูล PostgreSQL ด้วย Docker
ต้องเปิดโปรแกรม Docker Desktop ทิ้งไว้ก่อนรันคำสั่ง
```bash
docker compose up -d
```
ระบบจะดึง Image ของ `postgres:16-alpine` และรันบนพอร์ต **5433** เพื่อหลีกเลี่ยงการชนกับ Postgres ในเครื่อง

### 5. ติดตั้งและตั้งค่า Backend (Server)
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```
Backend จะทำงานที่ `http://localhost:3001`

### 6. ติดตั้งและตั้งค่า Frontend (Client)
เปิดอีก Terminal หนึ่งและรันคำสั่ง:
```bash
cd client
npm install
npm run dev
```
Frontend จะทำงานที่ `http://localhost:3000`

### 7. เปิดใช้งาน
เข้าสู่เว็บไซต์ผ่านเบราว์เซอร์: [http://localhost:3000](http://localhost:3000)

---

## 💡 วิธีการใช้งาน
1. **สร้างทริป**: กด "สร้างทริปใหม่" กรอกชื่อทริปและเลือกช่วงวันที่ต้องการนัด
2. **แชร์ลิงก์**: คัดลอกลิงก์เชิญ (Invite Link) ส่งให้เพื่อนๆ
3. **เข้าร่วมและโหวต**: เพื่อนที่คลิกลิงก์จะเข้าสู่หน้ากรอกชื่อ และสามารถกด "เลือกวันว่าง" ของตนเองได้
4. **ดูผลลัพธ์**: เข้าไปที่แท็บ "วันที่ดีที่สุด" (Best Matches) เพื่อดูว่าวันไหนเพื่อนๆ ว่างตรงกันมากที่สุด
5. **ยืนยันวันนัด**: เมื่อผลลัพธ์ลงตัว เจ้าของทริปสามารถกดปุ่ม "ยืนยันวันนัด" (ในแท็บจัดการทริป) เพื่อประกาศวันเที่ยวอย่างเป็นทางการ!

---

## 📝 การทดสอบ (Unit Tests)
มีการเขียน Unit test สำหรับ Business Logic สำคัญ นั่นคือ "ระบบการคำนวณวันตรงกัน (Best Match)" สามารถรันได้ด้วยคำสั่ง:
```bash
cd server
npm test
```

## ⚠️ ข้อจำกัดในเวอร์ชัน MVP
- ระบบใช้การบันทึก "สิทธิ์ความเป็นเจ้าของ (Owner Token)" และ "สิทธิ์ผู้เข้าร่วม (Participant Token)" ไว้ใน `localStorage` ของเบราว์เซอร์ หมายความว่าถ้าผู้ใช้เปลี่ยนเบราว์เซอร์ หรือเคลียร์ Cache จะไม่สามารถแก้ไขข้อมูลเดิมได้ (เพื่อความรวดเร็วในการใช้งานโดยไม่ต้องมีระบบ Login)

---
*นัดวันเที่ยวให้ตรงกัน เพราะทุกคนควรมีวันที่สะดวก — TripTogether*
