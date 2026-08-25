const fs = require('fs');

async function main() {
  const rawText = fs.readFileSync('card_data.json', 'utf8');
  const cleanText = rawText.replace(/^\s*\/\/.*$/gm, '');
  const data = JSON.parse(cleanText);

  const keywords = [
    "ACCELERATE", "HIDDEN", "LEGION", "ACTION", "REACTION", "AMBUSH",
    "ASSAULT", "SHIELD", "TANK", "DEFLECT", "DEATHKNELL", "GANKING",
    "TEMPORARY", "HUNT", "LEVEL", "EMPOWERED", "VISION", "EQUIP", "EQULP",
    "PREDICT", "BURN", "EMPOWER", "ADD", "WEAPONMASTER", "STUN"
  ];

  const keywordRegex = new RegExp(`(?<!\\[)\\b(${keywords.join('|')})(?:\\s+\\d+)?\\b(?!\\])`, 'gi');

  function parseEffect(text) {
    if (!text) return "";
    
    let parsed = text;
    parsed = parsed.replace(/<br\s*\/?>/gi, '\n');
    parsed = parsed.replace(/:rb_energy_(\d+):/gi, '[$1]');
    parsed = parsed.replace(/:rb_rune_([a-z]+):/gi, (match, p1) => {
      return '[' + p1.charAt(0).toUpperCase() + p1.slice(1) + ']';
    });
    parsed = parsed.replace(/:rb_might:/gi, '[Might]');
    parsed = parsed.replace(/:rb_exhaust:/gi, '[Exhaust]');
    parsed = parsed.replace(keywordRegex, match => '[' + match + ']');
    parsed = parsed.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    return parsed;
  }

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  console.log(`Found ${data.length} cards. Starting import...`);

  for (const item of data) {
    const code = item[0];
    if (!code) continue;

    const setPrefix = code.substring(0, 3);
    const imageUrl = `https://qugqegaqjrcwkxnvohvv.supabase.co/storage/v1/object/public/ZberusTCG/cards/${setPrefix}/${code}.webp`;

    const detail = {};
    const ability = parseEffect(item[4]);
    
    // Check if it's Gear. Gear uses "Equip Effect" not "Ability" typically?
    // Wait, the user didn't mention this, but I should just map effect to Ability for now as discussed.
    if (ability) detail["Ability"] = ability;
    
    const flavor = item[5];
    if (flavor) detail["Flavor Text"] = flavor;

    const color = item[6];
    if (color && Array.isArray(color) && color.length > 0) detail["Color"] = color;

    const energy = item[7];
    if (energy !== null && energy !== "") detail["Energy"] = energy.toString();

    const power = item[8];
    if (power !== null && power !== "") detail["Power"] = power.toString();

    const might = item[11];
    if (might !== null && might !== "") detail["Might"] = might.toString();

    const tags = item[12];
    if (tags && Array.isArray(tags) && tags.length > 0) detail["Tag"] = tags;

    const payload = {
      code: code,
      name: item[2],
      type: item[9],
      rarity: item[14],
      imageUrl: imageUrl,
      detail: detail
    };

    try {
      const res = await fetch('http://localhost:3000/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        successCount++;
        if (successCount % 100 === 0) console.log(`✅ Progress: Added ${successCount} cards...`);
      } else {
        const err = await res.json();
        if (err.error === 'Card code already exists') {
          skipCount++;
        } else {
          console.log(`❌ Failed: ${code} - ${err.error}`);
          failCount++;
        }
      }
    } catch (e) {
      console.log(`❌ Error: ${code} - ${e.message}`);
      failCount++;
    }
  }

  console.log(`\n✅ Done! Added: ${successCount} | ⏭️ Skipped (Already exists): ${skipCount} | ❌ Failed: ${failCount}`);
}

main();
