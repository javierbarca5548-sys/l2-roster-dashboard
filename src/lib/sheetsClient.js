// src/lib/sheetsClient.js
const API_URL = import.meta.env.VITE_SHEETS_API_URL;
const API_TOKEN = import.meta.env.VITE_SHEETS_TOKEN;

function withToken(url, extraQuery = "") {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(API_TOKEN)}${extraQuery}`;
}

export async function loadState() {
  if (!API_URL || !API_TOKEN) throw new Error("Missing API_URL or API_TOKEN");
  const res = await fetch(withToken(API_URL, "&action=get"), { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function saveState(state) {
  if (!API_URL || !API_TOKEN) throw new Error("Missing API_URL or API_TOKEN");
  const res = await fetch(withToken(API_URL), {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
