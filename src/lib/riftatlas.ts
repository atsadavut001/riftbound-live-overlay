/**
 * Rift Atlas deck code encoder/decoder — implements the same binary format used
 * by play.riftatlas.com (reverse-engineered from their public client bundle).
 *
 * Deck code = base32 (RFC4648 alphabet, no padding) of a byte stream.
 * We emit version 3 (the common case):
 *   [0x13]
 *   main deck runs,  buckets 12..1: [varint groupCount] then per group:
 *                                   [varint cardCountInGroup] [set byte] [variant byte]
 *                                   then per card: [varint number]
 *   sideboard runs,  buckets 3..1:  same layout
 *   [0x00]  (no chosen champion — Legend/Champion cards ride in the runs)
 *
 * Sets: OGN=0, OGS=1, ARC=2, SFD=3, UNL=4, VEN=5, RAD=6
 * Variants: ""=0, a=1, s=2, b=3 (and "*" -> 2)
 *
 * NOTE: this is a third-party unofficial format and may change without notice.
 */

export const ATLAS_SET_MAP: Record<string, number> = { OGN: 0, OGS: 1, ARC: 2, SFD: 3, UNL: 4, VEN: 5, RAD: 6 };
export const ATLAS_VARIANT_MAP: Record<string, number> = { "": 0, a: 1, s: 2, "*": 2, b: 3 };

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export interface AtlasCardEntry {
  cardCode: string; // "OGN-042", "VEN-139a"
  count: number;
}

interface ParsedCard {
  set: string;
  number: string; // "1", "05", "139"
  variant: string; // "", "a", "s", "b"
}

function parseCardCode(cardCode: string): ParsedCard {
  const parts = cardCode.split("-");
  if (parts.length !== 2) throw new Error(`Invalid card code format: ${cardCode}. Expected: SET-NUMBERvariant`);
  const [set, rest] = parts;
  if (!set || !rest) throw new Error(`Invalid card code format: ${cardCode}`);
  // Variant letter may be stored upper- or lowercase (e.g. "VEN-139A" vs "VEN-139a")
  const m = rest.match(/^((?:R|SP)?\d+)([a-zA-Z*]?)$/);
  if (!m) throw new Error(`Invalid card code format: ${cardCode}`);
  return { set: set.toUpperCase(), number: m[1], variant: m[2].toLowerCase() };
}

function numValue(number: string): number {
  return parseInt(number.replace(/^(SP|R)/, ""), 10);
}

function popVarint(value: number): number[] {
  const bytes: number[] = [];
  let v = value;
  while (v >= 0x80) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v);
  return bytes;
}

function pushVarint(list: number[], value: number) {
  list.push(...popVarint(value));
}

