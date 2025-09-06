// src/lib/sheetsClient.js
const API_URL = import.meta.env.VITE_SHEETS_API_URL; // e.g., https://script.google.com/macros/s/.../exec
const API_TOKEN = import.meta.env.VITE_SHEETS_TOKEN; // same as API_TOKEN in Apps Script

export async function loadState() {
  if (!API_URL) throw new Error("Missing VITE_SHEETS_API_URL");
  const res = await fetch(`${API_URL}?action=get`, { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function saveState(state) {
  if (!API_URL || !API_TOKEN) throw new Error("Missing VITE_SHEETS_API_URL or VITE_SHEETS_TOKEN");
  const url = `${API_URL}?token=${encodeURIComponent(API_TOKEN)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
