import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Lineage 2 Roster Dashboard — Single‑file React app
 *
 * ✅ Features
 * - Load roster from: (a) CSV URL, (b) local CSV upload, (c) manual entry
 * - Robust CSV parser (quotes, commas, newlines)
 * - Autosave to LocalStorage + shareable URL state
 * - Powerful table with inline edit, column chooser, multi-filter, bulk add
 * - Availability planner (weekly string → heatmap)
 * - Epic readiness tracker (AQ/Zaken/Baium/Core/Orfen/Frintezza/Antharas/Valakas)
 * - Gear score (weapon/armor/jewels/enchant weights) + team stats
 * - Charts: class distribution, role balance, epic readiness
 * - Export to CSV/JSON + downloadable template + sample data seeding
 * - Help panel with Google Sheets & GitHub RAW instructions for CORS-safe URLs
 *
 * 🛠️ Styling & libs
 * - Tailwind classes via CDN (index.html)
 * - Recharts for charts
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEFAULT_SERVER_TZ = "America/New_York"; // adjust as needed

const EPICS = [
  "Queen Ant",
  "Core",
  "Orfen",
  "Zaken",
  "Baium",
  "Frintezza",
  "Antharas",
  "Valakas",
];

const ROLES = ["Tank", "Healer", "Support", "Melee DPS", "Ranged DPS", "Mage DPS", "Crafter", "Spoiler", "Other"];

const CLASS_TO_ROLE = {
  "Paladin": "Tank",
  "Dark Avenger": "Tank",
  "Temple Knight": "Tank",
  "Shillien Knight": "Tank",
  "Bishop": "Healer",
  "Elven Elder": "Support",
  "Shillien Elder": "Support",
  "Prophet": "Support",
  "Warcryer": "Support",
  "Overlord": "Support",
  "Blade Dancer": "Support",
  "Sword Singer": "Support",
  "Spellhowler": "Mage DPS",
  "Sorcerer": "Mage DPS",
  "Spellsinger": "Mage DPS",
  "Necromancer": "Mage DPS",
  "Warlock": "Mage DPS",
  "Elemental Summoner": "Mage DPS",
  "Phantom Summoner": "Mage DPS",
  "Hawkeye": "Ranged DPS",
  "Silver Ranger": "Ranged DPS",
  "Phantom Ranger": "Ranged DPS",
  "Treasure Hunter": "Melee DPS",
  "Abyss Walker": "Melee DPS",
  "Plains Walker": "Melee DPS",
  "Gladiator": "Melee DPS",
  "Warlord": "Melee DPS",
  "Tyrant": "Melee DPS",
  "Destroyer": "Melee DPS",
  "Warsmith": "Crafter",
  "Bounty Hunter": "Spoiler",
};

const COLUMN_DEFS = [
  { key: "player", title: "Player", width: 160 },
  { key: "discord", title: "Discord", width: 160 },
  { key: "character", title: "Character", width: 160 },
  { key: "class", title: "Class", width: 140 },
  { key: "role", title: "Role", width: 130 },
  { key: "subclassPlan", title: "Subclass Plan", width: 160 },
  { key: "country", title: "Country", width: 120 },
  { key: "region", title: "Region", width: 100 },
  { key: "timezone", title: "Timezone (IANA)", width: 170 },
  { key: "ping", title: "Ping (ms)", width: 110 },
  { key: "voice", title: "Voice", width: 110 },
  { key: "availability", title: "Availability (e.g., Mon 19:00-23:00; Wed 20:00-23:00)", width: 360 },
  { key: "weapon", title: "Weapon", width: 150 },
  { key: "weaponEnchant", title: "+Weap", width: 90 },
  { key: "armorSet", title: "Armor Set", width: 150 },
  { key: "armorEnchantAvg", title: "Avg +Armor", width: 110 },
  { key: "jewels", title: "Jewels", width: 200 },
  { key: "epicsHave", title: "Epics (have)", width: 240 },
  { key: "epicsWant", title: "Epics (want)", width: 240 },
  { key: "gearPriority", title: "Gear Priority", width: 220 },
  { key: "attendance", title: "Attendance %", width: 130 },
  { key: "boxes", title: "Boxes", width: 90 },
  { key: "lastOnline", title: "Last Online (YYYY-MM-DD)", width: 180 },
  { key: "notes", title: "Notes", width: 240 },
];