/** Groups per bucket, sorted by set then variant then number — mirrors their `s()` + `d()`. */
function encodeRuns(entries: AtlasCardEntry[], maxBucket: number, version: number): number[] {
  const out: number[] = [];
  for (let bucket = maxBucket; bucket >= 1; bucket--) {
    const inBucket = entries.filter(e => e.count === bucket);
    const groups = new Map<string, string[]>();
    for (const e of inBucket) {
      const { set, number, variant } = parseCardCode(e.cardCode);
      const key = `${set}|${variant}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(number);
    }
    // their `s()`: one entry per card instance, grouped later — group count = unique set+variant keys
    const groupList = Array.from(groups.entries())
      .map(([key, numbers]) => {
        const [set, variant] = key.split("|");
        return {
          set: ATLAS_SET_MAP[set],
          variant: ATLAS_VARIANT_MAP[variant] ?? 0,
          cardNumbers: [...new Set(numbers)].sort((a, b) => numValue(a) - numValue(b)),
        };
      })
      .filter(g => g.set !== undefined)
      .sort((x, y) => x.set - y.set || x.variant - y.variant);

    pushVarint(out, groupList.length);
    for (const g of groupList) {
      pushVarint(out, g.cardNumbers.length);
      out.push(g.set);
      out.push(g.variant);
      for (const num of g.cardNumbers) {
        if (version >= 4) {
          if (num.startsWith("R")) {
            out.push(1);
            pushVarint(out, numValue(num));
          } else {
            out.push(0);
            pushVarint(out, numValue(num));
          }
        } else {
          pushVarint(out, numValue(num));
        }
      }
    }
  }
  return out;
}

function base32Encode(bytes: Uint8Array): string {
  let out = "";
  let bitBuffer = 0;
  let bits = 0;
  for (const b of bytes) {
    bitBuffer = (bitBuffer << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += BASE32_ALPHABET[(bitBuffer >> bits) & 31];
    }
  }
  if (bits > 0) {
    bitBuffer <<= 5 - bits;
    out += BASE32_ALPHABET[bitBuffer & 31];
  }
  return out;
}

function base32Decode(code: string): Uint8Array {
  const bytes: number[] = [];
  let bitBuffer = 0;
  let bits = 0;
  for (const ch of code) {
    const idx = BASE32_ALPHABET.indexOf(ch.toUpperCase());
    if (idx === -1) throw new Error(`Invalid character in deck code: '${ch}'`);
    bitBuffer = (bitBuffer << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((bitBuffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Build a Rift Atlas deck code (format v3).
 * Card codes must be standard Riftbound codes ("OGN-042", "VEN-139a").
 */
export function buildAtlasDeckCode(entries: AtlasCardEntry[], sideboard: AtlasCardEntry[] = []): string {
  if (entries.length === 0) throw new Error("Cannot build deck code: deck is empty");

  const all = [...entries, ...sideboard];
  for (const e of all) {
    if (!Number.isSafeInteger(e.count) || e.count < 1) {
      throw new Error(`Invalid card count for ${e.cardCode}: ${e.count}`);
    }
  }

  const maxMain = entries.reduce((m, e) => Math.max(m, e.count), 0);
  const maxSide = sideboard.reduce((m, e) => Math.max(m, e.count), 0);
  const hasSpecial = all.some(e => {
    const { number } = parseCardCode(e.cardCode);
    return /^(R|SP)/.test(number);
  });

  const version = maxMain > 12 || maxSide > 3 || hasSpecial ? 5 : 3;
  if (version === 5) {
    throw new Error("Deck requires Rift Atlas format v5 (R/SP card numbers or large counts) — not supported");
  }

  const bytes: number[] = [16 | version]; // (1 << 4) | 3 = 0x13
  bytes.push(...encodeRuns(entries, 12, version));
  bytes.push(...encodeRuns(sideboard, 3, version));
  bytes.push(0); // no chosen champion

  return base32Encode(new Uint8Array(bytes));
}

/** Decode a deck code back to card entries (for round-trip verification). */
export function parseAtlasDeckCode(code: string): { mainDeck: AtlasCardEntry[]; sideboard: AtlasCardEntry[]; champion: string | null } {
  const bytes = base32Decode(code.trim());
  let pos = 0;
  const readVarint = (): number => {
    let result = 0;
    let shift = 0;
    for (;;) {
      const b = bytes[pos++];
      result |= (b & 0x7f) << shift;
      if (!(b & 0x80)) break;
      shift += 7;
    }
    return result;
  };

  const header = bytes[pos++];
  const format = (header >> 4) & 15;
  let version = header & 15;
  if (format !== 1) throw new Error(`Unsupported deck code format: ${format}`);
  if (version >= 5) {
    const prefix = bytes[pos++];
    if (prefix > 1) throw new Error(`Unsupported deck prefix flag: ${prefix}`);
    version = 5;
  } else if (version < 2) {
    throw new Error(`Unsupported deck code version: ${version}`);
  }

  const setFromIdx = (idx: number): string => {
    const entry = Object.entries(ATLAS_SET_MAP).find(([, v]) => v === idx);
    if (!entry) throw new Error(`Unknown set index: ${idx}`);
    return entry[0];
  };
  const variantFromIdx = (idx: number): string => {
    const entry = Object.entries(ATLAS_VARIANT_MAP).find(([, v]) => v === idx);
    if (!entry) throw new Error(`Unknown variant index: ${idx}`);
    return entry[0];
  };

  const decodeRuns = (maxBucket: number, deckVersion: number): AtlasCardEntry[] => {
    const out: AtlasCardEntry[] = [];
    for (let bucket = maxBucket; bucket >= 1; bucket--) {
      const groupCount = readVarint();
      for (let g = 0; g < groupCount; g++) {
        const cardCount = readVarint();
        const setIdx = bytes[pos++];
        const variantIdx = bytes[pos++];
        const set = setFromIdx(setIdx);
        const variant = variantFromIdx(variantIdx);
        for (let c = 0; c < cardCount; c++) {
          let number: string;
          if (deckVersion >= 4) {
            const flag = bytes[pos++];
            const n = readVarint();
            number = flag === 1 ? `R${n.toString().padStart(2, "0")}` : n.toString().padStart(3, "0");
          } else {
            number = readVarint().toString().padStart(3, "0");
          }
          out.push({ cardCode: `${set}-${number}${variant}`, count: bucket });
        }
      }
    }
    return out;
  };

  const mainDeck = decodeRuns(12, version);
  const sideboard = decodeRuns(3, version);

  let champion: string | null = null;
  const champFlag = bytes[pos++];
  if (champFlag === 1) {
    const setIdx = bytes[pos++];
    const variantIdx = bytes[pos++];
    const number = readVarint().toString().padStart(3, "0");
    champion = `${setFromIdx(setIdx)}-${number}${variantFromIdx(variantIdx)}`;
  }

  return { mainDeck, sideboard, champion };
}
