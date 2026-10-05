<div align="center">
  <h1>🎮 Riftbound Live Overlay</h1>
  <p><strong>Professional, web-based live streaming overlay and deck builder for Riftbound broadcasts.</strong></p>
  <a href="https://zberusrift.vercel.app/"><strong>🔗 Live Demo & App URL</strong></a>
</div>

<br />

## 🌟 About This Project

**Riftbound Live Overlay** is a dynamic, web-based system designed to elevate live broadcasts and provide a comprehensive toolset for Riftbound players. Originally built for seamless integration into broadcasting software like OBS Studio, it has evolved into a robust platform featuring a full card library, deck builder, and community deck sharing.

---### 🛒 Card Shop & E-Commerce
Browse and purchase cards and accessories for Riftbound TCG. The checkout flow includes automated PromptPay QR code generation, automated payment slip verification via the SlipOK API, and order tracking (pending → paid → shipped → cancelled).### 📊 Meta Report (TopDeck.gg)
- **Tier List & Statistics:** Per-legend Play Rate, Win Rate (match/game), Top 8 conversions, and championship counts computed from real tournament results.
- **Trend Comparison:** Play share change (percentage points) versus the previous equal-length window.
- **Time Filters:** 7 / 14 / 30 / 90 day windows with a minimum-decks threshold to filter out noise.
- **Leader Card Matching:** Tournament leaders are matched against the local Card database (full name first, e.g. "Akali, Rogue Assassin", with base-name fallback) so the report shows card images.### 🃏 Deck Builder & Management
- **Interactive Deck Builder:** Drag-and-drop or click to build your perfect deck.
- **Rule Enforcement:** Automatically validates deck requirements (1 Legend, 1 Champion sharing a tag with Legend, 3 Battlefields, 12 Runes, Min 40 Main Deck, Max 10 Sideboard).
- **My Decks:** Manage your personal deck collection, edit drafts, and publish decks.
- **Deck Library:** Browse public decks created by the community.
- **Deck View:** Visual breakdown of a deck's composition, grouped cards, average energy cost, and card type distribution.
- **Export/Import:** Easily share and import deck strings.### 📺 Live Overlay Integration
- Works flawlessly as a "Browser Source" in your streaming software.
- Real-time display of game state, live cards, and player stats.### 🎲 Points Tracker
Counters and XP tracker for playing cards at a physical table, with a timer and a 3D coin-toss system.

### 🚀 Roadmap

- [x] Complete Card Library and Deck Builder capabilities.
- [x] Build robust E-Commerce system (Cart, Checkout, PromptPay, Slip Verification).
- [x] Meta Report with tournament-based tier list (powered by TopDeck.gg).
- [ ] Tournament detail pages with full decklist browsing and one-click import into the Deck Builder.
- [ ] Add advanced overlay animations and interactive Twitch/YouTube chat widgets.
- [ ] Automated email/line notifications for order tracking and shipping updates.

## ✨ รายการที่มีอยู่

### 🎴 ฐานข้อมูลการ์ด
- ครบถ้วนเกือบทุกการ์ดใน Riftbound, พร้อมการค้นหาและกรองตาม ชุด, ประเภท (Legend, Champion, Main Deck, ฯลฯ), และ Rarity
- ค้นหาได้ทั้งชื่อการ์ดและรหัสการ์ด
- มีหน้ารายละเอียดการ์ดที่แสดงสกิล, ความสามารถ, และผลของการ์ด

### 🃏 ตัวสร้างเด็ค + การจัดการเด็ค
- **ตัวสร้างเด็ค:** คลิกเพิ่มการ์ดต่าง ๆ ตามข้อกำหนดเด็ค (1 Legend, 1 Champion ที่มีแท็กเดียวกับ Legend, 3 Battlefields, 12 Runes, 40-60 Main Deck, สูงสุด 10 Sideboard)
- **เด็คส่วนตัว (My Decks):** จัดเก็บ, แก้ไข, และแชร์เด็คของคุณ
- **ห้องสมุดเด็คสาธารณะ (Deck Library):** ดูเด็คที่ผู้อื่นแชร์
- **หน้าเด็ค:** ดูรายละเอียดเด็ค, องค์ประกอบ, เฉลี่ย Energy Cost, และประเภทการ์ด
- **นำเข้า/ส่งออกเด็ค:** แชร์เด็คและนำกลับเข้าตัวสร้างเด็คได้ง่ายๆ

