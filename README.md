# Lineage 2 — Roster & Epics Planner

## Run locally
```bash
npm install
npm run dev
```

## Deploy on Vercel
- Upload this folder as a new project on Vercel, or push to GitHub and import.
- Build Command: `npm run build`
- Output Directory: `dist`

## Notes
- Uses Vite + React + Recharts.
- Tailwind is added via CDN in `index.html` (no PostCSS config needed).
- App state is saved in `localStorage`. Use the "Share Link" button to generate a link with embedded state.