function parseCSV(text) {
  const rows = [];
  let i = 0, field = "", row = [], inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += c;
        i++;
        continue;
      }
    } else {
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ",") { row.push(field); field = ""; i++; continue; }
      if (c === "\n") { row.push(field); rows.push(row); field = ""; row = []; i++; continue; }
      if (c === "\r") { i++; continue; }
      field += c; i++;
    }
  }
  row.push(field);
  rows.push(row);
  return rows;
}

function toCSV(arr, headers) {
  const header = headers.join(",");
  const esc = (s) => {
    if (s == null) return "";
    const str = String(s);
    return /[",\n]/.test(str) ? '"' + str.replaceAll('"', '""') + '"' : str;
  };
  const lines = arr.map((o) => headers.map((h) => esc(o[h])).join(","));
  return [header, ...lines].join("\n");
}

const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseAvailabilityString(s) {
  const out = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  if (!s) return out;
  const parts = s.split(";").map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    const m = p.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})(?::?(\d{2}))?\s*-\s*(\d{1,2})(?::?(\d{2}))?$/i);
    if (!m) continue;
    const day = DAY_INDEX[m[1].slice(0,3)];
    const sh = parseInt(m[2], 10);
    const sm = m[3] ? parseInt(m[3], 10) : 0;
    const eh = parseInt(m[4], 10);
    const em = m[5] ? parseInt(m[5], 10) : 0;
    const start = sh + sm / 60;
    const end = eh + em / 60;
    out[day].push([start, end]);
  }
  return out;
}

function availabilityHeatmap(members) {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const m of members) {
    const avail = parseAvailabilityString(m.availability);
    for (let d = 0; d < 7; d++) {
      for (const [start, end] of avail[d]) {
        const s = Math.floor(start);
        const e = Math.ceil(end);
        for (let h = s; h < e; h++) grid[d][((h % 24) + 24) % 24]++;
      }
    }
  }
  return grid;
}

function roleForClass(cls) {
  if (!cls) return "";
  return CLASS_TO_ROLE[cls] || "Other";
}

function gearScore(member) {
  const weapScore = (Number(member.weaponEnchant) || 0) * 10 + (member.weapon ? 40 : 0);
  const armorScore = (Number(member.armorEnchantAvg) || 0) * 4 + (member.armorSet ? 30 : 0);
  const jewelScore = (member.jewels ? Math.min(member.jewels.split("/").length * 8, 40) : 0) ;
  const epicsHave = (member.epicsHave || "").split(",").map((s) => s.trim()).filter(Boolean);
  const epicScore = Math.min(epicsHave.length * 15, 120);
  return weapScore + armorScore + jewelScore + epicScore;
}

function epicReadiness(member) {
  const have = new Set((member.epicsHave || "").split(",").map((s) => s.trim()).filter(Boolean));
  const avail = parseAvailabilityString(member.availability);
  const hasEvenings = Object.values(avail).some((arr) => arr.some(([s, e]) => s <= 22 && e >= 20));
  const ready = {};
  for (const epic of EPICS) {
    ready[epic] = have.has(epic) || (hasEvenings && gearScore(member) >= 80);
  }
  return ready;
}

function computeStats(members) {
  const byClass = {};
  const byRole = {};
  const readiness = { total: members.length };
  for (const epic of EPICS) readiness[epic] = 0;
  for (const m of members) {
    const c = m.class || "Unknown";
    byClass[c] = (byClass[c] || 0) + 1;
    const r = m.role || roleForClass(m.class) || "Other";
    byRole[r] = (byRole[r] || 0) + 1;
    const er = epicReadiness(m);
    for (const epic of EPICS) if (er[epic]) readiness[epic]++;
  }
  return { byClass, byRole, readiness };
}

