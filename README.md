<div align="center">
  <h1>🎮 Riftbound Live Overlay</h1>
  <p><strong>Professional, web-based live streaming overlay and deck builder for Riftbound broadcasts.</strong></p>
  <a href="https://riftbound-live-overlay.vercel.app/"><strong>🔗 Live Demo & App URL</strong></a>
</div>

<br />

## 🌟 About This Project

**Riftbound Live Overlay** is a dynamic, web-based system designed to elevate live broadcasts and provide a comprehensive toolset for Riftbound players. Originally built for seamless integration into broadcasting software like OBS Studio, it has evolved into a robust platform featuring a full card library, deck builder, and community deck sharing.

## ✨ Current Features & Capabilities

### 🎴 Card Library
- Comprehensive database of all Riftbound cards.
- Advanced filtering by Sets, Types (Legend, Champion, Main Deck, etc.), Colors, and Rarity.
- Real-time search by Card Name or Code.
- Detailed **Card Modal** displaying rich text abilities with inline icons (Runes, Keywords), stats, and equip effects.

### 🃏 Deck Builder & Management
- **Interactive Deck Builder:** Drag-and-drop or click to build your perfect deck.
- **Rule Enforcement:** Automatically validates deck requirements (1 Legend, 1 Champion sharing a tag with Legend, 3 Battlefields, 12 Runes, Min 40 Main Deck, Max 10 Sideboard).
- **My Decks:** Manage your personal deck collection, edit drafts, and publish decks.
- **Deck Library:** Browse public decks created by the community.
- **Deck View:** Visual breakdown of a deck's composition, grouped cards, average energy cost, and card type distribution.
- **Export/Import:** Easily share and import deck strings.

### 📺 Live Overlay Integration
- Works flawlessly as a "Browser Source" in your streaming software.
- Real-time display of game state, live cards, and player stats.

### 📊 Meta Report (TopDeck.gg)
- **Tier List & Statistics:** Per-legend Play Rate, Win Rate (match/game), Top 8 conversions, and championship counts computed from real tournament results.
- **Trend Comparison:** Play share change (percentage points) versus the previous equal-length window.
- **Time Filters:** 7 / 14 / 30 / 90 day windows with a minimum-decks threshold to filter out noise.
- **Leader Card Matching:** Tournament leaders are matched against the local Card database (full name first, e.g. "Akali, Rogue Assassin", with base-name fallback) so the report shows card images.

### 🛒 Card Shop & E-Commerce
- **Storefront:** Browse cards for sale and easily add them to your shopping cart.
- **Checkout & Payment:** Seamless checkout process featuring automated PromptPay QR Code generation.
- **Smart Verification:** Automated payment slip verification via the SlipOK API.
- **Order Tracking:** Users can view their order history, check shipping status with tracking numbers, or cancel pending orders.
- **Stock Management:** Real-time inventory deduction upon checkout and automatic restock for cancelled orders.

### 🎛️ Admin Dashboard
- **Content Management:** Securely manage the card database, sets, and user configurations.
- **Shop Inventory:** Control shop listings, adjust pricing, and restock quantities.
- **Order Management:** Review user orders, verify payment slips, update statuses, and input courier tracking details.
- **Meta Sync (TopDeck.gg):** One-click import of completed Riftbound tournaments (see below).

### 🔄 Meta Data Sync (TopDeck.gg)

The Meta Report is powered by tournament data imported from [TopDeck.gg](https://topdeck.gg).

1. **Get a free API key** from the TopDeck.gg developer portal and add it to `.env.local`:
   ```
   TOPDECK_API_KEY=your_key_here
   ```
2. **Restart the dev server** so the new env var is picked up.
3. **Go to Admin Panel → Meta Sync**, choose how far back to fetch (7/30/90 days) and click "เริ่มซิงก์".

What the sync does:

- Fetches **completed Riftbound tournaments** via `POST https://topdeck.gg/api/v2/tournaments` (`game: "Riftbound"`, `format: "Constructed"`).
- Skips tournaments whose **decklists are not public yet** (no leader/deckObj on any standings row) — these can be imported later by re-running the sync.
- Upserts each tournament into the `tournaments` table (deduped by TopDeck TID) and rebuilds its per-player rows in `tournament_standings`.
- Normalizes each deck's leader to a **base legend name** ("Lee Sin, Stunning Tempo" → "Lee Sin") for aggregation, while keeping the **full legend card name** from `deckObj.Legend` to link against the Card table (`leaderCardId`).
- Parses each deck into structured entries (`[{ code, name, qty }]`) from the grouped `deckObj` (Legend / Champion / Runes / Battlefields / Mainboard), falling back to plain-text decklist parsing when needed.
- Both tables are created automatically on first DB connection (auto-migrate in `src/lib/db.ts`).

The sync is idempotent — running it again updates existing tournaments in place. Run it whenever you want fresh data; public API data can also change retroactively as organizers publish decklists. Per TopDeck.gg usage requirements, the Meta Report page displays a "Data provided by TopDeck.gg" attribution link.

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
   **[https://riftbound-live-overlay.vercel.app/](https://riftbound-live-overlay.vercel.app/)**
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
