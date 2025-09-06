# Lineage 2 Roster Dashboard — Google Sheets Sync Bundle

## What’s Inside
- src/App.jsx — React dashboard (integrated with Sheets sync)
- src/lib/sheetsClient.js — fetch helpers with token support
- .env.example — env vars (URL + token)
- roster_template_with_samples.csv — sample roster data with correct headers
- README.md — this file

## Setup
1. Copy .env.example to .env and ensure values are correct.
2. Deploy your Google Apps Script Web App with TOKEN = "my-super-secret-123".
3. On Vercel, set the same env vars.
4. Replace files in your project with these versions.
5. Run locally with `npm run dev`, then redeploy to Vercel.

## Google Sheet
- Must have a tab "State" (leave blank).
- Must have a tab "Roster" with headers from the CSV included here.