function download(filename, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = filename;
  a.click();
}

function useLocalStorageState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

const TEMPLATE_HEADERS = COLUMN_DEFS.map((c) => c.key);

const SAMPLE_MEMBERS = [
  {
    player: "Javier",
    discord: "javi#1234",
    character: "MortisLord",
    class: "Blade Dancer",
    role: "Support",
    subclassPlan: "Sword Singer",
    country: "USA",
    region: "NA",
    timezone: "America/New_York",
    ping: 40,
    voice: "Discord",
    availability: "Mon 20:00-23:00; Wed 20:00-23:00; Sun 18:00-22:00",
    weapon: "B+ Sword",
    weaponEnchant: 8,
    armorSet: "A Grade Light",
    armorEnchantAvg: 6,
    jewels: "Blue Wolf / Tate / Zaken",
    epicsHave: "Zaken",
    epicsWant: "Baium, Antharas",
    gearPriority: "Zaken > Baium > Antharas",
    attendance: 90,
    boxes: 1,
    lastOnline: "2025-09-01",
    notes: "Main driver, calls targets",
  },
  {
    player: "Mira",
    discord: "mira#2222",
    character: "HolyGrace",
    class: "Bishop",
    role: "Healer",
    subclassPlan: "Elven Elder",
    country: "Canada",
    region: "NA",
    timezone: "America/Toronto",
    ping: 55,
    voice: "Discord",
    availability: "Tue 19:00-22:00; Thu 19:00-23:00; Sun 18:00-22:00",
    weapon: "A+ Staff",
    weaponEnchant: 6,
    armorSet: "A Grade Robe",
    armorEnchantAvg: 5,
    jewels: "AQ / Core",
    epicsHave: "Core, Queen Ant",
    epicsWant: "Zaken, Baium",
    gearPriority: "AQ > Zaken > Baium",
    attendance: 85,
    boxes: 0,
    lastOnline: "2025-09-02",
    notes: "Prefers organized raids",
  },
  {
    player: "Kenji",
    discord: "kenji#7777",
    character: "ArrowRain",
    class: "Hawkeye",
    role: "Ranged DPS",
    subclassPlan: "Silver Ranger",
    country: "Japan",
    region: "Asia",
    timezone: "Asia/Tokyo",
    ping: 180,
    voice: "Discord",
    availability: "Sat 10:00-14:00; Sun 10:00-14:00",
    weapon: "A Bow",
    weaponEnchant: 5,
    armorSet: "B Grade Light",
    armorEnchantAvg: 4,
    jewels: "BW / BO",
    epicsHave: "",
    epicsWant: "Baium",
    gearPriority: "Bow > Jewels > Armor",
    attendance: 60,
    boxes: 0,
    lastOnline: "2025-08-30",
    notes: "Morning player (server time)",
  },
  {
    player: "Lena",
    discord: "lena#9090",
    character: "FrostBolt",
    class: "Spellsinger",
    role: "Mage DPS",
    subclassPlan: "Elemental Summoner",
    country: "Germany",
    region: "EU",
    timezone: "Europe/Berlin",
    ping: 120,
    voice: "Discord",
    availability: "Mon 14:00-17:00; Wed 14:00-17:00; Fri 14:00-17:00",
    weapon: "A Staff",
    weaponEnchant: 7,
    armorSet: "A Robe",
    armorEnchantAvg: 6,
    jewels: "BO / Tate",
    epicsHave: "Queen Ant",
    epicsWant: "Core, Orfen",
    gearPriority: "Core > Orfen > Baium",
    attendance: 70,
    boxes: 1,
    lastOnline: "2025-09-03",
    notes: "EU prime",
  },
];

function emptyMember() {
  const o = {};
  for (const col of COLUMN_DEFS) o[col.key] = "";
  return o;
}

