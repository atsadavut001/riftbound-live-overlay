"use client";

import { useEffect, useRef, useState } from "react";
import { SET_OPTIONS } from "@/lib/sets";
import { RARITY_OPTIONS } from "@/lib/rarity";

interface ShopItem {
  id: string;
  price: number | string;
  quantity: number;
  print?: string;
  card?: {
    name?: string;
    code?: string;
    type?: string;
    rarity?: string;
    imageUrl?: string;
    detail?: { Color?: string[] | string };
  };
}

const TYPE_OPTIONS = [
  { label: "Legend", value: "Legend" },
  { label: "Battlefield", value: "Battlefield" },
  { label: "Unit", value: "Unit" },
  { label: "Gear", value: "Gear" },
  { label: "Spell", value: "Spell" },
  { label: "Rune", value: "Rune" },
];

const MultiSelect = ({ label, options, selected, onChange }: { label: string; options: { label: string; value: string }[]; selected: string[]; onChange: (v: string[]) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex-1 min-w-[120px]" ref={ref}>
      <div
        className="flex items-center gap-2 bg-[#111] border border-[#333] rounded-md px-3 py-1.5 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs text-gray-500">{label}</span>
        <div className="text-sm text-gray-300 flex-1 truncate">
          {selected.length === 0 ? "All" : selected.map(v => options.find(o => o.value === v)?.label || v).join(", ")}
        </div>
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-[#1a1a1a] border border-[#333] rounded-md z-50 py-1 shadow-xl max-h-60 overflow-y-auto">
          {options.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#222] cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...selected, opt.value]);
                  else onChange(selected.filter(v => v !== opt.value));
                }}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const COLORS = ["Fury", "Calm", "Mind", "Order", "Chaos", "Body"] as const;
const COLUMNS = 12;
const ROWS_PER_IMAGE = 5;
const CARDS_PER_IMAGE = COLUMNS * ROWS_PER_IMAGE;
const PREMIUM_RARITIES = ["rare", "epic", "showcase"];

type ImageGroup = { title: string; fileKey: string; note: string; items: ShopItem[] };
const CANVAS_WIDTH = 3840;
const CARD_HEIGHT = 470;
const GAP = 16;
const PADDING = 32;
const HEADER_HEIGHT = 112;

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

  const [search, setSearch] = useState("");
  const [selectedSet, setSelectedSet] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string[]>([]);
  const [selectedPriceSort, setSelectedPriceSort] = useState<string>("None");

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

  const filteredItems = items.filter((item) => {
    let match = true;

    if (search) {
      const s = search.toLowerCase();
      const name = (item.card?.name || "").toLowerCase();
      const code = (item.card?.code || "").toLowerCase();
      const print = (item.print || "Normal").toLowerCase();
      if (!name.includes(s) && !code.includes(s) && !print.includes(s)) match = false;
    }

    if (match && selectedSet.length > 0) {
      const code = item.card?.code || "";
      if (!selectedSet.some((set) => code.startsWith(`${set}-`))) match = false;
    }

    if (match && selectedType.length > 0) {
      if (!selectedType.includes(item.card?.type || "")) match = false;
    }

    if (match && selectedRarity.length > 0) {
      if (!selectedRarity.includes(item.card?.rarity || "")) match = false;
    }

    if (match && selectedColor.length > 0) {
      const colors = getCardColors(item);
      if (!selectedColor.some((color) => colors.includes(color.toLowerCase()))) match = false;
    }

    return match;
  });

  const sortedFilteredItems = [...filteredItems].sort((a, b) => {
    if (selectedPriceSort === "HighToLow") return Number(b.price) - Number(a.price);
    if (selectedPriceSort === "LowToHigh") return Number(a.price) - Number(b.price);
    return 0;
  });

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  /* การ์ดที่ Quantity 0 ไม่ต้องใส่ในภาพ */
  const inStockItems = selectedItems.filter((item) => Number(item.quantity ?? 0) > 0);
  const separateTypes = ["legend", "battlefield"] as const;
  const isSeparateType = (item: ShopItem) => separateTypes.includes((item.card?.type || "").toLowerCase() as typeof separateTypes[number]);

  const getRarity = (item: ShopItem) => (item.card?.rarity || "").trim().toLowerCase();
  const byPriceDesc = (a: ShopItem, b: ShopItem) => Number(b.price) - Number(a.price) || sortBySetAndCode(a, b);

  /* Rare/Epic/Showcase เรียงราคาแพงก่อน, ที่เหลือ (Common/Uncommon) เรียงตาม Set และ Code — แบ่งภาพละไม่เกิน 60 ใบ */
  const buildColorGroups = (colorItems: ShopItem[], colorLabel: string, keyPrefix: string): ImageGroup[] => {
    const sections = [
      {
        items: colorItems.filter((item) => PREMIUM_RARITIES.includes(getRarity(item))).sort(byPriceDesc),
        suffix: "rare-epic-showcase",
        label: "RARE / EPIC / SHOWCASE",
        note: "Rare/Epic/Showcase | เรียงตามราคาแพงสุดก่อน",
      },
      {
        items: colorItems.filter((item) => !PREMIUM_RARITIES.includes(getRarity(item))).sort(sortBySetAndCode),
        suffix: "common-uncommon",
        label: "COMMON / UNCOMMON",
        note: "Common/Uncommon | เรียงตาม Set และ Code",
      },
    ].filter((section) => section.items.length > 0);

    return sections.flatMap((section) => {
      const parts = Math.ceil(section.items.length / CARDS_PER_IMAGE);
      return Array.from({ length: parts }, (_, partIndex) => ({
        title: `${colorLabel.toUpperCase()} - ${section.label}${parts > 1 ? ` (${partIndex + 1}/${parts})` : ""}`,
        fileKey: `${keyPrefix}-${section.suffix}${parts > 1 ? `-${partIndex + 1}` : ""}`,
        note: section.note,
        items: section.items.slice(partIndex * CARDS_PER_IMAGE, (partIndex + 1) * CARDS_PER_IMAGE),
      }));
    });
  };

  const colorGroups = COLORS.flatMap((color) =>
    buildColorGroups(
      inStockItems.filter((item) => !isSeparateType(item) && getCardColors(item).includes(color.toLowerCase())),
      color,
      color.toLowerCase(),
    ),
  );
  const uncoloredItems = inStockItems.filter((item) => !isSeparateType(item) && getCardColors(item).length === 0);
  const specialTypeGroups: ImageGroup[] = separateTypes.map((type) => ({
    title: type === "legend" ? "LEGEND" : "BATTLEFIELD",
    fileKey: type,
    note: "12 columns | sorted by set and code",
    items: inStockItems.filter((item) => (item.card?.type || "").toLowerCase() === type).sort(sortBySetAndCode),
  })).filter((group) => group.items.length > 0);
  const imageGroups: ImageGroup[] = [...colorGroups, ...buildColorGroups(uncoloredItems, "Other", "other"), ...specialTypeGroups];

  const toggleItem = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const selectAllFiltered = () => {
    setSelectedIds((current) => [...new Set([...current, ...filteredItems.map((item) => item.id)])]);
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
        canvas.height = PADDING * 2 + HEADER_HEIGHT + rows * CARD_HEIGHT + (rows - 1) * GAP;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("เบราว์เซอร์ไม่รองรับการสร้างรูปภาพ");

        context.fillStyle = "#10131b";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#f59e0b";
        context.font = "bold 48px sans-serif";
        context.textAlign = "left";
        context.fillText(`ZBERUS SHOP - ${group.title}`, PADDING, PADDING + 46);
        context.fillStyle = "#a1a1aa";
        context.font = "24px sans-serif";
        context.fillText(`${group.items.length} cards | ${group.note}`, PADDING, PADDING + 84);

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
          const y = PADDING + HEADER_HEIGHT + row * (CARD_HEIGHT + GAP);

          context.fillStyle = "#1c2230";
          context.beginPath();
          context.roundRect(x, y, tileWidth, CARD_HEIGHT, 12);
          context.fill();

          const imageMaxWidth = tileWidth - 20;
          const imageMaxHeight = 360;
          const scale = Math.min(imageMaxWidth / image.naturalWidth, imageMaxHeight / image.naturalHeight);
          const imageWidth = image.naturalWidth * scale;
          const imageHeight = image.naturalHeight * scale;
          const imageX = x + (tileWidth - imageWidth) / 2;
          const imageY = y + 12;
          context.drawImage(image, imageX, imageY, imageWidth, imageHeight);

          const print = (item.print || "").trim();
          if (print && print.toLowerCase() !== "normal") {
            const label = print.toUpperCase();
            context.font = "bold 18px sans-serif";
            const badgePaddingX = 12;
            const badgeHeight = 32;
            const badgeWidth = Math.max(48, context.measureText(label).width + badgePaddingX * 2);
            const badgeX = imageX + 10;
            const badgeY = imageY + imageHeight - badgeHeight - 10;
            context.fillStyle = print.toLowerCase() === "foil" ? "#fbbf24" : "#c084fc";
            context.beginPath();
            context.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
            context.fill();
            context.fillStyle = "#10131b";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(label, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 1);
            context.textBaseline = "alphabetic";
          }

          context.fillStyle = "#ffffff";
          context.font = "bold 18px sans-serif";
          context.textAlign = "left";
          context.fillText((item.card?.name || "Unknown Card").slice(0, 22), x + 12, y + 400, tileWidth - 24);
          context.fillStyle = "#a1a1aa";
          context.font = "15px sans-serif";
          context.fillText(item.card?.code || item.print || "", x + 12, y + 428, tileWidth - 24);
          context.fillStyle = "#4ade80";
          context.font = "15px sans-serif";
          context.fillText(`คงเหลือ ${item.quantity ?? 0} ใบ`, x + 12, y + 458, tileWidth - 24);
          context.fillStyle = "#fbbf24";
          context.font = "bold 18px sans-serif";
          context.textAlign = "right";
          context.fillText(`฿${item.price}`, x + tileWidth - 12, y + 458, tileWidth - 24);
          context.textAlign = "left";
        }));

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) resolve(result);
            else reject(new Error(`สร้างไฟล์ ${group.title} PNG ไม่สำเร็จ`));
          }, "image/png");
        });
        files.push({
          name: `shop-gem-image-${group.fileKey}.png`,
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
            <span>เลือกแล้ว {selectedItems.length} / {items.length} ใบ · แสดง {filteredItems.length} รายการ</span>
            <button
              type="button"
              onClick={selectAllFiltered}
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

      <section className="rounded-xl border border-[#333] bg-[#1a1a1a] p-4 sm:p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by card name, code, or print..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded-md pl-4 pr-10 py-2 text-sm outline-none focus:border-[var(--primary)] text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex gap-2">
            {COLORS.map((rune) => (
              <button
                key={rune}
                type="button"
                onClick={() =>
                  setSelectedColor((prev) => (prev.includes(rune) ? prev.filter((r) => r !== rune) : [...prev, rune]))
                }
                className={`w-9 h-9 rounded-full border flex items-center justify-center hover:opacity-80 transition-all ${selectedColor.includes(rune) ? "border-[var(--primary)] bg-[#222]" : "border-[#444] bg-transparent"}`}
                title={rune}
                aria-label={`กรองตาม ${rune}`}
              >
                <img src={`/runes/${rune}.webp`} alt={rune} className="w-6 h-6 object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = "none"} />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 flex-1">
            <MultiSelect label="Set" options={SET_OPTIONS} selected={selectedSet} onChange={setSelectedSet} />
            <MultiSelect label="Type" options={TYPE_OPTIONS} selected={selectedType} onChange={setSelectedType} />
            <MultiSelect label="Rarity" options={RARITY_OPTIONS} selected={selectedRarity} onChange={setSelectedRarity} />

            <div className="relative flex-1 min-w-[120px]">
              <div className="flex items-center gap-2 bg-[#111] border border-[#333] rounded-md px-3 py-1.5 cursor-pointer h-full">
                <span className="text-xs text-gray-500 whitespace-nowrap">Price</span>
                <select
                  value={selectedPriceSort}
                  onChange={(e) => setSelectedPriceSort(e.target.value)}
                  className="bg-transparent text-sm text-gray-300 w-full outline-none appearance-none cursor-pointer"
                >
                  <option value="None" className="bg-[#1a1a1a]">None</option>
                  <option value="HighToLow" className="bg-[#1a1a1a]">มากไปน้อย</option>
                  <option value="LowToHigh" className="bg-[#1a1a1a]">น้อยไปมาก</option>
                </select>
                <svg className="w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
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
      ) : sortedFilteredItems.length === 0 ? (
        <div className="rounded-xl border border-[#333] bg-[#111] p-8 text-center text-gray-400">
          ไม่พบสินค้าที่ค้นหา
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedFilteredItems.map((item) => (
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