### 📺 Live Overlay
- ใช้งานร่วมกับ OBS Studio โดยตรง (ใส่ URL ในส่วน Browser Source)
- แสดงคะแนนและข้อมูลเกมให้ผู้ชมเห็นแบบเรียลไทม์

### 📊 Meta Report (TopDeck.gg)
- ฝังข้อมูลเมตาจากผลทัวร์นาเมนต์จริง
- ดู Tier List, Play Rate, Win Rate, Top 8, และสถิติอื่น ๆ
- เลือกช่วงเวลา 7 / 14 / 30 / 90 วัน
- ตัวจับคู่ Legend และรูปภาพการ์ด

### 🛒 ร้านค้าการ์ดและระบบชำระเงิน
- ซื้อการ์ดและของเล่น (Booster Pack, Starter Deck) ได้โดยตรง
- ระบบชำระเงินผ่าน PromptPay QR
- ตรวจสอบสลิปโอนเงินอัตโนมัติ (SlipOK)
- ติดตามสถานะออเดอร์ (pending → paid → shipped → cancelled) และยกเลิกได้

### 🎛️ แดชบอร์ดแอดมิน
- จัดการฐานข้อมูลการ์ดและชุด (sets) ในระบบ
- จัดการสินค้าในร้านค้า ปรับราคา และสั่งซื้อเพิ่ม (restock)
- ตรวจสอบออเดอร์และสลิปการชำระเงิน
- ซิงก์ข้อมูลทัวร์นาเมนต์จาก TopDeck.gg


## 🚀 How to Use (in OBS Studio)

1. Open **OBS Studio** (or your preferred streaming software).
2. Under the **Sources** panel, click the `+` button and select **Browser**.
3. In the URL field, paste the overlay link generated from the app:
   **[https://zberusrift.vercel.app/](https://zberusrift.vercel.app/)**
4. Set the **Width** and **Height** to match your stream canvas (typically `1920` x `1080`).
5. Click **OK** and enjoy your professional broadcast graphics!

## 🛠️ Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** Next.js API Routes, NextAuth.js
- **Database:** PostgreSQL (via TypeORM)
- **Deployment:** Vercel

---

<div align="center">
  <sub>Designed to enhance the Riftbound streaming and playing experience. 🚀</sub>
</div>

### 🛠️ เทคโนโลยีที่ใช้

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Next.js API Routes, NextAuth.js
- **Database:** PostgreSQL (ผ่าน TypeORM)
- **Deployment:** Vercel
- **Hosting:** GitHub/GitLab (Repo)

## 🚀 Roadmap

- [x] Complete Card Library and Deck Builder capabilities.
- [x] Build robust E-Commerce system (Cart, Checkout, PromptPay, Slip Verification).
- [x] Meta Report with tournament-based tier list (powered by TopDeck.gg).
- [ ] Tournament detail pages with full decklist browsing and one-click import into the Deck Builder.
- [ ] Add advanced overlay animations and interactive Twitch/YouTube chat widgets.
- [ ] Automated email/line notifications for order tracking and shipping updates.

## 🚀 How to Use (in OBS Studio)

1. Open **OBS Studio** (or your preferred streaming software).
2. Under the **Sources** panel, click the `+` button and select **Browser**.
3. Name the source (e.g., "Riftbound Overlay").
4. In the URL field, paste the overlay link generated from the app:
   **[https://zberusrift.vercel.app/](https://zberusrift.vercel.app/)**
5. Set the **Width** and **Height** to match your stream canvas (typically `1920` x `1080`).
6. Click **OK** and enjoy your professional broadcast graphics!

## 🛠️ Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** Next.js API Routes, NextAuth.js
- **Database:** PostgreSQL (via TypeORM)
- **Deployment:** Vercel

---

<div align="center">
  <sub>Designed to enhance the Riftbound streaming and playing experience. 🚀</sub>
</div>
