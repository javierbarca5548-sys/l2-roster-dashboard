# Lineage2 Roster Dashboard (Google Sheets Sync)

## Files
- src/App.jsx — full dashboard (integrated with Google Sheets sync)
- src/lib/sheetsClient.js — helper to GET/POST state to your Apps Script web app
- .env.example — environment variables
- README.md — this file

## Setup
1. Copy .env.example to .env and fill with your Web App URL and token.
2. Deploy your Google Apps Script with TOKEN='my-super-secret-123'.
3. In Vercel, add env vars: VITE_SHEETS_API_URL and VITE_SHEETS_TOKEN.
4. Replace App.jsx and sheetsClient.js with these versions.
5. Run `npm install && npm run dev` to test locally.
6. Push/redeploy to Vercel.

Open dashboard in two browsers and edits will sync via Google Sheets every ~5s.
