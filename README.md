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

### 🎛️ Admin Dashboard
- Manage cards, sets, and user configurations securely.

## 🗺️ Roadmap

*This section is reserved for future updates and planned features.*

- [ ] *(To be added by project owner)*
- [ ] *(To be added by project owner)*
- [ ] *(To be added by project owner)*

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
