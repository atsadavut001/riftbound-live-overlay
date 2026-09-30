/**
 * รายชื่อ rarity สำหรับ filter ในหน้าเว็บ (Card Library, Shop, Admin)
 * ใช้ร่วมกันทุกหน้าเพื่อให้ options ตรงกันเสมอ — เพิ่ม rarity ใหม่แก้ที่ไฟล์นี้จุดเดียว
 * Promo = การ์ดโปรโมชันจาก set JDG / OPP / PR / T1A / T1S / SGN
 */
export const RARITY_OPTIONS = [
  { label: "Common", value: "Common" },
  { label: "Uncommon", value: "Uncommon" },
  { label: "Rare", value: "Rare" },
  { label: "Epic", value: "Epic" },
  { label: "Showcase", value: "Showcase" },
  { label: "Promo", value: "Promo" },
];
