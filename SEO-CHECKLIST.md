# คู่มือ SEO: สิ่งที่ต้องทำเองนอกโค้ด

> ระบบเตรียมของฝั่งเว็บไว้แล้วครบ (sitemap, robots.txt, metadata, JSON-LD)
> เอกสารนี้คือขั้นตอนที่ต้องกดทำเองบนหน้าเว็บภายนอก เรียงตามลำดับ
> ทำขั้นตอนที่ 1–4 ก่อน ใช้เวลารวม ~20 นาที แล้ว Google จะเริ่มจัด index เองใน 3–14 วัน

---

## ขั้นตอนที่ 1 — ตั้ง Environment Variables ใน Vercel (5 นาที)

ระบบอ่านค่าเหล่านี้เพื่อสร้าง sitemap/OG URL ให้ถูกต้อง:

1. เข้า [vercel.com](https://vercel.com) → เลือกโปรเจกต์ → **Settings → Environment Variables**
2. เพิ่มตัวแปร:

| ชื่อ | ค่า | หมายเหตุ |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://riftbound-live-overlay.vercel.app` | URL จริงของเว็บ ถ้ามีโดเมนเองให้ใช้โดเมนนั้นแทน |
| `GOOGLE_SITE_VERIFICATION` | *(ใส่ทีหลัง จากขั้นตอนที่ 2)* | รหัสยืนยัน Search Console |

3. กด **Save** → ไปที่แท็บ **Deployments** → กด **Redeploy** ที่ deployment ล่าสุด
   (ตัวแปรใหม่จะมีผลหลัง redeploy เท่านั้น)

> หมายเหตุ: ถ้ายังไม่ใส่ `NEXT_PUBLIC_SITE_URL` ระบบจะ fallback ไปที่
> `https://riftbound-live-overlay.vercel.app` ให้อัตโนมัติ — ถ้าโดเมนจริงต่างจากนี้ ต้องใส่เอง

---

## ขั้นตอนที่ 2 — ลงทะเบียน Google Search Console (10 นาที)

Search Console = ประตูบานให้ Google รู้จักเว็บและบอกความคืบหน้ากลับมาให้ดู

1. เข้า [search.google.com/search-console](https://search.google.com/search-console) ด้วยบัญชี Google
2. กด **เพิ่มพร็อพเพอร์ตี (Add property)** — เลือกชนิด:

   - **URL prefix** (`https://riftbound-live-overlay.vercel.app`) ← แนะนำสำหรับเริ่ม
   - Domain (`riftbound-live-overlay.vercel.app`) ← ต้องมีโดเมนเอง + แก้ DNS ได้

3. **ยืนยันความเป็นเจ้าของ** — เลือกวิธี "HTML tag":
   - Google จะให้ meta tag มาประมาณ `<meta name="google-site-verification" content="xxx..." />`
   - คัดลอกเฉพาะค่า `content` (ส่วน `xxx...`) → ไปใส่เป็น `GOOGLE_SITE_VERIFICATION` ใน Vercel (ขั้นตอนที่ 1) → Redeploy
   - กลับมาหน้า Search Console กด **Verify** — ระบบของเราเตรียมรองรับการยืนยันแบบนี้ไว้แล้ว

4. **Submit sitemap**:
   - เมนูซ้าย → **Sitemaps**
   - ใส่ `sitemap.xml` ต่อท้าย URL ที่แสดง → กด **Submit**
   - สถานะควรขึ้น "Success" และแสดงจำนวน URL ที่ค้นพบ (ระบบของเรามีหน้าการ์ดทุกใบรวมอยู่ — อาจใช้เวลาสักครู่กว่าจะขึ้นตัวเลข)

5. **เร่ง index หน้าแรก**: เมนู **URL Inspection** (แถบบนสุด) → วาง URL หน้าแรก → กด **Request Indexing** — ทำแบบเดียวกันกับ `/cards`, `/meta`, `/shop`

---

## ขั้นตอนที่ 3 — ซื้อโดเมนเอง (แนะนำอย่างยิ่ง, ~350–500 บาท/ปี)

โดเมนสั้น จำง่าย และมี keyword ช่วย SEO ระยะยาวมากกว่า `*.vercel.app`

1. เลือกชื่อ เช่น `zberusrift.gg`, `riftth.com`, `riftbound.in.th` (เช็คว่ายังว่างก่อน)
2. ซื้อจากผู้ให้บริการ เช่น Namecheap / Cloudflare Registrar / GoDaddy หรือผู้ให้บริการไทย (TAC.th, dot.in.th สำหรับ .in.th / .co.th)
3. ผูกกับ Vercel: **Vercel → Settings → Domains → Add** แล้วทำตามที่ระบบแนะนำ โดยไปตั้งค่าที่ผู้ให้บริการโดเมน:
   - `A record` → `76.76.21.21`
   - `CNAME` สำหรับ `www` → `cname.vercel-dns.com`
4. กลับมาอัปเดต `NEXT_PUBLIC_SITE_URL` ใน Vercel เป็นโดเมนใหม่ → Redeploy
5. ใน Search Console: เพิ่ม property ใหม่สำหรับโดเมนใหม่ด้วย (ทำซ้ำขั้นตอนที่ 2) และตั้ง **redirect จากโดเมนเก่า → ใหม่** ใน Vercel (Settings → Domains → เลือก redirect)

---

## ขั้นตอนที่ 4 — Bing Webmaster Tools (5 นาที, ของฟรีที่คนลืม)

Google ไม่ใช่เสิร์ชเอนจินเดียว — Bing ใช้ใน Microsoft Start/Edge/Copilot

1. เข้า [bing.com/webmasters](https://www.bing.com/webmasters)
2. เลือก **Import from Google Search Console** — ยืนยันด้วยบัญชี Google แล้ว sitemap ทั้งหมดจะถูกดึงไปเอง ไม่ต้อง submit ซ้ำ

---

## ขั้นตอนที่ 5 — ตรวจผลลัพธ์ + ตามต่อ (หลังผ่านไป 1–2 สัปดาห์)

- **ทดสอบหน้าเว็บมองเห็นจาก Google จริงไหม**: ค้นหาใน Google ว่า `site:riftbound-live-overlay.vercel.app` — ขึ้นผล = index แล้ว
- **Search Console → Performance**: ดูว่าคนค้นคำอะไรแล้วเจอเว็บเรา (Impressions/Clicks) — ใช้คำที่คนค้นเยอะแต่เราติดหน้า 2 เหล่านี้เป็น priority ปรับหัวข้อ/เนื้อหาต่อ
- **Search Console → Coverage / Pages**: หน้าไหน "Discovered – not indexed" คือ Google ยังไม่รีบ index — ปกติ ถ้าเนื้อหาดีจะซึมเข้าเอง

---

## ขั้นตอนที่ 6 — ต่อยอดระยะยาว (ทำสัปดาห์ละครั้งพอ)

| กิจกรรม | เหตุผล |
|---|---|
| อัปเดต Meta Report สม่ำเสมอ (Meta Sync) | เนื้อหาใหม่ = Google crawl บ่อยขึ้น, sitemap lastmod เปลี่ยน |
| โพสต์ลิงก์ Meta Report ในกลุ่ม FB/คอมมูนิตี้ Riftbound ไทย | Traffic จาก social เป็นสัญญาณบวกให้ Google จัดอันดับ |
| ให้สตรีมเมอร์ใส่ลิงก์เว็บเราใน Twitch/YouTube panel | Backlink จากเว็บจริงคือตัวแปรอันดับหนึ่งของ SEO |
| เขียนบทความสั้นๆ (เช่น "เด็คไหนแรงสุดเมตานี้") หน้าละ 1 หัวข้อ | หน้าเนื้อหาคือแม่เหล็กคำค้นที่หน้า tool ทั่วไปไม่มี |
| ตรวจหน้าเว็บไม่ให้มี link เสีย / โหลดนาน | Vercel โหลดเร็วอยู่แล้ว เหลือแค่ดู link ภายใน |

---

## ตัวช่วยจำทั้งหมด

```
1. Vercel:     ใส่ NEXT_PUBLIC_SITE_URL + GOOGLE_SITE_VERIFICATION → Redeploy
2. Google:     Search Console → Add property → verify → Submit sitemap.xml → Request indexing
3. โดเมน:      ซื้อ → ผูก Vercel → อัปเดต env → เพิ่ม property ใหม่
4. Bing:       Import จาก Search Console
5. ตรวจ:       site:โดเมน ใน Google + ดู Performance รายสัปดาห์
6. ต่อยอด:     เนื้อหาใหม่สม่ำเสมอ + ลิงก์จากภายนอก
```
