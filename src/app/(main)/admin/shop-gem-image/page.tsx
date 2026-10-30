"use client";

import { useEffect, useState } from "react";
import { SET_OPTIONS } from "@/lib/sets";

interface ShopItem {
  id: string;
  price: number | string;
  quantity: number;
  print?: string;
  card?: {
    name?: string;
    code?: string;
    type?: string;
    imageUrl?: string;
    detail?: { Color?: string[] | string };
  };
}

const COLORS = ["Fury", "Calm", "Mind", "Order", "Chaos", "Body"] as const;
const COLUMNS = 8;
const CANVAS_WIDTH = 1920;
const CARD_HEIGHT = 342;
const GAP = 16;
const PADDING = 32;

function getCardColors(item: ShopItem): string[] {
  const colors = item.card?.detail?.Color;
  const values = Array.isArray(colors)
    ? colors
    : typeof colors === "string"
      ? colors.split(",")
      : [];
  return values.map((color) => color.trim().toLowerCase());
}

function sortBySetAndCode(a: ShopItem, b: ShopItem): number {
  const aCode = a.card?.code || "";
  const bCode = b.card?.code || "";
  const aSet = aCode.split("-")[0];
  const bSet = bCode.split("-")[0];
  const aSetRank = SET_OPTIONS.findIndex((set) => set.value === aSet);
  const bSetRank = SET_OPTIONS.findIndex((set) => set.value === bSet);
  if (aSet !== bSet) {
    if (aSetRank >= 0 && bSetRank >= 0) return aSetRank - bSetRank;
    if (aSetRank >= 0) return -1;
    if (bSetRank >= 0) return 1;
    return aSet.localeCompare(bSet, undefined, { numeric: true, sensitivity: "base" });
  }
  return aCode.localeCompare(bCode, undefined, { numeric: true, sensitivity: "base" });
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files: { name: string; data: Uint8Array }[]): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localSize = 0;
  let centralSize = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const checksum = crc32(file.data);
    const localHeader = new Uint8Array(30 + name.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, file.data.length, true);
    localView.setUint32(22, file.data.length, true);
    localView.setUint16(26, name.length, true);
    localHeader.set(name, 30);
    localParts.push(localHeader, file.data);

    const centralHeader = new Uint8Array(46 + name.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, file.data.length, true);
    centralView.setUint32(24, file.data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, localSize, true);
    centralHeader.set(name, 46);
    centralParts.push(centralHeader);

    localSize += localHeader.length + file.data.length;
    centralSize += centralHeader.length;
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localSize, true);

  const archive = new Uint8Array(localSize + centralSize + end.length);
  let offset = 0;
  for (const part of [...localParts, ...centralParts, end]) {
    archive.set(part, offset);
    offset += part.length;
  }
  return new Blob([archive.buffer], { type: "application/zip" });
}