function HelpPanel() {
  return (
    <details className="mt-4 rounded-xl border p-4 bg-white shadow-sm open:shadow-md">
      <summary className="cursor-pointer font-semibold">Help: Data sources, CSV format & tips</summary>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">
        <p>
          <strong>Best way (Google Sheets → CSV URL):</strong> Share → <em>Anyone with the link</em>, then File → <em>Publish to the web</em> → CSV. Paste the URL here. It should end with <code>output=csv</code>.
        </p>
        <p>
          <strong>GitHub CSV:</strong> Use the <em>raw</em> link, e.g. <code>https://raw.githubusercontent.com/...</code>
        </p>
        <p>
          If loading fails, it's usually a <em>CORS</em> issue. Try the two methods above, or use the <em>Upload CSV</em> button.
        </p>
        <p>
          <strong>Template columns (CSV headers):</strong>
        </p>
        <div className="overflow-auto rounded-lg border bg-slate-50 p-2 text-xs">
          <code>{TEMPLATE_HEADERS.join(", ")}</code>
        </div>
        <p>
          <strong>Availability format:</strong> <code>Mon 19:00-23:00; Wed 20:00-23:00; Sun 18:00-22:00</code> (24h or 12h like <code>19-23</code> also OK).
        </p>
        <p>
          <strong>Epics fields:</strong> <code>epicsHave</code> & <code>epicsWant</code> accept comma-separated names: {EPICS.join(", ")}
        </p>
      </div>
    </details>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full border transition ${checked ? "bg-green-500" : "bg-slate-300"}`}
      title={checked ? "On" : "Off"}
    >
      <span
        className={`block h-5 w-5 translate-y-0.5 transform rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

function ColumnChooser({ columns, visible, setVisible }) {
  return (
    <details className="rounded-xl border bg-white p-3 shadow-sm">
      <summary className="cursor-pointer font-medium">Columns</summary>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {columns.map((c) => (
          <label key={c.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!visible[c.key]}
              onChange={(e) => setVisible({ ...visible, [c.key]: e.target.checked })}
            />
            {c.title}
          </label>
        ))}
      </div>
    </details>
  );
}

function Filters({ query, setQuery, role, setRole, cls, setCls, epic, setEpic, tz, setTz }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <input
        className="flex-1 rounded-xl border p-2"
        placeholder="Search player/character/notes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select className="rounded-xl border p-2" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="">All Roles</option>
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <input
        className="rounded-xl border p-2"
        placeholder="Class contains..."
        value={cls}
        onChange={(e) => setCls(e.target.value)}
      />
      <select className="rounded-xl border p-2" value={epic} onChange={(e) => setEpic(e.target.value)}>
        <option value="">Any Epic</option>
        {EPICS.map((e) => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>
      <input
        className="rounded-xl border p-2"
        placeholder="Timezone contains (e.g. Europe/)"
        value={tz}
        onChange={(e) => setTz(e.target.value)}
      />
    </div>
  );
}

function EditableCell({ value, onChange, type = "text", placeholder }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);
  return (
    <div
      className="min-h-[40px] cursor-text rounded-lg p-2 hover:bg-slate-50"
      onClick={() => setEditing(true)}
      onBlur={() => setEditing(false)}
    >
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          className="w-full rounded-lg border p-1"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <div className="whitespace-pre-wrap text-sm">{value || <span className="text-slate-400">{placeholder || "—"}</span>}</div>
      )}
    </div>
  );
}

