"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CardFormProps {
  initialData?: any;
  cardId?: string;
}

export default function CardForm({ initialData, cardId }: CardFormProps) {
  const router = useRouter();
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    type: initialData?.type || "",
    rarity: initialData?.rarity || "",
    imageUrl: initialData?.imageUrl || "",
    detail: initialData?.detail || {}
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await fetch("/api/admin/card-types");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTypes(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = cardId ? `/api/admin/cards/${cardId}` : "/api/admin/cards";
      const method = cardId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        router.push("/admin/card");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (newType: string) => {
    const typeDef = types.find(t => t.name === newType);
    setFormData(prev => {
      let nextDetail = typeDef && Object.keys(prev.detail).length === 0 ? { ...typeDef.defaultJson } : { ...prev.detail };
      
      if (newType === "Rune") {
        if (!("Color" in nextDetail)) nextDetail.Color = [];
        if (!("Tag" in nextDetail)) nextDetail.Tag = [];
        delete nextDetail.effect;
        delete nextDetail.element;
      } else if (newType === "Legend") {
        if (!("Color" in nextDetail)) nextDetail.Color = [];
        if (!("Tag" in nextDetail)) nextDetail.Tag = [];
        if (!("Ability" in nextDetail)) nextDetail.Ability = "";
        delete nextDetail.cost;
        delete nextDetail.power;
        delete nextDetail.health;
      } else if (newType === "Battlefield") {
        if (!("Ability" in nextDetail)) nextDetail.Ability = "";
        delete nextDetail.effect;
      } else if (newType === "Gear" || newType === "Spell") {
        delete nextDetail.cost;
        delete nextDetail.effect;
        delete nextDetail.equipCost;
        if (!("Color" in nextDetail)) nextDetail.Color = [];
        if (!("Tag" in nextDetail)) nextDetail.Tag = [];
        if (!("Energy" in nextDetail)) nextDetail.Energy = "";
        if (!("Power" in nextDetail)) nextDetail.Power = "";
        if (!("Ability" in nextDetail)) nextDetail.Ability = "";
      }

      return {
        ...prev,
        type: newType,
        detail: nextDetail
      };
    });
  };

  const updateDetailField = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      detail: { ...prev.detail, [key]: value }
    }));
  };

  const ALLOWED_FIELDS = ["Color", "Tag", "Energy", "Power", "Might", "Ability", "Flavor Text", "Equip Effect", "Equip Might"];
  const [selectedField, setSelectedField] = useState("");

  const addDetailField = () => {
    if (selectedField && !formData.detail[selectedField]) {
      setFormData(prev => ({
        ...prev,
        detail: { ...prev.detail, [selectedField]: "" }
      }));
      setSelectedField("");
    }
  };

  const removeDetailField = (key: string) => {
    const newDetail = { ...formData.detail };
    delete newDetail[key];
    setFormData(prev => ({ ...prev, detail: newDetail }));
  };

  const renderPreview = (text: string) => {
    const keywords_1FA289 = ["ACCELERATE", "HIDDEN", "LEGION", "ACTION", "REACTION", "AMBUSH"];
    const keywords_CC2C6B = ["ASSAULT", "SHIELD", "TANK"];
    const keywords_99B330 = ["DEFLECT", "DEATHKNELL", "GANKING", "TEMPORARY", "HUNT", "LEVEL", "EMPOWERED"];
    const keywords_6B6F70 = ["VISION", "EQUIP", "EQULP", "PREDICT", "BURN", "EMPOWER", "ADD", "WEAPONMASTER", "STUN"];
    const regex = /(\[[^\]]+\])/g;
    const parts = (text || "").split(regex);
    
    return (
      <div className="w-full h-full p-3 bg-[#111] border border-[var(--border)] rounded-md text-sm text-gray-300 leading-relaxed whitespace-pre-wrap relative min-h-[96px]">
        <div className="text-xs text-gray-500 font-bold mb-1">Preview</div>
        {!text && <span className="text-gray-600 italic text-sm">Type in the box to see the preview...</span>}
        {parts.map((part, i) => {
          if (part.startsWith("[") && part.endsWith("]")) {
            const inner = part.slice(1, -1);
            
            // Check for numbers or 'X'
            const isNumber = /^\d+$/.test(inner) || inner.toUpperCase() === "X";
            if (isNumber) {
              return (
                <span key={i} className="inline-flex items-center justify-center w-[18px] h-[18px] mx-0.5 rounded-full bg-gray-200 text-black text-[11px] font-bold align-middle shadow-sm leading-none">
                  {inner}
                </span>
              );
            }
            
            // Check for runes
            const runes = ["Body", "Calm", "Chaos", "Fury", "Mind", "Order", "Rainbow"];
            const matchedRune = runes.find(r => r.toLowerCase() === inner.toLowerCase());
            if (matchedRune) {
              return (
                <img 
                  key={i} 
                  src={`/runes/${matchedRune}.webp`} 
                  alt={matchedRune} 
                  className="inline-block w-[18px] h-[18px] mx-0.5 align-middle select-none" 
                />
              );
            }

            let bgColor = "#444";
            if (keywords_1FA289.some(kw => inner.toUpperCase().startsWith(kw))) {
              bgColor = "#1FA289";
            } else if (keywords_CC2C6B.some(kw => inner.toUpperCase().startsWith(kw))) {
              bgColor = "#CC2C6B";
            } else if (keywords_99B330.some(kw => inner.toUpperCase().startsWith(kw))) {
              bgColor = "#99B330";
            } else if (keywords_6B6F70.some(kw => inner.toUpperCase().startsWith(kw))) {
              bgColor = "#6B6F70";
            }
            return (
              <span key={i} className="px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-bold text-white tracking-wider align-middle shadow-sm" style={{ backgroundColor: bgColor }}>
                {inner}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl max-w-4xl mx-auto flex flex-col">
      <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
        <h2 className="text-xl font-bold">{cardId ? "Edit Card" : "Add New Card"}</h2>
        <button onClick={() => router.push("/admin/card")} className="text-gray-400 hover:text-white">✕</button>
      </div>
      
      <form onSubmit={saveCard} className="p-6 flex-1 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Code *</label>
            <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name *</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type *</label>
            <select required value={formData.type} onChange={e => handleTypeChange(e.target.value)} className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)]">
              <option value="">-- Select Type --</option>
              {types.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rarity</label>
            <select value={formData.rarity} onChange={e => setFormData({...formData, rarity: e.target.value})} className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)]">
              <option value="">-- Select Rarity --</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Epic">Epic</option>
              <option value="Showcase">Showcase</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Image URL</label>
            <input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)]" />
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-bold text-[var(--primary)]">Details (JSON fields)</label>
            <div className="flex items-center gap-2">
              <select 
                value={selectedField} 
                onChange={e => setSelectedField(e.target.value)} 
                className="bg-[#111] border border-[var(--border)] rounded px-2 py-1 outline-none text-sm focus:border-[var(--primary)] text-gray-300"
              >
                <option value="">-- Select Field --</option>
                {ALLOWED_FIELDS.filter(f => !formData.detail[f]).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={addDetailField} 
                disabled={!selectedField}
                className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Field
              </button>
              {Object.keys(formData.detail).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all detail fields?")) {
                      setFormData(prev => ({ ...prev, detail: {} }));
                    }
                  }}
                  className="text-xs bg-red-900/40 hover:bg-red-800/80 text-red-300 px-3 py-1.5 rounded border border-red-800 transition-colors ml-2"
                >
                  Clear Fields
                </button>
              )}
            </div>
          </div>
          
          {Object.keys(formData.detail).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-700 rounded">No extra fields. Select a Type to auto-fill defaults or add manually.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(formData.detail).map(([key, value]) => (
                <div key={key} className="flex gap-4 items-start">
                  <div className="bg-[#111] border border-[var(--border)] rounded px-3 py-2 text-sm text-gray-400 w-32 shrink-0 break-all">
                    {key}
                  </div>
                  <div className="flex-1">
                    {key === "Color" ? (
                      <div className="flex flex-wrap gap-2">
                        {["Body", "Calm", "Chaos", "Fury", "Mind", "Order"].map(color => {
                          const currentColors = Array.isArray(value) ? value : (typeof value === 'string' && value ? value.split(',').map(s=>s.trim()) : []);
                          const isSelected = currentColors.includes(color);
                          const colorMap: Record<string, string> = {
                            Body: "#e2710c",
                            Calm: "#15aa71",
                            Chaos: "#6b4891",
                            Fury: "#cb212d",
                            Mind: "#22779a",
                            Order: "#cda901"
                          };
                          const hex = colorMap[color] || "#ffffff";
                          return (
                            <label 
                              key={color} 
                              className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-all"
                              style={{
                                backgroundColor: isSelected ? `${hex}33` : `${hex}11`,
                                borderColor: hex,
                                borderWidth: '1px'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={(e) => {
                                  let nextColors = [...currentColors];
                                  if (e.target.checked) {
                                    if (!nextColors.includes(color)) nextColors.push(color);
                                  } else {
                                    nextColors = nextColors.filter(c => c !== color);
                                  }
                                  updateDetailField(key, nextColors);
                                }}
                                style={{ accentColor: hex }}
                              />
                              <span className="text-sm font-medium" style={{ color: hex }}>{color}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : key === "Tag" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(value) ? value : (typeof value === 'string' && value ? value.split(',').map(s=>s.trim()).filter(Boolean) : [])).map((tag, idx) => (
                            <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-[#222] text-xs rounded-full border border-[var(--border)]">
                              {tag}
                              <button type="button" onClick={() => {
                                let tags = Array.isArray(value) ? [...value] : (typeof value === 'string' && value ? value.split(',').map(s=>s.trim()).filter(Boolean) : []);
                                tags.splice(idx, 1);
                                updateDetailField(key, tags);
                              }} className="text-gray-400 hover:text-red-400 ml-1">✕</button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Type a tag and press Enter (e.g. Champion Unit, Jinx)"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const newTag = input.value.trim();
                              if (newTag) {
                                let tags = Array.isArray(value) ? [...value] : (typeof value === 'string' && value ? value.split(',').map(s=>s.trim()).filter(Boolean) : []);
                                if (!tags.includes(newTag)) {
                                  tags.push(newTag);
                                  updateDetailField(key, tags);
                                }
                                input.value = '';
                              }
                            }
                          }}
                          className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)] text-sm"
                        />
                      </div>
                    ) : typeof value === 'object' ? (
                      <textarea 
                        value={JSON.stringify(value, null, 2)} 
                        onChange={e => {
                          try { updateDetailField(key, JSON.parse(e.target.value)); } 
                          catch { updateDetailField(key, e.target.value); }
                        }} 
                        className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none text-sm font-mono"
                        rows={4}
                      />
                    ) : key === "Flavor Text" ? (
                      <textarea 
                        id={`textarea-${key.replace(/\s+/g, '-')}`}
                        value={value as string || ""} 
                        onChange={e => updateDetailField(key, e.target.value)} 
                        className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)] text-sm"
                        rows={4}
                      />
                    ) : (key === "Ability" || key === "Equip Effect") ? (
                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex flex-col lg:flex-row gap-4">
                          <textarea 
                            id={`textarea-${key.replace(/\s+/g, '-')}`}
                            value={value as string || ""} 
                            onChange={e => updateDetailField(key, e.target.value)} 
                            className="w-full lg:w-1/2 bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)] text-sm"
                            rows={4}
                          />
                          <div className="w-full lg:w-1/2">
                            {renderPreview(value as string)}
                          </div>
                        </div>
                        <div className="flex gap-2 items-center flex-wrap">
                          <span className="text-xs text-gray-400">Insert Keyword:</span>
                          {[
                            { kw: "ACCELERATE", color: "#1FA289" },
                            { kw: "HIDDEN", color: "#1FA289" },
                            { kw: "LEGION", color: "#1FA289" },
                            { kw: "ACTION", color: "#1FA289" },
                            { kw: "REACTION", color: "#1FA289" },
                            { kw: "AMBUSH", color: "#1FA289" },
                            { kw: "ASSAULT", color: "#CC2C6B" },
                            { kw: "SHIELD", color: "#CC2C6B" },
                            { kw: "TANK", color: "#CC2C6B" },
                            { kw: "DEFLECT", color: "#99B330" },
                            { kw: "DEATHKNELL", color: "#99B330" },
                            { kw: "GANKING", color: "#99B330" },
                            { kw: "TEMPORARY", color: "#99B330" },
                            { kw: "HUNT", color: "#99B330" },
                            { kw: "LEVEL", color: "#99B330" },
                            { kw: "EMPOWERED", color: "#99B330" },
                            { kw: "VISION", color: "#6B6F70" },
                            { kw: "EQUIP", color: "#6B6F70" },
                            { kw: "PREDICT", color: "#6B6F70" },
                            { kw: "BURN", color: "#6B6F70" },
                            { kw: "EMPOWER", color: "#6B6F70" },
                            { kw: "ADD", color: "#6B6F70" },
                            { kw: "WEAPONMASTER", color: "#6B6F70" },
                            { kw: "STUN", color: "#6B6F70" }
                          ].map(({ kw, color }) => (
                            <button
                              key={kw}
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`textarea-${key.replace(/\s+/g, '-')}`) as HTMLTextAreaElement;
                                const val = value as string || "";
                                const insertStr = `[${kw}]`;
                                if (el) {
                                  const start = el.selectionStart;
                                  const end = el.selectionEnd;
                                  const newVal = val.substring(0, start) + insertStr + val.substring(end);
                                  updateDetailField(key, newVal);
                                  setTimeout(() => {
                                    el.focus();
                                    el.setSelectionRange(start + insertStr.length - 1, start + insertStr.length - 1);
                                  }, 0);
                                } else {
                                  updateDetailField(key, val + insertStr);
                                }
                              }}
                              className="px-2 py-1 text-[10px] font-bold tracking-wider rounded border transition-colors hover:brightness-125"
                              style={{ 
                                backgroundColor: `${color}33`, 
                                color: color, 
                                borderColor: `${color}80` 
                              }}
                            >
                              [{kw}]
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <input 
                        value={value as string || ""} 
                        onChange={e => updateDetailField(key, e.target.value)} 
                        className="w-full bg-[#111] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--primary)] text-sm"
                      />
                    )}
                  </div>
                  <button type="button" onClick={() => removeDetailField(key)} className="text-red-400 hover:text-red-300 p-2 shrink-0">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-[var(--border)] flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/admin/card")} className="px-4 py-2 rounded text-gray-300 hover:bg-gray-800 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 font-medium">
            {loading ? "Saving..." : "Save Card"}
          </button>
        </div>
      </form>
    </div>
  );
}
