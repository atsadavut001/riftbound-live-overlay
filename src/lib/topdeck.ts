/**
 * TopDeck.gg API client helpers for Riftbound tournament sync.
 *
 * Requires TOPDECK_API_KEY in .env.local (free key from https://topdeck.gg developer portal).
 * Attribution required: pages using this data must credit TopDeck.gg with a link.
 */

const TOPDECK_API_URL = "https://topdeck.gg/api/v2/tournaments";

export interface TopDeckCardEntry { id?: string; count?: number }

/** Real TopDeck deckObj shape: grouped by category (Legend / Champion / Runes / Battlefields / Mainboard / Sideboard...) */
export interface TopDeckDeckObj {
  Legend?: Record<string, TopDeckCardEntry>;
  Champion?: Record<string, TopDeckCardEntry>;
  Runes?: Record<string, TopDeckCardEntry>;
  Battlefields?: Record<string, TopDeckCardEntry>;
  Mainboard?: Record<string, TopDeckCardEntry>;
  Sideboard?: Record<string, TopDeckCardEntry>;
  [category: string]: Record<string, TopDeckCardEntry> | undefined;
}

export interface TopDeckStanding {
  name?: string;
  id?: string;
  leader?: string;
  decklist?: string;
  deckObj?: TopDeckDeckObj | null;
  wins?: number;
  losses?: number;
  draws?: number;
  rank?: number;
  place?: number;
}

export interface TopDeckTournament {
  TID: string;
  tournamentName: string;
  swissNum?: number;
  startDate?: number;
  game: string;
  format: string;
  topCut?: number;
  eventData?: { city?: string; state?: string; address?: string } | null;
  standings?: TopDeckStanding[];
}

export async function fetchTopDeckTournaments(opts: {
  last?: number;
  start?: number;
  end?: number;
  format?: string;
}): Promise<TopDeckTournament[]> {
  const apiKey = process.env.TOPDECK_API_KEY;
  if (!apiKey) {
    throw new Error("Missing TOPDECK_API_KEY. Get a free key at https://topdeck.gg and add it to .env.local");
  }

  const body: Record<string, unknown> = {
    game: "Riftbound",
    format: opts.format ?? "Constructed",
    columns: ["name", "decklist", "wins", "draws", "losses"],
  };
  if (opts.last) body.last = opts.last;
  if (opts.start) body.start = opts.start;
  if (opts.end) body.end = opts.end;

  const res = await fetch(TOPDECK_API_URL, {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TopDeck API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

/**
 * Normalize a TopDeck leader string ("Lee Sin, Stunning Tempo" / "Lee Sin")
 * to the base legend name used in the Card table ("Lee Sin").
 */
export function normalizeLeader(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.split(",")[0].trim();
}

/**
 * Parse a plain-text decklist ("2 Rampaging Blitz\n3 ...") into [{ name, qty }].
 * Also accepts "2x Name" and "Name x2" formats. Section headers like "~~Mainboard~~" are ignored.
 */
export function parseDecklist(text: string | null | undefined): { name: string; qty: number }[] {
  if (!text) return [];
  const out: { name: string; qty: number }[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip markdown section headers: ~~Legend~~, ~~Mainboard~~, etc.
    if (/^~~.+~~$/.test(trimmed)) continue;

    // "3 Card Name" or "3x Card Name"
    const m1 = trimmed.match(/^(\d+)\s*x?\s+(.+)$/);
    if (m1) {
      out.push({ name: m1[2].trim(), qty: parseInt(m1[1], 10) });
      continue;
    }
    // "Card Name x3"
    const m2 = trimmed.match(/^(.+?)\s+x(\d+)$/i);
    if (m2) {
      out.push({ name: m2[1].trim(), qty: parseInt(m2[2], 10) });
    }
  }
  return out;
}

/**
 * Flatten the grouped deckObj into [{ code, name, qty, cat }].
 * Preserves category order (Legend, Champion, Runes, Battlefields, Mainboard, then the rest).
 * `cat` keeps the original TopDeck section so Sideboard can be separated later.
 */
export function flattenDeckObj(deckObj: TopDeckDeckObj | null | undefined): { code: string | null; name: string; qty: number; cat: string }[] {
  if (!deckObj) return [];
  const preferredOrder = ["Legend", "Champion", "Runes", "Battlefields", "Mainboard"];
  const categories = [
    ...preferredOrder.filter(c => deckObj[c]),
    ...Object.keys(deckObj).filter(c => !preferredOrder.includes(c) && deckObj[c]),
  ];

  const out: { code: string | null; name: string; qty: number; cat: string }[] = [];
  for (const cat of categories) {
    const entries = deckObj[cat];
    if (!entries) continue;
    for (const [name, entry] of Object.entries(entries)) {
      if (!name?.trim()) continue;
      out.push({
        code: entry?.id?.trim() || null,
        name: name.trim(),
        qty: entry?.count ?? 1,
        cat,
      });
    }
  }
  return out;
}

/**
 * Extract the leader (base legend name) from deckObj's Legend section as a fallback
 * when the standings row has no `leader` field.
 */
export function leaderFromDeckObj(deckObj: TopDeckDeckObj | null | undefined): string | null {
  const legend = deckObj?.Legend;
  if (!legend) return null;
  const names = Object.keys(legend);
  if (names.length === 0) return null;
  // A deck normally has exactly one legend; take the first if several
  return normalizeLeader(names[0]);
}