export default function ShopGemImagePage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetch("/api/admin/shop");
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data.error || "โหลดรายการ Shop ไม่สำเร็จ");
        }
        const withImages = data.filter((item: ShopItem) => item.card?.imageUrl);
        setItems(withImages);
        setSelectedIds(withImages.map((item: ShopItem) => item.id));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "โหลดรายการ Shop ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const separateTypes = ["legend", "battlefield"] as const;
  const isSeparateType = (item: ShopItem) => separateTypes.includes((item.card?.type || "").toLowerCase() as typeof separateTypes[number]);
  const itemsByColor: { color: string; items: ShopItem[] }[] = COLORS.map((color) => ({
    color,
    items: selectedItems.filter((item) => !isSeparateType(item) && getCardColors(item).includes(color.toLowerCase())).sort(sortBySetAndCode),
  })).filter((group) => group.items.length > 0);
  const uncoloredItems = selectedItems.filter((item) => !isSeparateType(item) && getCardColors(item).length === 0).sort(sortBySetAndCode);
  if (uncoloredItems.length > 0) itemsByColor.push({ color: "Other", items: uncoloredItems });
  const specialTypeGroups = separateTypes.map((type) => ({
    color: type === "legend" ? "Legend" : "Battlefield",
    items: selectedItems.filter((item) => (item.card?.type || "").toLowerCase() === type).sort(sortBySetAndCode),
  })).filter((group) => group.items.length > 0);
  const imageGroups = [...itemsByColor, ...specialTypeGroups];

  const toggleItem = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const downloadImagesByColor = async () => {
    if (imageGroups.length === 0) return;
    setGenerating(true);
    setError("");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl("");

    try {
      const tileWidth = (CANVAS_WIDTH - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
      const files: { name: string; data: Uint8Array }[] = [];

      for (const group of imageGroups) {
        const rows = Math.ceil(group.items.length / COLUMNS);
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_WIDTH;
        canvas.height = PADDING * 2 + 82 + rows * CARD_HEIGHT + (rows - 1) * GAP;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("เบราว์เซอร์ไม่รองรับการสร้างรูปภาพ");

        context.fillStyle = "#10131b";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#f59e0b";
        context.font = "bold 34px sans-serif";
        context.textAlign = "left";
        context.fillText(`ZBERUS SHOP - ${group.color.toUpperCase()}`, PADDING, PADDING + 34);
        context.fillStyle = "#a1a1aa";
        context.font = "18px sans-serif";
        context.fillText(`${group.items.length} cards | 8 columns | sorted by set and code`, PADDING, PADDING + 64);

        await Promise.all(group.items.map(async (item, index) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.src = item.card!.imageUrl!;
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error(`โหลดรูป ${item.card?.name || item.card?.code || "การ์ด"} ไม่ได้ หรือแหล่งรูปไม่อนุญาตให้สร้างไฟล์`));
          });

          const column = index % COLUMNS;
          const row = Math.floor(index / COLUMNS);
          const x = PADDING + column * (tileWidth + GAP);
          const y = PADDING + 88 + row * (CARD_HEIGHT + GAP);

          context.fillStyle = "#1c2230";
          context.beginPath();
          context.roundRect(x, y, tileWidth, CARD_HEIGHT, 12);
          context.fill();

          const imageMaxWidth = tileWidth - 20;
          const imageMaxHeight = 230;
          const scale = Math.min(imageMaxWidth / image.naturalWidth, imageMaxHeight / image.naturalHeight);
          const imageWidth = image.naturalWidth * scale;
          const imageHeight = image.naturalHeight * scale;
          context.drawImage(image, x + (tileWidth - imageWidth) / 2, y + 10, imageWidth, imageHeight);

          context.fillStyle = "#ffffff";
          context.font = "bold 13px sans-serif";
          context.textAlign = "left";
          context.fillText((item.card?.name || "Unknown Card").slice(0, 22), x + 10, y + 270, tileWidth - 20);
          context.fillStyle = "#a1a1aa";
          context.font = "12px sans-serif";
          context.fillText(item.card?.code || item.print || "", x + 10, y + 294, tileWidth - 20);
          context.fillStyle = "#4ade80";
          context.font = "12px sans-serif";
          context.fillText(`คงเหลือ ${item.quantity ?? 0} ใบ`, x + 10, y + 320, tileWidth - 20);
          context.fillStyle = "#fbbf24";
          context.font = "bold 15px sans-serif";
          context.textAlign = "right";
          context.fillText(`฿${item.price}`, x + tileWidth - 10, y + 320, tileWidth - 20);
          context.textAlign = "left";
        }));

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) resolve(result);
            else reject(new Error(`สร้างไฟล์ ${group.color} PNG ไม่สำเร็จ`));
          }, "image/png");
        });
        files.push({
          name: `shop-gem-image-${group.color.toLowerCase()}.png`,
          data: new Uint8Array(await blob.arrayBuffer()),
        });
      }

      const zip = createZip(files);
      setDownloadUrl(URL.createObjectURL(zip));
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "สร้างรูปภาพไม่สำเร็จ");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-[var(--primary)]">Shop Gem Image</h1>
        <p className="text-gray-400">เลือกรูปการ์ดจาก Shop Management แล้วจัดเรียงเพื่อสร้างเป็นไฟล์ PNG</p>
      </div>

      <section className="rounded-xl border border-[#333] bg-[#111] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
            <span>เลือกแล้ว {selectedItems.length} / {items.length} ใบ</span>
            <button
              type="button"
              onClick={() => setSelectedIds(items.map((item) => item.id))}
              className="text-amber-400 hover:text-amber-300"
            >
              เลือกทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-gray-400 hover:text-white"
            >
              ล้างการเลือก
            </button>
            <span>สร้าง PNG {imageGroups.length} ภาพ · กว้าง 1920 px · 8 คอลัมน์ · เรียงตาม Set และ Code</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={downloadImagesByColor}
              disabled={generating || imageGroups.length === 0}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? "กำลังสร้างภาพทั้งหมด..." : "สร้างภาพทั้งหมด (ZIP)"}
            </button>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download="shop-gem-images.zip"
                className="rounded-lg border border-green-500/60 bg-green-500/10 px-4 py-2 font-medium text-green-400 transition-colors hover:bg-green-500/20"
              >
                ดาวน์โหลด ZIP ({imageGroups.length} ภาพ)
              </a>
            )}
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}
      {downloadUrl && <p role="status" className="text-sm text-green-400">สร้างภาพครบแล้ว คลิกปุ่ม “ดาวน์โหลด ZIP” เพื่อบันทึกไฟล์</p>}

      {loading ? (
        <div className="p-8 text-center text-gray-400">กำลังโหลดรายการ Shop...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[#333] bg-[#111] p-8 text-center text-gray-400">
          ไม่พบรูปการ์ดในรายการ Shop Management
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <label
              key={item.id}
              className={`cursor-pointer overflow-hidden rounded-xl border bg-[#111] transition-colors ${selectedIds.includes(item.id) ? "border-amber-500" : "border-[#333] opacity-60"}`}
            >
              <div className="relative aspect-[3/4] bg-[#1a1a1a]">
                <img src={item.card!.imageUrl} alt={item.card?.name || "Card"} className="h-full w-full object-contain" />
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="absolute left-3 top-3 h-5 w-5 accent-amber-500"
                  aria-label={`เลือกรูป ${item.card?.name || item.card?.code || "การ์ด"}`}
                />
              </div>
              <div className="p-3">
                <div className="truncate font-medium text-white">{item.card?.name || "Unknown Card"}</div>
                <div className="mt-1 flex justify-between gap-2 text-xs text-gray-400">
                  <span className="truncate">{item.card?.code || item.print || ""}</span>
                  <span className="shrink-0 text-amber-400">฿{item.price}</span>
                </div>
                <div className="mt-1 text-xs text-green-400">คงเหลือ {item.quantity ?? 0} ใบ</div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