function DataTable({ rows, setRows, visibleCols }) {
  const removeRow = (idx) => {
    const nu = rows.slice();
    nu.splice(idx, 1);
    setRows(nu);
  };

  const addRow = () => setRows([...rows, emptyMember()]);

  const headers = COLUMN_DEFS.filter((c) => visibleCols[c.key]);

  return (
    <div className="overflow-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[1200px] table-fixed">
        <thead>
          <tr className="sticky top-0 bg-slate-100 text-left text-sm">
            <th className="p-2 w-16">#</th>
            {headers.map((h) => (
              <th key={h.key} style={{ width: h.width }} className="p-2 font-semibold">{h.title}</th>
            ))}
            <th className="p-2 w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t hover:bg-slate-50">
              <td className="p-2 text-sm text-slate-500">{i + 1}</td>
              {headers.map((h) => (
                <td key={h.key} className="p-1 align-top">
                  <EditableCell
                    value={r[h.key]}
                    onChange={(v) => {
                      const nu = rows.slice();
                      nu[i] = { ...nu[i], [h.key]: v };
                      if (h.key === "class") nu[i].role = roleForClass(v);
                      setRows(nu);
                    }}
                    placeholder={h.title}
                    type={h.key.toLowerCase().includes("date") ? "date" : (h.key === "ping" || h.key.includes("Enchant") || h.key === "attendance" || h.key === "boxes") ? "number" : "text"}
                  />
                </td>
              ))}
              <td className="p-2">
                <button onClick={() => removeRow(i)} className="rounded-lg border px-2 py-1 text-sm hover:bg-red-50">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between p-3">
        <button onClick={addRow} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">+ Add Row</button>
        <div className="text-xs text-slate-500">Tip: Click any cell to edit.</div>
      </div>
    </div>
  );
}

function Heatmap({ grid }) {
  const max = Math.max(1, ...grid.flat());
  return (
    <div className="overflow-auto rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm text-slate-600">Availability Heatmap (count of players per hour)</div>
      <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1">
        <div></div>
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="text-center text-[10px] text-slate-500">{h}:00</div>
        ))}
        {grid.map((row, d) => (
          <React.Fragment key={d}>
            <div className="sticky left-0 bg-white pr-1 text-right text-xs font-medium">{DAY_NAMES[d]}</div>
            {row.map((val, h) => {
              const intensity = val / max;
              const bg = `rgba(16, 185, 129, ${0.1 + 0.9 * intensity})`;
              return (
                <div key={h} className="h-6 rounded-sm" style={{ backgroundColor: bg }} title={`${DAY_NAMES[d]} ${h}:00 — ${val} players`} />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Charts({ members }) {
  const { byClass, byRole, readiness } = React.useMemo(() => computeStats(members), [members]);
  const classData = Object.entries(byClass).map(([name, value]) => ({ name, value }));
  const roleData = Object.entries(byRole).map(([name, value]) => ({ name, value }));
  const readyData = EPICS.map((e) => ({ name: e, value: readiness[e] || 0 }));
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border bg-white p-3 shadow-sm">
        <div className="mb-2 text-sm text-slate-600">Class Distribution</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={classData} dataKey="value" nameKey="name" label />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-3 shadow-sm">
        <div className="mb-2 text-sm text-slate-600">Role Balance</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Players" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-3 shadow-sm">
        <div className="mb-2 text-sm text-slate-600">Epic Readiness</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={readyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="# Ready" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ReadyForEpicPill({ members, epic }) {
  const count = members.filter((m) => epicReadiness(m)[epic]).length;
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">{epic}: {count}</span>
  );
}

export default function App() {
  const [members, setMembers] = useLocalStorageState("members", SAMPLE_MEMBERS);
  const [serverTZ, setServerTZ] = useLocalStorageState("serverTZ", DEFAULT_SERVER_TZ);
  const [sourceUrl, setSourceUrl] = useLocalStorageState("sourceUrl", "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [cls, setCls] = useState("");
  const [epicFilter, setEpicFilter] = useState("");
  const [tzFilter, setTzFilter] = useState("");
  const [visibleCols, setVisibleCols] = useLocalStorageState("visibleCols", Object.fromEntries(COLUMN_DEFS.map((c) => [c.key, true])));

  const [bundle, setBundle] = useLocalStorageState("bundle", {});
  useEffect(() => {
    setBundle({ members, serverTZ, sourceUrl, visibleCols });
  }, [members, serverTZ, sourceUrl, visibleCols]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (role && (m.role || roleForClass(m.class)) !== role) return false;
      if (cls && !(m.class || "").toLowerCase().includes(cls.toLowerCase())) return false;
      if (tzFilter && !(m.timezone || "").toLowerCase().includes(tzFilter.toLowerCase())) return false;
      if (epicFilter && !epicReadiness(m)[epicFilter]) return false;
      if (!q) return true;
      const blob = [
        m.player, m.discord, m.character, m.class, m.role, m.subclassPlan, m.country, m.region,
        m.timezone, m.voice, m.availability, m.weapon, m.armorSet, m.jewels, m.epicsHave,
        m.epicsWant, m.gearPriority, m.notes
      ].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [members, role, cls, tzFilter, epicFilter, query]);

  const grid = useMemo(() => availabilityHeatmap(filtered), [filtered]);

  useEffect(() => {
    try {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const s = hash.get("state");
      if (s) {
        const obj = JSON.parse(decodeURIComponent(atob(s)));
        if (obj.members) setMembers(obj.members);
        if (obj.serverTZ) setServerTZ(obj.serverTZ);
        if (obj.visibleCols) setVisibleCols(obj.visibleCols);
        if (obj.sourceUrl) setSourceUrl(obj.sourceUrl);
      }
    } catch {}
  }, []);

  function shareLink() {
    const obj = { members, serverTZ, visibleCols, sourceUrl };
    const enc = btoa(encodeURIComponent(JSON.stringify(obj)));
    const url = `${location.origin}${location.pathname}#state=${enc}`;
    navigator.clipboard.writeText(url);
    alert("Shareable link copied to clipboard!");
  }

  async function loadFromUrl() {
    if (!sourceUrl) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const grid = parseCSV(text);
      const [headerRow, ...rows] = grid;
      const headers = headerRow.map((h) => h.trim());
      const colIndex = Object.fromEntries(headers.map((h, i) => [h, i]));
      const required = COLUMN_DEFS.map(c => c.key);
      for (const k of required) {
        if (!(k in colIndex)) throw new Error(`Missing column: ${k}`);
      }
      const out = rows.filter((r) => r.length && r.some((x) => x && x.trim())).map((r) => {
        const obj = {};
        for (const k of required) obj[k] = r[colIndex[k]] ?? "";
        if (!obj.role) obj.role = roleForClass(obj.class);
        obj.ping = obj.ping ? Number(obj.ping) : "";
        obj.weaponEnchant = obj.weaponEnchant ? Number(obj.weaponEnchant) : "";
        obj.armorEnchantAvg = obj.armorEnchantAvg ? Number(obj.armorEnchantAvg) : "";
        obj.attendance = obj.attendance ? Number(obj.attendance) : "";
        obj.boxes = obj.boxes ? Number(obj.boxes) : "";
        return obj;
      });
      setMembers(out);
    } catch (e) {
      setError(`Load failed: ${e.message}. Ensure the link is a PUBLIC raw CSV (no login needed).`);
    } finally {
      setLoading(false);
    }
  }

  function uploadCsv(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const grid = parseCSV(text);
        const [headerRow, ...rows] = grid;
        const headers = headerRow.map((h) => h.trim());
        const colIndex = Object.fromEntries(headers.map((h, i) => [h, i]));
        const out = rows.filter((r) => r.length && r.some((x) => x && x.trim())).map((r) => {
          const obj = {};
          for (const k of COLUMN_DEFS.map(c => c.key)) obj[k] = r[colIndex[k]] ?? "";
          if (!obj.role) obj.role = roleForClass(obj.class);
          return obj;
        });
        setMembers(out);
      } catch (e) {
        setError("CSV parsing failed: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  function exportCsv() {
    const csv = toCSV(members, COLUMN_DEFS.map(c => c.key));
    download("l2_roster_export.csv", csv);
  }
  function exportJson() {
    download("l2_roster_export.json", JSON.stringify({ members, serverTZ, createdAt: new Date().toISOString() }, null, 2));
  }
  function downloadTemplate() {
    const csv = toCSV([{}], COLUMN_DEFS.map(c => c.key));
    download("l2_roster_template.csv", csv);
  }
  function seedSample() {
    setMembers(SAMPLE_MEMBERS);
  }
  function clearAll() {
    if (!confirm("Clear all rows?")) return;
    setMembers([]);
  }

  const fileInputRef = useRef(null);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lineage 2 — Roster & Epics Planner</h1>
          <p className="text-sm text-slate-600">Track classes, timezones, availability for epics PvP, gear, priorities, and more. Fully editable and shareable.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={shareLink} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">Share Link</button>
          <button onClick={exportCsv} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">Export CSV</button>
          <button onClick={exportJson} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">Export JSON</button>
          <button onClick={downloadTemplate} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">Template CSV</button>
          <button onClick={seedSample} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">Load Sample</button>
          <button onClick={clearAll} className="rounded-xl border px-3 py-2 text-sm hover:bg-red-50">Clear</button>
        </div>
      </header>

      <details className="mt-4 rounded-xl border p-4 bg-white shadow-sm open:shadow-md">
        <summary className="cursor-pointer font-semibold">Help: Data sources, CSV format & tips</summary>
        <div className="mt-3 space-y-3 text-sm leading-relaxed">
          <p><strong>Best way (Google Sheets → CSV URL):</strong> Share → <em>Anyone with the link</em>, then File → <em>Publish to the web</em> → CSV. Paste the URL here (must end with <code>output=csv</code>).</p>
          <p><strong>GitHub CSV:</strong> Use the <em>raw</em> link, e.g. <code>https://raw.githubusercontent.com/...</code></p>
          <p>If loading fails, it's usually a <em>CORS</em> issue. Try the two methods above, or use the <em>Upload CSV</em> button.</p>
        </div>
      </details>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium">CSV Source URL</label>
            <input
              className="w-full rounded-xl border p-2"
              placeholder="https://docs.google.com/spreadsheets/d/…/pub?output=csv"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadFromUrl} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50" disabled={loading}>
              {loading ? "Loading…" : "Load from URL"}
            </button>
            <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && uploadCsv(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">Upload CSV</button>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Server Timezone (IANA)</label>
            <input
              className="w-full rounded-xl border p-2"
              placeholder="America/New_York"
              value={serverTZ}
              onChange={(e) => setServerTZ(e.target.value)}
            />
          </div>
        </div>
        {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Players" value={members.length} />
        <StatCard label="Avg Attendance" value={Math.round((members.reduce((a, m) => a + (Number(m.attendance) || 0), 0) / Math.max(1, members.length)))} sub="%" />
        <StatCard label="Avg Gear Score" value={Math.round((members.reduce((a, m) => a + gearScore(m), 0) / Math.max(1, members.length)))} />
        <div className="flex items-center gap-2 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Autosave</div>
          <Toggle checked={true} onChange={() => {}} />
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {EPICS.map((e) => (
          <ReadyForEpicPill key={e} members={members} epic={e} />
        ))}
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <Filters
          query={query}
          setQuery={setQuery}
          role={role}
          setRole={setRole}
          cls={cls}
          setCls={setCls}
          epic={epicFilter}
          setEpic={setEpicFilter}
          tz={tzFilter}
          setTz={setTzFilter}
        />
      </section>

      <details className="rounded-xl border bg-white p-3 shadow-sm">
        <summary className="cursor-pointer font-medium">Columns</summary>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {COLUMN_DEFS.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!visibleCols[c.key]}
                onChange={(e) => setVisibleCols({ ...visibleCols, [c.key]: e.target.checked })}
              />
              {c.title}
            </label>
          ))}
        </div>
      </details>

      <DataTable rows={filtered} setRows={(r) => { setMembers(r); }} visibleCols={visibleCols} />

      <Charts members={filtered} />

      <Heatmap grid={grid} />

      <footer className="py-6 text-center text-xs text-slate-400">
        Built for Lineage 2 planning • Save/Share/Export supported • Tip: Use Google Sheets → Publish to CSV for auto-updating roster
      </footer>
    </div>
  );
}
